import { randomBytes } from 'node:crypto'
import { appendFile, link, readFile, rename, stat, unlink, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { sha256 } from './patch.mjs'

// The session's authoritative record: an append-only log where every event carries the hash of the one before it.
// State is derived from it, and the files that mirror state (developer-decisions.json, applications/) must agree with it.
// Editing or forging an entry by hand breaks the chain or the agreement and every state-changing command refuses to go on.
// This is tamper-EVIDENT, not tamper-proof: anyone who can write files and knows the format can rebuild a chain.
const logName = 'events.jsonl'
const lockName = 'events.lock'
const commandLockName = 'command.lock'
const genesis = '0'.repeat(64)
export const currentSchemaVersion = 2

const hashOf = (previous, body) => sha256(`${previous}\n${JSON.stringify(body)}`)
const fail = message => { throw new TypeError(message) }

function isProcessAlive(pid) {
  try { process.kill(pid, 0); return true } catch { return false }
}

// Attempts to expire a stale lock at lockPath. Stale = dead pid (for parseable locks) or mtime > 10 s (for unparseable).
// Uses rename-verify-unlink to avoid a race where two processes both decide to remove the same lock.
async function tryExpireStale(lockPath) {
  let lockText
  try { lockText = await readFile(lockPath, 'utf8') } catch { return }
  let parsed = null
  try { parsed = JSON.parse(lockText) } catch { /* unparseable */ }
  let stale = false
  if (parsed?.pid) {
    stale = !isProcessAlive(parsed.pid)
  } else {
    try { stale = Date.now() - (await stat(lockPath)).mtimeMs > 10000 } catch { return }
  }
  if (!stale) return
  const stolen = `${lockPath}.removing.${process.pid}.${randomBytes(4).toString('hex')}`
  try {
    await rename(lockPath, stolen)
    let stolenText
    try { stolenText = await readFile(stolen, 'utf8') } catch { return }
    if (stolenText !== lockText) { await rename(stolen, lockPath).catch(() => {}); return }
    let stolenParsed = null
    try { stolenParsed = JSON.parse(stolenText) } catch { /* still unparseable */ }
    if (stolenParsed?.pid && isProcessAlive(stolenParsed.pid)) { await rename(stolen, lockPath).catch(() => {}); return }
    await unlink(stolen).catch(() => {})
  } catch { /* rename raced — another process got there first */ }
}

// Acquires lockPath atomically via link(). Writes content to a temp file first so the lock is never empty.
// Returns a token string; caller must pass it to releaseLock.
async function acquireLock(lockPath, message) {
  const token = randomBytes(8).toString('hex')
  const tmpPath = `${lockPath}.${process.pid}.${token}.tmp`
  await writeFile(tmpPath, JSON.stringify({ pid: process.pid, createdAt: Date.now(), token }), { mode: 0o600 })
  let acquired = false
  try {
    for (let attempt = 0; attempt < 6; attempt++) {
      try { await link(tmpPath, lockPath); acquired = true; break } catch (err) {
        if (err.code !== 'EEXIST') throw err
        await tryExpireStale(lockPath)
        if (attempt < 5) await new Promise(resolve => setTimeout(resolve, 50 * (attempt + 1)))
      }
    }
  } finally { await unlink(tmpPath).catch(() => {}) }
  if (!acquired) fail(message)
  return token
}

async function releaseLock(lockPath, token) {
  try { const c = JSON.parse(await readFile(lockPath, 'utf8')); if (c.token === token) await unlink(lockPath) } catch { /* already gone or foreign lock — nothing to do */ }
}

async function withEventLock(dir, fn) {
  const lockPath = path.join(dir, lockName)
  const token = await acquireLock(lockPath, 'Another command is holding the session event lock; try again in a moment')
  try { return await fn() } finally { await releaseLock(lockPath, token) }
}

/** Session-level command lock for preventing concurrent state-changing commands in the same session. */
export async function withCommandLock(dir, fn) {
  const lockPath = path.join(dir, commandLockName)
  const token = await acquireLock(lockPath, 'Another command is already running in this session; try again in a moment')
  try { return await fn() } finally { await releaseLock(lockPath, token) }
}

/** Reads and verifies the whole log. A missing log is reported, never created implicitly. */
export async function readLog(dir) {
  let text
  try { text = await readFile(path.join(dir, logName), 'utf8') } catch { return { events: [], error: 'there is no event log' } }
  const events = []
  let previous = genesis
  const lines = text.split('\n').filter(Boolean)
  for (const [index, line] of lines.entries()) {
    let event
    try { event = JSON.parse(line) } catch { return { events, error: `entry ${index + 1} is not valid JSON` } }
    const { seq, at, type, data } = event
    if (seq !== index + 1 || event.prev !== previous || event.hash !== hashOf(previous, { seq, at, type, data })) return { events, error: `entry ${index + 1} does not continue the chain (edited, removed, or reordered)` }
    events.push(event)
    previous = event.hash
  }
  return { events, error: null }
}

/** Appends one event after acquiring an exclusive lock, verifying the chain, and confirming the write. */
export async function appendEvent(dir, type, data = {}) {
  return withEventLock(dir, async () => {
    const { events, error } = await readLog(dir)
    if (error && !(error === 'there is no event log' && type === 'session-started')) fail(`The session event log is not intact: ${error}. The session cannot vouch for its own state; nothing was changed`)
    const seq = events.length + 1
    const previous = events.at(-1)?.hash ?? genesis
    const at = new Date().toISOString()
    const event = { seq, at, type, data, prev: previous, hash: hashOf(previous, { seq, at, type, data }) }
    await appendFile(path.join(dir, logName), `${JSON.stringify(event)}\n`, { mode: 0o600 })
    const after = await readLog(dir)
    if (after.error || after.events.length !== seq || after.events.at(-1).hash !== event.hash) fail('The session event log could not be verified after writing; run the command again')
    return event
  })
}

/** The latest decision per proposal as the log records it; a revision voids the decisions of the proposals it changed. */
export function decisionsFrom(events) {
  const decisions = new Map()
  for (const { type, data } of events) {
    if (type === 'decided') decisions.set(data.id, { decision: data.decision, patchSha256: data.patchSha256 ?? null })
    else if (type === 'revised') for (const id of data.voided) decisions.delete(id)
  }
  return decisions
}

export const wasPresented = (events, id, patchSha256) => events.some(event => event.type === 'presented' && event.data.id === id && event.data.patchSha256 === patchSha256)
export const wasPreviewed = (events, kind, token) => events.some(event => event.type === `${kind}-previewed` && event.data.token === token)

/** Walks the log in order: every application must have happened under an approval of exactly that diff that was still in force. */
export function checkApplied(events) {
  const approved = new Map()
  for (const { seq, type, data } of events) {
    if (type === 'decided') { if (data.decision === 'approved') approved.set(data.id, data.patchSha256); else approved.delete(data.id) }
    else if (type === 'revised') for (const id of data.voided) approved.delete(id)
    else if (type === 'applied' && approved.get(data.id) !== data.patchSha256) return `entry ${seq} applied ${data.id} without an approval of that exact diff in force`
  }
  return null
}

/**
 * Verifies the session's mirrored files against the log. Called before anything that changes state or vouches for it.
 * validatedText is the current validated.json, application files are [{ name, text }].
 */
export function checkConsistency({ events, file, validatedText, applicationFiles }) {
  const derived = decisionsFrom(events)
  for (const decision of file.decisions) {
    const logged = derived.get(decision.id)
    if (!logged || logged.decision !== decision.decision || (decision.decision === 'approved' && logged.patchSha256 !== decision.patchSha256)) return `the decision for ${decision.id} in developer-decisions.json does not match the event log (edited outside the tool)`
  }
  for (const [id, logged] of derived) if (!file.decisions.some(decision => decision.id === id && decision.decision === logged.decision)) return `the event log records a decision for ${id} that developer-decisions.json does not show`
  const validated = [...events].reverse().find(event => ['session-started', 'revised'].includes(event.type))?.data.validatedSha256
  if (validated !== sha256(validatedText)) return 'validated.json differs from the version the session recorded (the proposals were changed outside the tool; use revise)'
  const logged = events.filter(event => event.type === 'applied').map(event => event.data)
  for (const { name, text } of applicationFiles) {
    const appliedEntry = logged.find(record => record.record === name)
    if (!appliedEntry) return `applications/${name} has no matching entry in the event log (written or edited outside the tool)`
    // A tested event may have updated the record file after apply; accept its SHA over the applied event's SHA
    const testedEntry = [...events].reverse().find(e => e.type === 'tested' && e.data.record === name)
    const expectedSha = testedEntry?.data.recordSha256 ?? appliedEntry.recordSha256
    if (sha256(text) !== expectedSha) return `applications/${name} has no matching entry in the event log (written or edited outside the tool)`
  }
  for (const record of logged) if (!applicationFiles.some(({ name }) => name === record.record)) return `applications/${record.record} is in the event log but missing`
  return checkApplied(events)
}

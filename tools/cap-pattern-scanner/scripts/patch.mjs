import { createHash } from 'node:crypto'
import { constants } from 'node:fs'
import { lstat, open } from 'node:fs/promises'
import path from 'node:path'

const allowedExtensions = new Set(['.cds', '.js', '.cjs', '.mjs', '.ts'])
const excludedDirectories = new Set(['node_modules', 'gen', 'dist', 'coverage', 'target', 'vendor'])
const maxBytes = 1024 * 1024

export const sha256 = value => createHash('sha256').update(value).digest('hex')

/** Patch text is hashed after normalising line endings and surrounding blank lines. */
export const normalizePatch = patch => `${String(patch).replace(/\r\n?/g, '\n').replace(/^\n+/, '').replace(/\s+$/, '')}\n`
export const patchSha256 = patch => sha256(normalizePatch(patch))

/** A project-relative path that stays inside the scan policy (no traversal, hidden, vendor, or odd extensions). */
export function safeProjectPath(raw) {
  const file = String(raw).replace(/\\/g, '/').replace(/^"|"$/g, '')
  if (!file || file.startsWith('/') || /^[A-Za-z]:/.test(file) || file.includes('\0')) throw new TypeError(`Unsafe patch path: ${raw}`)
  const normalized = path.posix.normalize(file)
  if (normalized === '..' || normalized.startsWith('../')) throw new TypeError(`Patch path leaves the project: ${raw}`)
  if (normalized.split('/').some(part => part.startsWith('.') || excludedDirectories.has(part))) throw new TypeError(`Patch path is outside the scan policy: ${raw}`)
  if (!allowedExtensions.has(path.posix.extname(normalized))) throw new TypeError(`Patch path is not a CDS or JavaScript/TypeScript source file: ${raw}`)
  return normalized
}

const headerPath = line => line.slice(4).split('\t')[0].trim()

/** Parses a unified diff of existing files. Creating, deleting, and renaming files is refused. */
export function parsePatch(patch) {
  const lines = String(patch).replace(/\r\n?/g, '\n').split('\n')
  while (lines.length && lines.at(-1) === '') lines.pop()
  const files = []
  let index = 0
  while (index < lines.length) {
    if (/^(new file|deleted file|rename |similarity |old mode|new mode)/.test(lines[index])) throw new TypeError('Patches may only change the contents of existing files')
    if (/^(diff |index )/.test(lines[index])) { index += 1; continue }
    if (!lines[index].startsWith('--- ') || !lines[index + 1]?.startsWith('+++ ')) throw new TypeError(`Expected a "--- " and "+++ " file header at patch line ${index + 1}`)
    let [oldPath, newPath] = [headerPath(lines[index]), headerPath(lines[index + 1])]
    if (oldPath === '/dev/null' || newPath === '/dev/null') throw new TypeError('Patches may not create or delete files')
    if (/^a\//.test(oldPath) && /^b\//.test(newPath)) { oldPath = oldPath.slice(2); newPath = newPath.slice(2) }
    if (oldPath !== newPath) throw new TypeError('Patches may not rename files')
    const file = safeProjectPath(oldPath)
    index += 2
    const hunks = []
    while (index < lines.length && lines[index].startsWith('@@')) {
      const header = /^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/.exec(lines[index])
      if (!header) throw new TypeError(`Malformed hunk header at patch line ${index + 1}`)
      const hunk = { oldStart: Number(header[1]), oldCount: header[2] === undefined ? 1 : Number(header[2]), newCount: header[4] === undefined ? 1 : Number(header[4]), lines: [] }
      index += 1
      let [oldSeen, newSeen] = [0, 0]
      while (index < lines.length && (oldSeen < hunk.oldCount || newSeen < hunk.newCount)) {
        const raw = lines[index]
        if (raw.startsWith('\\')) { index += 1; continue }
        const [operation, text] = raw === '' ? [' ', ''] : [raw[0], raw.slice(1)]
        if (![' ', '-', '+'].includes(operation)) throw new TypeError(`Unexpected line inside a hunk at patch line ${index + 1}`)
        hunk.lines.push({ operation, text })
        if (operation !== '+') oldSeen += 1
        if (operation !== '-') newSeen += 1
        index += 1
      }
      if (oldSeen !== hunk.oldCount || newSeen !== hunk.newCount) throw new TypeError(`A hunk of ${file} has line counts that do not match its header`)
      hunks.push(hunk)
    }
    if (!hunks.length) throw new TypeError(`The patch for ${file} has no hunks`)
    while (index < lines.length && lines[index].startsWith('\\')) index += 1
    files.push({ file, hunks })
  }
  if (!files.length) throw new TypeError('The patch contains no file changes')
  if (new Set(files.map(entry => entry.file)).size !== files.length) throw new TypeError('A file appears more than once in the patch')
  return files
}

const headerStart = (position, count) => (count === 0 ? position : position + 1)

/** Applies hunks at their stated positions, with no fuzz; every context and removed line must match exactly. */
export function applyHunks(original, hunks) {
  const crlf = (original.match(/\r\n/g) ?? []).length
  const lf = (original.match(/(?<!\r)\n/g) ?? []).length
  const eol = crlf > lf ? '\r\n' : '\n'
  const finalNewline = /\n$/.test(original)
  const lines = original.replace(/\r\n/g, '\n').split('\n')
  if (finalNewline) lines.pop()
  const applied = []
  let offset = 0
  let previousEnd = 0
  for (const [number, hunk] of hunks.entries()) {
    const before = hunk.oldCount === 0 ? hunk.oldStart : hunk.oldStart - 1
    if (before < previousEnd) throw new TypeError(`Hunk ${number + 1} overlaps or precedes the previous hunk`)
    const at = before + offset
    let position = at
    const replacement = []
    for (const { operation, text } of hunk.lines) {
      if (operation === '+') { replacement.push(text); continue }
      if (lines[position] !== text) {
        throw new TypeError(`Hunk ${number + 1} does not match the source at line ${before + (position - at) + 1}: expects ${JSON.stringify(text)}, the file has ${JSON.stringify(lines[position] ?? '(end of file)')}`)
      }
      if (operation === ' ') replacement.push(lines[position])
      position += 1
    }
    lines.splice(at, position - at, ...replacement)
    applied.push({ oldStart: headerStart(before, position - at), oldCount: position - at, newStart: headerStart(at, replacement.length), newCount: replacement.length, lines: hunk.lines })
    previousEnd = before + (position - at)
    offset += replacement.length - (position - at)
  }
  return { text: lines.join(eol) + (finalNewline ? eol : ''), hunks: applied }
}

/** The lines of the original file a hunk reads or removes, as a half-open range of 0-based line positions (context included). */
export function hunkRange(hunk) {
  const start = hunk.oldCount === 0 ? hunk.oldStart : hunk.oldStart - 1
  return [start, start + hunk.oldCount]
}

/** Two hunks of the same original file conflict when they read or change a common line; touching ranges do not conflict. */
export function hunksOverlap(a, b) {
  const [aStart, aEnd] = hunkRange(a)
  const [bStart, bEnd] = hunkRange(b)
  if (a.oldCount === 0 && b.oldCount === 0) return aStart === bStart
  if (a.oldCount === 0) return bStart < aStart && aStart < bEnd
  if (b.oldCount === 0) return aStart < bStart && bStart < aEnd
  return aStart < bEnd && bStart < aEnd
}

/** How many lines earlier changes (hunks of other proposals, in original-file coordinates) moved the lines this hunk reads. */
export const hunkShift = (hunk, earlier) => earlier.filter(other => hunkRange(other)[1] <= hunkRange(hunk)[0]).reduce((sum, other) => sum + other.newCount - other.oldCount, 0)

/** The unified diff that undoes `files` (each with the hunks returned by applyHunks). */
export function reversePatch(files) {
  const out = []
  for (const { file, hunks } of files) {
    out.push(`--- a/${file}`, `+++ b/${file}`)
    for (const hunk of hunks) {
      out.push(`@@ -${hunk.newStart},${hunk.newCount} +${hunk.oldStart},${hunk.oldCount} @@`)
      for (const { operation, text } of hunk.lines) out.push(`${operation === '+' ? '-' : operation === '-' ? '+' : ' '}${text}`)
    }
  }
  return `${out.join('\n')}\n`
}

export async function readProjectFile(absolute) {
  const handle = await open(absolute, constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0))
  try {
    const stat = await handle.stat()
    if (!stat.isFile()) throw new TypeError('Patch targets must be regular files')
    if (stat.size > maxBytes) throw new TypeError('Patch targets must be smaller than 1 MiB')
    const buffer = Buffer.alloc(stat.size)
    let length = 0
    while (length < buffer.length) {
      const { bytesRead } = await handle.read(buffer, length, buffer.length - length, length)
      if (!bytesRead) break
      length += bytesRead
    }
    return { text: buffer.subarray(0, length).toString('utf8'), sha256: sha256(buffer.subarray(0, length)) }
  } finally {
    await handle.close()
  }
}

/**
 * Parses the patch and applies it in memory to the project's current files. Writes nothing.
 * `earlier` (file -> hunks of other approved proposals already applied or about to be, in original-file coordinates) lets an
 * independent proposal on the same file apply on top of them: its positions shift by the lines they added or removed, every
 * context and removed line must still match exactly, and a hunk that touches a line an earlier change touched is refused.
 * `texts` (file -> text) replaces the file on disk, so a whole sequence can be checked in memory before anything is written.
 */
export async function verifyPatchAgainstProject(root, patch, { earlier = new Map(), texts = new Map() } = {}) {
  const parsed = parsePatch(patch)
  const files = []
  for (const { file, hunks } of parsed) {
    let cursor = root
    for (const part of file.split('/')) {
      cursor = path.join(cursor, part)
      let stat
      try { stat = await lstat(cursor) } catch { throw new TypeError(`Patch target does not exist: ${file}`) }
      if (stat.isSymbolicLink()) throw new TypeError(`Patch target is reached through a symlink: ${file}`)
    }
    const source = texts.has(file) ? { text: texts.get(file), sha256: sha256(texts.get(file)) } : await readProjectFile(path.join(root, file))
    const before = earlier.get(file) ?? []
    for (const hunk of hunks) {
      const clash = before.find(other => hunksOverlap(hunk, other))
      if (clash) throw new TypeError(`${file}: the change at lines ${hunkRange(hunk)[0] + 1}-${Math.max(hunkRange(hunk)[1], hunkRange(hunk)[0] + 1)} overlaps an earlier approved change at lines ${hunkRange(clash)[0] + 1}-${Math.max(hunkRange(clash)[1], hunkRange(clash)[0] + 1)}`)
    }
    const result = applyHunks(source.text, hunks.map(hunk => ({ ...hunk, oldStart: hunk.oldStart + hunkShift(hunk, before) })))
    files.push({ file, baseSha256: source.sha256, afterSha256: sha256(result.text), beforeText: source.text, afterText: result.text, hunks: result.hunks })
  }
  return { patchSha256: patchSha256(patch), files }
}

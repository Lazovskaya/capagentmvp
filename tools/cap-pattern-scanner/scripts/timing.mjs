import { appendFile, readFile } from 'node:fs/promises'
import { performance } from 'node:perf_hooks'

/**
 * Elapsed time and output size of each tool command, kept beside the session (timings.jsonl) or in the file named by
 * CAP_AI_11_TIMING_FILE. It is a measurement aid only: never read for decisions, never part of the session's trusted state,
 * and a failure to write it is ignored. The tool cannot see the model: model turns and model tool calls are not in here.
 */
export function startTiming() {
  const started = performance.now()
  const startedAt = new Date().toISOString()
  let bytes = 0
  const write = process.stdout.write.bind(process.stdout)
  process.stdout.write = (chunk, ...rest) => { bytes += Buffer.byteLength(String(chunk)); return write(chunk, ...rest) }
  return { finish: async (file, entry) => recordTiming(file, { ...entry, startedAt, ms: Math.round(performance.now() - started), stdoutBytes: bytes, exitCode: process.exitCode ?? 0 }) }
}

export async function recordTiming(file, entry) {
  if (!file) return
  try { await appendFile(file, `${JSON.stringify(entry)}\n`, { mode: 0o600 }) } catch { /* measurement only */ }
}

/** Totals per command from a timings file; an unreadable or missing file is an empty result. */
export async function readTimings(file) {
  let text = ''
  try { text = await readFile(file, 'utf8') } catch { return { calls: 0, totalMs: 0, stdoutBytes: 0, commands: {} } }
  const commands = {}
  for (const line of text.split('\n').filter(Boolean)) {
    let entry
    try { entry = JSON.parse(line) } catch { continue }
    const slot = commands[`${entry.tool ?? 'session'} ${entry.command}`] ??= { calls: 0, totalMs: 0, maxMs: 0, stdoutBytes: 0 }
    slot.calls += 1
    slot.totalMs += entry.ms
    slot.maxMs = Math.max(slot.maxMs, entry.ms)
    slot.stdoutBytes += entry.stdoutBytes
  }
  const all = Object.values(commands)
  return { calls: all.reduce((sum, slot) => sum + slot.calls, 0), totalMs: all.reduce((sum, slot) => sum + slot.totalMs, 0), stdoutBytes: all.reduce((sum, slot) => sum + slot.stdoutBytes, 0), commands }
}

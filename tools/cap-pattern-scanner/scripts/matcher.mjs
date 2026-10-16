import { Worker, isMainThread, parentPort } from 'node:worker_threads'

if (!isMainThread) {
  parentPort.on('message', ({ text, extension, patterns, maximum }) => {
    const newlines = []
    for (let index = 0; index < text.length; index += 1) {
      if (text[index] === '\n') newlines.push(index)
    }
    function lineAt(offset) {
      let start = 0
      let end = newlines.length
      while (start < end) {
        const middle = Math.floor((start + end) / 2)
        if (newlines[middle] < offset) start = middle + 1
        else end = middle
      }
      return start + 1
    }
    const matches = []
    let remaining = maximum
    let truncated = false
    for (const pattern of patterns) {
      if (!pattern.extensions.includes(extension)) continue
      const lines = new Set()
      for (const signal of pattern.signals) {
        for (const match of text.matchAll(new RegExp(signal, 'g'))) {
          lines.add(lineAt(match.index))
          if (lines.size > remaining) break
        }
        if (lines.size > remaining) break
      }
      const selected = [...lines].sort((left, right) => left - right).slice(0, remaining)
      for (const line of selected) matches.push({ patternId: pattern.id, line })
      if (lines.size > remaining) { truncated = true; break }
      remaining -= selected.length
    }
    parentPort.postMessage({ matches, truncated })
  })
}

export function createMatcher(patterns, timeoutMs = 1000) {
  let worker
  let active = false
  return {
    async match(text, extension, maximum) {
      if (active) throw new Error('Matcher accepts one file at a time')
      active = true
      worker ??= new Worker(new URL('./matcher.mjs', import.meta.url), { execArgv: [] })
      const current = worker
      return new Promise(resolve => {
        let settled = false
        const finish = async (result, terminate = false) => {
          if (settled) return
          settled = true
          clearTimeout(timer)
          current.removeListener('message', onMessage)
          current.removeListener('error', onError)
          current.removeListener('exit', onExit)
          if (terminate) {
            worker = undefined
            await current.terminate()
          }
          active = false
          resolve(result)
        }
        const onMessage = result => { void finish(result) }
        const onError = () => { void finish({ reason: 'matcher-failure' }, true) }
        const onExit = () => { void finish({ reason: 'matcher-failure' }, true) }
        const timer = setTimeout(() => { void finish({ reason: 'analysis-timeout' }, true) }, timeoutMs)
        current.once('message', onMessage)
        current.once('error', onError)
        current.once('exit', onExit)
        current.postMessage({ text, extension, patterns, maximum })
      })
    },
    async close() {
      if (worker) await worker.terminate()
      worker = undefined
    }
  }
}
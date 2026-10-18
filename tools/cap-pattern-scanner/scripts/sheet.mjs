import { lstat, readFile } from 'node:fs/promises'
import path from 'node:path'
import { parseArgs } from 'node:util'
import { loadSheetExcerpts, recordDeveloperDecisions, renderReviewSheet, reviewRows } from './developer-review.mjs'
import { readJsonInput, writeNewFile } from './scan.mjs'

const usage = `Usage:
  node sheet.mjs sheet  --report <brief.json> --decisions <validated.json> [--project <cap-project>] [--output <new-file.md>]
  node sheet.mjs record --report <brief.json> --decisions <validated.json> --sheet <ticked-sheet.md> [--reviewer <name>] [--output <new-file.json>]
sheet writes Markdown the developer ticks (approve, reject, needs-changes, or defer). With --project it shows hash-checked code excerpts.
Applying an approved proposal is a separate step: apply.mjs.
record reads the ticked sheet and prints the developer decisions as JSON. Neither command changes code. --output saves the exact
text printed to a new file only; it refuses existing files and, with --project, paths inside the project.`

try {
  const { values, positionals } = parseArgs({
    options: { report: { type: 'string' }, decisions: { type: 'string' }, project: { type: 'string' }, sheet: { type: 'string' }, reviewer: { type: 'string' }, output: { type: 'string' }, help: { type: 'boolean' } },
    allowPositionals: true
  })
  const [command] = positionals
  if (values.help || !['sheet', 'record'].includes(command) || positionals.length !== 1 || !values.report || !values.decisions) {
    console.log(usage)
    process.exitCode = values.help ? 0 : 1
  } else {
    const report = await readJsonInput(values.report)
    const validated = await readJsonInput(values.decisions)
    let text
    if (command === 'sheet') {
      const { brief, rows } = reviewRows(report, validated)
      const excerpts = values.project ? await loadSheetExcerpts(values.project, report, rows) : undefined
      text = renderReviewSheet({ brief, rows, excerpts })
    } else {
      if (!values.sheet) throw new TypeError('record needs --sheet <ticked-sheet.md>')
      const absolute = path.resolve(values.sheet)
      const stat = await lstat(absolute)
      if (!stat.isFile() || stat.size > 32 * 1024 * 1024) throw new Error('The sheet must be a regular file under 32 MiB')
      text = `${JSON.stringify(recordDeveloperDecisions({ report, validated, sheet: await readFile(absolute, 'utf8'), reviewer: values.reviewer }), null, 2)}\n`
    }
    if (values.output !== undefined) await writeNewFile(values.output, text, command === 'sheet' ? values.project : undefined)
    process.stdout.write(text)
  }
} catch (error) {
  const detail = error instanceof TypeError ? ` ${error.message}.` : ''
  console.error(`Sheet failed (${error.code ?? 'INVALID_INPUT'});${detail} Check the file names, that both files come from the same scan, and that --output is a new file.`)
  process.exitCode = 1
}

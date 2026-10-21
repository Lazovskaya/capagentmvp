import assert from 'node:assert/strict'
import { test } from 'node:test'
import { mkdtemp, mkdir, writeFile, readFile, readdir, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

test('working-tree ZIP runs outside the factory without Git, adapters, npm install, or customer writes', async context => {
  const root = await mkdtemp(path.join(tmpdir(), 'cap-pattern-delivery-'))
  context.after(() => rm(root, { recursive: true, force: true }))
  const factory = fileURLToPath(new URL('../../../', import.meta.url))
  const python = process.env.PYTHON ?? 'python3'
  const packaged = spawnSync(python, [path.join(factory, 'scripts/package_client_artifacts.py'),
    '--client-name', 'cap-ai-11-test', '--use-case', 'CAP-AI-11', '--out-dir', root], { encoding: 'utf8' })
  assert.equal(packaged.status, 0, packaged.stderr || packaged.stdout)
  const extracted = path.join(root, 'extracted')
  const extraction = spawnSync(python, ['-c',
    'import json,sys; from zipfile import ZipFile; archive=ZipFile(sys.argv[1]); print(json.dumps(archive.namelist())); archive.extractall(sys.argv[2])',
    path.join(root, 'client-artifacts-cap-ai-11-test.zip'), extracted], { encoding: 'utf8' })
  assert.equal(extraction.status, 0, extraction.stderr)
  const inventory = JSON.parse(extraction.stdout)
  assert.ok(inventory.includes('skills/cap-suggest-patterns/SKILL.md'))
  assert.ok(inventory.includes('tools/cap-pattern-scanner/README.md'))
  assert.ok(inventory.includes('tools/cap-pattern-scanner/scripts/scan.mjs'))
  assert.equal(inventory.some(name => name.endsWith('.meta.md') || name.includes('node_modules/') || name.startsWith('.git/')), false)
  const catalog = JSON.parse(await readFile(path.join(extracted, 'tools/cap-pattern-scanner/catalog.json'), 'utf8'))
  assert.equal(catalog.patterns.length, 9)
  const client = path.join(root, 'client')
  await mkdir(path.join(client, 'srv'), { recursive: true })
  await mkdir(path.join(client, 'db'))
  await writeFile(path.join(client, 'package.json'), JSON.stringify({ dependencies: { '@sap/cds': '^9' } }))
  const source = [
    "readFileSync('messages.properties')", 'req.query.SELECT.limit = {}',
    'req.reject(502, error.message)', "cds.connect.to('RemoteService')",
    "if (!req.data.title) req.reject(400, 'TITLE_REQUIRED')",
    "SELECT.from(Books).where('ID=' + input)", 'const tx = db.tx()'
  ].join('\n')
  await writeFile(path.join(client, 'srv', 'service.js'), source)
  await writeFile(path.join(client, 'db', 'schema.cds'), '@odata.draft.enabled\nentity Books { key ID : UUID; }')
  const cli = path.join(extracted, 'tools/cap-pattern-scanner/scripts/scan.mjs')
  const scan = spawnSync(process.execPath, [cli, client, '--full'], { cwd: root, encoding: 'utf8' })
  assert.equal(scan.status, 0, scan.stderr)
  const report = JSON.parse(scan.stdout)
  assert.equal(report.coverage.complete, true)
  assert.equal(new Set(report.findings.map(finding => finding.patternId)).size, 9)
  const compact = spawnSync(process.execPath, [cli, client], { cwd: root, encoding: 'utf8' })
  assert.equal(compact.status, 0, compact.stderr)
  const brief = JSON.parse(compact.stdout)
  assert.equal(brief.format, 'cap-pattern-review')
  assert.equal(brief.summary.contextOnly, 4)
  assert.equal(brief.findings.length, 5)
  assert.equal(brief.patterns.length, 9, 'five candidate patterns plus the four listed observation patterns')
  assert.equal(brief.observations.reduce((count, group) => count + group.items.length, 0), 4)
  assert.equal(brief.observationsOmitted, 0)
  assert.equal(brief.progress.verdict, 'needs-review')
  const submissionPath = path.join(root, 'decisions.json')
  const savedBrief = path.join(root, 'brief.json')
  await writeFile(savedBrief, JSON.stringify(brief))
  await writeFile(submissionPath, JSON.stringify({ snapshotSha256: brief.snapshot.sha256, decisions: [] }))
  const excerpts = spawnSync(process.execPath, [cli, client, '--report', savedBrief, '--context', brief.findings[0].id], { cwd: root, encoding: 'utf8' })
  assert.equal(excerpts.status, 0, excerpts.stderr)
  assert.equal(JSON.parse(excerpts.stdout).excerpts[0].findingId, brief.findings[0].id)
  const reconciled = spawnSync(process.execPath, [cli, '--report', savedBrief, '--decisions', submissionPath], { cwd: root, encoding: 'utf8' })
  assert.equal(reconciled.status, 0, reconciled.stderr)
  assert.equal(JSON.parse(reconciled.stdout).progress.remaining, 5)
  assert.equal(await readFile(path.join(client, 'srv', 'service.js'), 'utf8'), source)
  const portableTests = spawnSync(process.execPath, ['--test',
    path.join(extracted, 'tools/cap-pattern-scanner/scripts/scan.test.mjs'),
    path.join(extracted, 'tools/cap-pattern-scanner/helpers/index.test.js')], { cwd: root, encoding: 'utf8' })
  assert.equal(portableTests.status, 0, portableTests.stdout || portableTests.stderr)
})

test('supported adapters register the same core without touching a customer repo', async context => {
  const root = await mkdtemp(path.join(tmpdir(), 'cap-claude-delivery-'))
  context.after(() => rm(root, { recursive: true, force: true }))
  const factory = fileURLToPath(new URL('../../../', import.meta.url))
  const python = process.env.PYTHON ?? 'python3'
  for (const adapter of [
    { name: 'claude-code', agent: '.claude/agents/cap-pattern-advisor.md', skill: '.claude/skills/cap-suggest-patterns/SKILL.md', entry: 'CLAUDE.md', extra: [] },
    { name: 'cursor', agent: '.cursor/agents/cap-pattern-advisor.md', skill: '.cursor/skills/cap-suggest-patterns/SKILL.md', entry: '.cursor/rules/factory.mdc', extra: [] },
    { name: 'github-copilot', agent: '.github/agents/cap-pattern-advisor.md', skill: '.agents/skills/cap-suggest-patterns/SKILL.md', entry: '.github/copilot-instructions.md', extra: ['.vscode/settings.json'] }
  ]) {
    await context.test(adapter.name, async () => {
      const project = path.join(root, adapter.name)
      await mkdir(project)
      const result = spawnSync(python, [path.join(factory, `scripts/${adapter.name}/adapter/install.py`),
        '--project', project, '--use-case', 'CAP-AI-11'], { encoding: 'utf8' })
      assert.equal(result.status, 0, result.stderr || result.stdout)
      // README documents this exact file set; a drift here means the overwrite warning is stale.
      const written = (await readdir(project, { recursive: true, withFileTypes: true }))
        .filter(item => item.isFile())
        .map(item => path.relative(project, path.join(item.parentPath, item.name)).split(path.sep).join('/'))
        .filter(file => !file.startsWith('tools/cap-pattern-scanner/'))
      assert.deepEqual(written.sort(), [adapter.agent, adapter.skill, adapter.entry, 'factory-lock.json', ...adapter.extra].sort())
      const agent = await readFile(path.join(project, adapter.agent), 'utf8')
      const skill = await readFile(path.join(project, adapter.skill), 'utf8')
      const entry = await readFile(path.join(project, adapter.entry), 'utf8')
      assert.match(agent, /name: cap-pattern-advisor/)
      assert.match(agent, /Do not read the original large JSON in chunks/)
      assert.match(agent, /run --decisions validation/)
      assert.match(skill, /do not read it into model/)
      assert.match(skill, /CAP automatically rejects collected req.error/)
      assert.match(entry, /cap-suggest-patterns/)
      assert.match(entry, /cap-pattern-advisor/)
      const cli = path.join(project, 'tools/cap-pattern-scanner/scripts/scan.mjs')
      const sourceScripts = (await readdir(path.join(factory, 'tools/cap-pattern-scanner/scripts')))
        .filter(f => f.endsWith('.mjs') && !f.endsWith('.test.mjs'))
      for (const script of sourceScripts) {
        assert.equal(
          await readFile(path.join(project, 'tools/cap-pattern-scanner/scripts', script), 'utf8'),
          await readFile(path.join(factory, 'tools/cap-pattern-scanner/scripts', script), 'utf8'),
          `scripts/${script}`)
      }
      for (const core of ['catalog.json']) {
        assert.equal(await readFile(path.join(project, 'tools/cap-pattern-scanner', core), 'utf8'),
          await readFile(path.join(factory, 'tools/cap-pattern-scanner', core), 'utf8'), core)
      }
      const help = spawnSync(process.execPath, [cli, '--help'], { encoding: 'utf8' })
      assert.equal(help.status, 0, help.stderr)
      assert.match(help.stdout, /compact grouped review JSON/)
      assert.match(help.stdout, /--context/)
      const sessionCli = path.join(project, 'tools/cap-pattern-scanner/scripts/session.mjs')
      const sessionHelp = spawnSync(process.execPath, [sessionCli, '--help'], { encoding: 'utf8' })
      assert.equal(sessionHelp.status, 0, sessionHelp.stderr)
      assert.match(sessionHelp.stdout, /recover/, 'session.mjs --help must list recover')
      assert.match(sessionHelp.stdout, /repair/, 'session.mjs --help must list repair')
    })
  }
})

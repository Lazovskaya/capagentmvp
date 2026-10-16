import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { test } from 'node:test'
import { withRemoteError } from './index.js'

test('real CAP HTTP preserves mapped errors, localization, targets, and production sanitization', async context => {
  assert.ok(process.env.CAP_TEST_PROJECT, 'Set CAP_TEST_PROJECT to an isolated directory containing @sap/cds')
  assert.equal(process.env.NODE_ENV, 'production', 'Run with NODE_ENV=production to verify sanitization')
  const packageRequire = createRequire(path.resolve(process.env.CAP_TEST_PROJECT, 'package.json'))
  const root = await mkdtemp(path.join(tmpdir(), 'cap-pattern-http-'))
  const previousDirectory = process.cwd()
  context.after(async () => {
    process.chdir(previousDirectory)
    await rm(root, { recursive: true, force: true })
  })
  await mkdir(path.join(root, '_i18n'))
  await writeFile(path.join(root, '_i18n', 'messages.properties'), 'ORDER_CONFLICT=Order conflict\n')
  await writeFile(path.join(root, '_i18n', 'messages_de.properties'), 'ORDER_CONFLICT=Bestellkonflikt\n')
  process.chdir(root)
  const cds = packageRequire('@sap/cds')
  const express = packageRequire('express')
  cds.env.i18n.folders = ['/_i18n']
  cds.env.requires.auth = { kind: 'dummy' }
  const app = express()
  const model = cds.parse('service HelperTest { action known() returns String; action unknown() returns String; action successful() returns String; }')
  const service = await cds.serve('HelperTest').from(model).to('odata').at('/test').in(app)
  service.on('known', req => withRemoteError(req, async () => {
    throw Object.assign(new Error('UPSTREAM_PRIVATE_DETAIL'), { status: 409 })
  }, { mapError: () => ({ status: 409, code: 'ORDER_CONFLICT', target: 'ID', message: 'UPSTREAM_PRIVATE_DETAIL', $sanitize: false }) }))
  service.on('unknown', req => withRemoteError(req, async () => {
    throw Object.assign(new Error('UPSTREAM_PRIVATE_DETAIL'), { headers: { authorization: 'SECRET_TOKEN' } })
  }))
  service.on('successful', req => withRemoteError(req, async () => 'ok'))
  const server = await new Promise(resolve => {
    const listening = app.listen(0, '127.0.0.1', () => resolve(listening))
  })
  context.after(() => new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve())))
  const base = `http://127.0.0.1:${server.address().port}/test`
  async function invoke(action, locale = 'en') {
    const response = await fetch(`${base}/${action}`, {
      method: 'POST', headers: { 'content-type': 'application/json', 'accept-language': locale }, body: '{}'
    })
    return { status: response.status, body: await response.json() }
  }
  const success = await invoke('successful')
  assert.equal(success.status, 200)
  assert.equal(success.body.value, 'ok')
  const known = await invoke('known', 'de')
  assert.equal(known.status, 409)
  assert.equal(known.body.error.code, 'ORDER_CONFLICT')
  assert.equal(known.body.error.target, 'ID')
  assert.equal(known.body.error.message, 'Bestellkonflikt')
  const unknown = await invoke('unknown')
  assert.equal(unknown.status, 502)
  assert.equal(unknown.body.error.message, 'Bad Gateway')
  for (const result of [known, unknown]) {
    assert.doesNotMatch(JSON.stringify(result.body), /UPSTREAM_PRIVATE_DETAIL|SECRET_TOKEN|authorization|\$sanitize/)
  }
  console.log(`Verified @sap/cds ${cds.version}; Node ${process.versions.node}; production OData HTTP`)
})

test('real CAP CQN distinguishes stringified null and preserves literal data and static functions', () => {
  assert.ok(process.env.CAP_TEST_PROJECT, 'Set CAP_TEST_PROJECT to an isolated CAP runtime')
  const packageRequire = createRequire(path.resolve(process.env.CAP_TEST_PROJECT, 'package.json'))
  const cds = packageRequire('@sap/cds')
  const { SELECT } = cds.ql
  const oldNull = SELECT.from('SyntheticItems').where("code = 'null'").SELECT.where
  const typedNull = SELECT.from('SyntheticItems').where({ code: null }).SELECT.where
  assert.notDeepEqual(oldNull, typedNull)
  assert.ok(oldNull.some(part => part?.val === 'null'))
  assert.ok(typedNull.some(part => part && Object.hasOwn(part, 'val') && part.val === null))
  const quotedValue = "SYNTHETIC'VALUE"
  const literal = SELECT.from('SyntheticItems').where({ code: quotedValue }).SELECT.where
  assert.ok(literal.some(part => part?.val === quotedValue))
  const minimum = 7
  const expression = SELECT.from('SyntheticItems').where`round(price) > ${minimum}`.SELECT.where
  assert.ok(expression.some(part => part?.func === 'round'))
  assert.ok(expression.some(part => part?.val === minimum))
})
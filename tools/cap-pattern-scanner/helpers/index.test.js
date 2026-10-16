import assert from 'node:assert/strict'
import { test } from 'node:test'
import { withRemoteError } from './index.js'

function rejectingRequest() {
  return { reject: details => { throw Object.assign(new Error(details.code), details) } }
}

test('preserves successful values including undefined', async () => {
  const result = { ID: 1 }
  assert.equal(await withRemoteError({}, async () => result), result)
  assert.equal(await withRemoteError({}, () => undefined), undefined)
})

test('does not forward upstream message, details, headers, or sanitization flags', async () => {
  const upstream = Object.assign(new Error('secret'), { headers: { token: 'secret' } })
  await assert.rejects(withRemoteError(rejectingRequest(), () => { throw upstream }), error => {
    assert.equal(error.status, 502)
    assert.equal(error.code, 'REMOTE_SERVICE_FAILED')
    assert.equal(error.message, 'REMOTE_SERVICE_FAILED')
    assert.equal(error.headers, undefined)
    assert.equal(error.cause, undefined)
    assert.equal(error.$sanitize, undefined)
    return true
  })
})

test('supports an async service-specific allowlist mapping without forwarding other properties', async () => {
  await assert.rejects(withRemoteError(rejectingRequest(), async () => { throw new Error('private') }, {
    mapError: async () => ({ status: 409, code: 'ORDER_CONFLICT', target: 'ID', message: 'private', $sanitize: false })
  }), error => {
    assert.equal(error.status, 409)
    assert.equal(error.code, 'ORDER_CONFLICT')
    assert.equal(error.target, 'ID')
    assert.equal(error.$sanitize, undefined)
    return true
  })
})

test('rejects invalid mappings instead of constructing unsafe CAP errors', async () => {
  for (const mapped of [{ status: 200 }, { code: 'upstream secret' }, { target: {} }]) {
    await assert.rejects(withRemoteError(rejectingRequest(), () => { throw Error() }, {
      mapError: () => mapped
    }), TypeError)
  }
})
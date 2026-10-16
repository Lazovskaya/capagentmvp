export async function withRemoteError(req, operation, { mapError } = {}) {
  try {
    return await operation()
  } catch (error) {
    const mapped = mapError ? await mapError(error) : undefined
    const status = mapped?.status ?? 502
    const code = mapped?.code ?? 'REMOTE_SERVICE_FAILED'
    const target = mapped?.target
    if (!Number.isInteger(status) || status < 400 || status > 599) {
      throw new TypeError('Mapped status must be an HTTP error status')
    }
    if (typeof code !== 'string' || !/^[A-Z][A-Z0-9_]*$/.test(code)) {
      throw new TypeError('Mapped code must be a static message key')
    }
    if (target !== undefined && typeof target !== 'string') {
      throw new TypeError('Mapped target must be a field path')
    }
    return req.reject({ status, code, ...(target === undefined ? {} : { target }) })
  }
}
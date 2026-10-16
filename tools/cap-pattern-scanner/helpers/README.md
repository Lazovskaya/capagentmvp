# CAP Pattern Helpers

Experimental, unpublished internal npm package. Node.js 22+. No CAP monkey patches,
global handlers, credentials, dependencies, or automatic registration.

```js
import { withRemoteError } from '@epam/cap-pattern-helpers'

this.on('READ', Customers, req => withRemoteError(req, () => remote.run(req.query), {
  mapError: error => error.status === 404
    ? { status: 404, code: 'CUSTOMER_NOT_FOUND', target: 'ID' }
    : { status: 502, code: 'REMOTE_SERVICE_FAILED' }
}))
```

Provide message keys in the application's `_i18n/messages.properties`. CAP retains
its production 5xx sanitization. Only status, static code, and target are forwarded;
never return upstream messages or sensitive data in the mapping. The mapper is
trusted application code and must allowlist known service-specific cases. Do not
wrap local validation, authorization, or transactions in this helper: its fallback
is for failed upstream operations only. It does not retry writes or log payloads.
Mapper failures propagate unchanged rather than hiding implementation defects.

Run `npm test` here. Local evaluation can use `npm pack --dry-run` and an explicitly
approved file dependency; do not install from a public registry using this proposed
name. Publishing stays disabled until ownership, registry, reuse rights, license,
and a real CAP compatibility matrix are approved. Unit tests use a request double,
not a live CAP runtime. Prefer `cds.i18n.messages.at(key, locale, args)` directly for
text lookup and CAP annotations for pagination, drafts, and declarative validation.
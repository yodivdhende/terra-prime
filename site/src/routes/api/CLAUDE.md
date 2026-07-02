# API Routes

All handlers use `handleRequest()` for error handling and extract tokens via `getSessionToken(cookies)` or the `authentication` header.

## Auth helpers

- `authGuard(token, roles)` — validates token, throws 403 if missing required role
- `authGuardForUser(token, roles)` — same, but also returns `{ userId, roles }` for downstream use
- Roles: `'admin'` | `'user'`
- Numeric path params validated via `isNumberOrError(param)`

All responses are JSON unless explicitly noted (file streams, HTML, `204 No Content`).

---

## Endpoint reference

The full endpoint list (method, path, auth, response shape, description) is maintained in
`site/src/lib/data/api-docs.ts` and rendered at `/manage/docs` in the app. Update that file when
adding, changing, or removing an endpoint — this doc and the in-app page both read from it, so
there is one place to keep current.

# Tests

## Stack
- Jest for unit and integration tests
- Supertest for HTTP/route testing

## Rules
- Mirror the `src/` structure: files in `controllers/` → tests in `__tests__/controllers/`
- Test file naming: `<name>.test.ts`
- Run before every commit: `npm test`
- Setup/teardown helpers live in `__tests__/setup/`
- HTTP status codes: use `HttpStatusCodes` from `../../constants/httpStatusCodes` — never raw numbers like `200`, `404`, `500` (codes not in that constant, e.g. `302`, `429`, add)

# Manual / ad-hoc test scripts

These are exploratory curl-based scripts kept for manual verification against a
running dev server. They are **not** part of the automated test suite (see the
`test:*` scripts in `package.json` and `__tests__/` for that).

Run them against a local server (`npm run dev`) when manually smoke-testing an
endpoint. They are not wired into CI and may reference stale fixture data.

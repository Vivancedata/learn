# Custom JWT authentication instead of a hosted auth provider

Sessions are HS256 JWTs signed with `JWT_SECRET` (`jose`), passwords are hashed with `bcryptjs`, and `src/proxy.ts` plus `src/lib/auth.ts` verify the token on every protected request. We keep user records, password-reset and email-verification tokens in our own Postgres rather than adopting a hosted provider, so the whole account lifecycle stays in one database and one codebase.

The cost is that we own rate limiting, token expiry (7 days), verification and reset flows, and secret rotation ourselves.

# PostgreSQL with Prisma as the only data store

All application state (courses, progress, XP, subscriptions, conversations) lives in PostgreSQL, accessed through Prisma with the `pg` driver adapter. The schema started on SQLite (`prisma/migrations_sqlite_archive`) and was reset to a single Postgres init migration (`20260220172000_init_postgresql`), which is why list-like fields such as `Course.prerequisites` are JSON stored in `String` columns.

Course content is authored as Markdown under `content/` and imported into the database by `prisma/content-importer.ts`, so pages read from Postgres rather than from the files at request time.

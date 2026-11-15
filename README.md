# app-seafile
Compose file for the Seafile app

## Credentials (idea#123)

Do not put passwords or personal emails in `compose.yaml`. The Engine writes a
per-instance `.env` with `port` and `pass`; compose interpolates `${port}` and
`${pass}` (DB passwords only). The admin login is `admin@idea.local` / `admin911!`
(IDEA default `<account name>911!`; override with `IDEA_SEAFILE_ADMIN_PASSWORD`).
Seafile's default policy (min length 6, strong passwords not required) accepts it.
Only used when Seafile first initialises; an existing admin is not reset.
Any values previously committed are compromised — rotate them on every Seafile
instance that was started from an older compose file.

## Release check against the previous release (idea#403)

`AAD_CHECK_COMPOSE=<agent-app-dev>/script/check-compose.mjs script/check-base-ref.sh` compares `compose.yaml` with the previous release tag (agent-app-dev `check-compose --base-ref`): a stateful image (MariaDB, MySQL, Postgres, Mongo, Redis) that moves to a new series needs an App major bump. The previous release tag is the highest `<major>.<minor>[-<upstream>]` tag that is an ancestor of HEAD and not HEAD's own tag; a first release is skipped with a note. It needs tags and full history (CI: `fetch-depth: 0`); a shallow clone fails. `node --test tests/release-base-ref.test.mjs` runs it in the release tests (the compare only when `AAD_CHECK_COMPOSE` is set).

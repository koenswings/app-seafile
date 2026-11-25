# app-seafile
Compose file for the Seafile app

Seafile data uses relative `./data` bind mounts on the App Disk
(`./data/db` for MariaDB, `./data/shared` for Seafile; see
[MIGRATION.md](MIGRATION.md)), not Docker named volumes
([idea#141](https://github.com/koenswings/idea/issues/141)). This App is **not
yet at current App Disk conventions**: `compose.yaml` has no `x-app.version`,
no `x-app-version` labels, no Docker healthcheck, and no updateApp fields
(`healthCheck`, `snapshotExclude`, `backup`). Bring those up before a
Kit-managed release (`script/check-compose.mjs` in agent-app-dev).

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

- **Before tagging a release, run `script/check-base-ref.sh` in a full clone with tags, with `AAD_CHECK_COMPOSE` set:** `AAD_CHECK_COMPOSE=<agent-app-dev>/script/check-compose.mjs script/check-base-ref.sh`.
- It compares `compose.yaml` with the previous release tag (agent-app-dev `check-compose --base-ref`). A stateful image (MariaDB, MySQL, Postgres, Mongo, Redis) that moves to a new series needs an App major bump.
- **Previous release tag:** the highest `<major>.<minor>[-<upstream>]` tag that is an ancestor of HEAD and is not HEAD's own tag.
- **It fails** in a shallow clone (`git fetch --unshallow --tags`; CI: `fetch-depth: 0`) and in a clone with no release tags at all (`git fetch --tags`).
- **First release:** if the repo has release tags but none of them is an ancestor, it is skipped with a note. If there are no release tags at all, a real first release must set `CHECK_BASE_REF_FIRST_RELEASE=1`.
- `node --test tests/release-base-ref.test.mjs` tests it. The compare runs only when `AAD_CHECK_COMPOSE` is set.
- **Seafile has no release tags yet:** run its first release check as `CHECK_BASE_REF_FIRST_RELEASE=1 script/check-base-ref.sh`, and run the tests with `CHECK_BASE_REF_FIRST_RELEASE=1 node --test tests/*.test.mjs`. Without the variable the check and the first `release-base-ref` test fail on purpose. Drop it once the first release tag exists.

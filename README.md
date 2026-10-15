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

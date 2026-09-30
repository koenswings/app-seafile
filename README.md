# app-seafile
Compose file for the Seafile app

## Credentials (idea#123)

Do not put passwords or personal emails in `compose.yaml`. The Engine writes a
per-instance `.env` with `port` and `pass`; compose interpolates `${port}` and
`${pass}`. The admin login is `admin@idea.local` with that generated password.
Any values previously committed are compromised — rotate them on every Seafile
instance that was started from an older compose file.

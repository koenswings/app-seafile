# Migration: separate data folders for MariaDB and Seafile

Older instances mount the same `./data` folder into MariaDB (`/var/lib/mysql`) and Seafile
(`/shared`). MariaDB's entrypoint chowns its whole datadir to uid 999 whenever its container
is (re)created, so Seafile's files end up owned by 999. Seafile 11 then refuses to start
("the user running the script ("root") is not the owner of /shared/seafile/seafile-data") and
the web UI answers HTTP 502. Seen on idea03 on 2026-10-16 after an Engine restart. The stopgap was
`chown -R 0:0 data/seafile` followed by restarting only the seafile container.

This compose gives MariaDB `./data/db` and Seafile `./data/shared`. A **new** instance needs
nothing. An **existing** instance keeps its old compose until it is migrated by hand:

1. `stopInstance <id> <disk>` through the Engine (Console or command queue); wait until the
   `seafile`, `seafile-mysql` and `seafile-memcached` containers have stopped.
2. Back up: copy the whole `instances/<id>/data` folder to quarantine
   (`/home/pi/quarantine/<who>-<timestamp>/`). Never delete it.
3. In `instances/<id>/data`, create `db/` and `shared/`, then move:
   - MariaDB files into `db/`: `ccnet_db seafile_db seahub_db mysql performance_schema sys`
     `aria_log.* aria_log_control ib_buffer_pool ib_logfile* ibdata1 ibtmp1 ddl_recovery.log`
     `multi-master.info mysql_upgrade_info .my-healthcheck.cnf`
   - Seafile files into `shared/`: `seafile/ nginx/ logs/` (and `ssl/` if present).
4. Ownership: `chown -R 999:999 data/db` and `chown -R 0:0 data/shared`.
5. Replace the instance's `compose.yaml` volumes with the two lines from this compose. Keep its
   own `.env` and `x-app.instanceName`.
6. `startInstance <id> <disk>`. Check that `http://<host>:<port>/accounts/login/` returns 200 and an
   existing user can sign in. If not: stop it, move the backup back, and restore the old compose.

Do not run this on a Pi without an approved change (the data move is manual).

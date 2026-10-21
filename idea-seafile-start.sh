#!/bin/sh
# IDEA start-time guard for the seafile container (app-seafile#3).
# Seafile 11 refuses to start when root does not own its data
# ("root is not the owner of /shared/seafile/seafile-data", HTTP 502). That happened on
# idea03 (2026-10-16) whenever MariaDB, which used to share ./data, recreated its container and
# chowned the folder to uid 999. The separate data folders stop that; this guard also repairs
# anything else (a redock, a copy, an older layout) before Seafile starts. It only touches
# ${IDEA_SEAFILE_SHARED:-/shared}/seafile, and only when something in it is not owned by 0:0.
set -u
dir="${IDEA_SEAFILE_SHARED:-/shared}/seafile"
if [ -d "$dir" ]; then
  bad=$(find "$dir" \( ! -user 0 -o ! -group 0 \) -print 2>/dev/null | head -n 1)
  if [ -n "$bad" ]; then
    echo "idea-seafile-start: fixing ownership of $dir (found e.g. $bad not owned by 0:0)"
    chown -R 0:0 "$dir" || { echo "idea-seafile-start: chown failed" >&2; exit 1; }
  fi
fi
[ "$#" -gt 0 ] || { echo "idea-seafile-start: no command to run" >&2; exit 2; }
exec "$@"

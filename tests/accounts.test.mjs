// IDEA default: Seafile admin is admin@idea.local / admin911!; DB passwords stay generated.
import { it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const c = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', 'compose.yaml'), 'utf8');
it('admin password defaults to admin911! with env override', () => {
  assert.match(c, /- SEAFILE_ADMIN_EMAIL=admin@idea\.local\n/);
  assert.match(c, /- SEAFILE_ADMIN_PASSWORD=\$\{IDEA_SEAFILE_ADMIN_PASSWORD:-admin911!\}\n/);
});
it('DB passwords stay ${pass}', () => {
  assert.match(c, /MYSQL_ROOT_PASSWORD=\$\{pass\}/);
  assert.match(c, /DB_ROOT_PASSWD=\$\{pass\}/);
});

// MariaDB and Seafile must not share a data folder (idea03 2026-10-16: MariaDB chowned
// Seafile's files to uid 999 on recreate -> Seafile 502). Run: node --test tests/
import { it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const compose = readFileSync(join(root, 'compose.yaml'), 'utf8')
const service = n => compose.split(/\n  (?=[a-z][\w-]*:\n)/).find(b => b.startsWith(`${n}:`)) ?? ''
const mounts = n => [...service(n).matchAll(/^\s+- (\.\/[^:\s]+):(\/[^\s:#]+)/gm)].map(m => ({ host: m[1], target: m[2] }))

it('db mounts ./data/db at /var/lib/mysql; seafile mounts ./data/shared at /shared', () => {
  assert.deepEqual(mounts('db'), [{ host: './data/db', target: '/var/lib/mysql' }])
  assert.deepEqual(mounts('seafile').filter(m => m.host.startsWith('./data')), [{ host: './data/shared', target: '/shared' }])
})

it('no host folder is mounted by both services, and neither contains the other', () => {
  const a = mounts('db').map(m => m.host), b = mounts('seafile').map(m => m.host)
  for (const x of a) for (const y of b) {
    assert.notEqual(x, y)
    assert.ok(!x.startsWith(y + '/') && !y.startsWith(x + '/'), `${x} vs ${y} overlap`)
  }
})

it('MIGRATION.md documents moving an existing shared ./data', () => {
  const m = readFileSync(join(root, 'MIGRATION.md'), 'utf8')
  for (const k of ['data/db', 'data/shared', 'stopInstance', 'quarantine', 'chown']) assert.ok(m.includes(k), k)
})

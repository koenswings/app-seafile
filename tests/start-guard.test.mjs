// Start-time ownership guard for the seafile container. Run: node --test tests/
// chown is replaced by a logging fake on PATH, and find's -user/-group test is checked against
// the real owner of a temp dir (not root when the tests run as a normal user).
import { it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, mkdtempSync, mkdirSync, writeFileSync, chmodSync, existsSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { join, dirname } from 'node:path'
import { tmpdir, userInfo } from 'node:os'
import { fileURLToPath } from 'node:url'
const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const script = join(root, 'idea-seafile-start.sh')
const compose = readFileSync(join(root, 'compose.yaml'), 'utf8')
const seafile = compose.split(/\n  (?=[a-z][\w-]*:\n)/).find(b => b.startsWith('seafile:'))

function run({ withSeafileDir = true, args = ['sh', '-c', 'echo STARTED "$@"', 'x', 'a1'], chownFails = false } = {}) {
  const t = mkdtempSync(join(tmpdir(), 'sfguard-'))
  const shared = join(t, 'shared'), bin = join(t, 'bin'), log = join(t, 'chown.log')
  mkdirSync(bin)
  if (withSeafileDir) { mkdirSync(join(shared, 'seafile', 'seafile-data'), { recursive: true }); writeFileSync(join(shared, 'seafile', 'seafile-data', 'f'), 'x') }
  writeFileSync(join(bin, 'chown'), `#!/bin/sh\necho "$@" >> ${log}\n${chownFails ? 'exit 1' : 'exit 0'}\n`); chmodSync(join(bin, 'chown'), 0o755)
  const r = spawnSync('sh', [script, ...args], { env: { PATH: `${bin}:/usr/bin:/bin`, IDEA_SEAFILE_SHARED: shared }, encoding: 'utf8' })
  return { ...r, chown: existsSync(log) ? readFileSync(log, 'utf8').trim() : null, shared }
}
const notRoot = userInfo().uid !== 0

it('compose runs the guard as the seafile entrypoint, keeping the image start command', () => {
  assert.match(seafile, /- \.\/idea-seafile-start\.sh:\/idea\/start\.sh:ro/)
  assert.match(seafile, /entrypoint: \["\/bin\/sh", "\/idea\/start\.sh"\]/)
  assert.match(seafile, /command: \["\/sbin\/my_init", "--", "\/scripts\/enterpoint\.sh"\]/)
})

it('only the seafile service gets the guard (MariaDB and memcached unchanged)', () => {
  assert.equal(compose.match(/idea\/start\.sh/g).length, 2)
})

it('chowns <shared>/seafile to 0:0 when something is not root-owned, then execs the command', { skip: !notRoot && 'needs a non-root owner' }, () => {
  const r = run()
  assert.equal(r.status, 0, r.stderr)
  assert.equal(r.chown, `-R 0:0 ${join(r.shared, 'seafile')}`)
  assert.match(r.stdout, /fixing ownership/)
  assert.match(r.stdout, /STARTED a1/)
})

it('never chowns anything outside <shared>/seafile', { skip: !notRoot && 'needs a non-root owner' }, () => {
  const r = run()
  assert.ok(!r.chown.includes(join(r.shared, ' ')) && r.chown.split(' ').pop() === join(r.shared, 'seafile'))
})

it('does nothing when there is no seafile folder yet (first start) and still execs', () => {
  const r = run({ withSeafileDir: false })
  assert.equal(r.status, 0, r.stderr)
  assert.equal(r.chown, null)
  assert.match(r.stdout, /STARTED a1/)
})

it('stops (exit 1) instead of starting Seafile when the chown fails', { skip: !notRoot && 'needs a non-root owner' }, () => {
  const r = run({ chownFails: true })
  assert.equal(r.status, 1)
  assert.doesNotMatch(r.stdout, /STARTED/)
})

it('exits 2 when no command is given', () => {
  const r = run({ withSeafileDir: false, args: [] })
  assert.equal(r.status, 2)
})

it('passes arguments through unchanged (exec "$@")', () => {
  const r = run({ withSeafileDir: false, args: ['sh', '-c', 'printf "%s|" "$@"', 'x', 'a b', '--', 'c'] })
  assert.equal(r.stdout, 'a b|--|c|')
})

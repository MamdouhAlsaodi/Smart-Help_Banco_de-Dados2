import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

const cwd = fileURLToPath(new URL('..', import.meta.url));
const available = spawnSync('docker', ['compose', 'version'], { encoding: 'utf8' }).status === 0;

function compose(args, env) {
  return spawnSync('docker', ['compose', '--env-file', '/dev/null', 'config', ...args], {
    cwd,
    encoding: 'utf8',
    env: { PATH: process.env.PATH, ...env }
  });
}

test('Compose requires local passwords, stays on loopback and preserves data', { skip: !available }, () => {
  const vars = {
    POSTGRES_USER: 'smarthelp_user', POSTGRES_DB: 'smarthelp',
    POSTGRES_PASSWORD: 'synthetic-config-check',
    PGADMIN_DEFAULT_EMAIL: 'admin@smarthelp.dev',
    PGADMIN_DEFAULT_PASSWORD: 'synthetic-config-check'
  };
  const config = compose(['--format', 'json'], vars);
  assert.equal(config.status, 0, config.stderr);
  const parsed = JSON.parse(config.stdout);
  assert.equal(parsed.services.postgres.ports[0].host_ip, '127.0.0.1');
  assert.equal(parsed.services.pgadmin.ports[0].host_ip, '127.0.0.1');
  assert.equal(parsed.services.pgadmin.depends_on.postgres.condition, 'service_healthy');
  assert.ok(parsed.services.postgres.healthcheck);
  assert.ok(parsed.services.postgres.volumes.some((v) => v.target === '/var/lib/postgresql/data'));
  assert.ok(parsed.services.pgadmin.volumes.some((v) => v.target === '/var/lib/pgadmin'));
  assert.notEqual(compose(['--quiet'], {}).status, 0, 'empty credentials must be rejected');
});

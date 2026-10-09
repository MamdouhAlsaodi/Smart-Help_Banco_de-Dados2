// Smoke offline (RED→GREEN) do script de integração HTTP sintético de CI.
// Não conecta em banco nem sobe servidor: confere, estaticamente, que
// scripts/ci/api-smoke.mjs existe, é guardado para o runner sintético do CI,
// importa a app Express real e exerce as rotas HTTP via fetch.
import { test } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const SCRIPT = path.join(ROOT, 'scripts', 'ci', 'api-smoke.mjs');
const HOOK = path.join(ROOT, 'scripts', 'ci', 'migration-smoke.sh');
const WORKFLOW = path.join(ROOT, '.github', 'workflows', 'api-smoke.yml');

const read = (p) => fs.readFileSync(p, 'utf8');

test('script de api smoke existe em scripts/ci', () => {
  assert.ok(fs.existsSync(SCRIPT), `script ausente: scripts/ci/api-smoke.mjs`);
});

test('script é guardado para o runner GitHub-hosted sintético', () => {
  const s = read(SCRIPT);
  assert.match(s, /GITHUB_ACTIONS/, 'guard GITHUB_ACTIONS ausente');
  assert.match(s, /github-hosted/, 'guard RUNNER_ENVIRONMENT=github-hosted ausente');
  assert.match(s, /127\.0\.0\.1/, 'guard de host 127.0.0.1 ausente');
  assert.match(s, /5432/, 'guard de porta 5432 ausente');
  assert.match(s, /smarthelp_ci/, 'guard de usuário/banco smarthelp_ci ausente');
  assert.match(s, /schema=public|'public'|schema.*public/, 'guard de schema public ausente');
});

test('script importa a app Express real a partir de scripts/ci', () => {
  const s = read(SCRIPT);
  assert.match(
    s,
    /from\s+'\.\.\/\.\.\/src\/app\.js'/,
    'script deve importar ../../src/app.js (app real, não reimplementação)',
  );
  assert.match(
    s,
    /from\s+'\.\.\/\.\.\/src\/lib\/prisma\.js'/,
    'script deve usar o Prisma real via src/lib/prisma.js',
  );
});

test('script usa HTTP fetch e exerce as rotas da API', () => {
  const s = read(SCRIPT);
  assert.match(s, /fetch\(/, 'script deve usar fetch HTTP real');
  for (const rota of ['/health', '/api/chamados', '/api/busca', '/resolver']) {
    assert.ok(s.includes(rota), `rota ${rota} ausente no smoke`);
  }
});

test('migration-smoke.sh roda o api smoke sob guarda dupla antes do teardown', () => {
  const s = read(HOOK);
  assert.match(s, /SMARTHELP_API_CHECK/, 'guard SMARTHELP_API_CHECK ausente no hook');
  const hookBlock = s.match(/if \[\[ "\$\{SMARTHELP_API_CHECK[\s\S]*?\nfi/);
  assert.ok(hookBlock, 'bloco de guarda do api smoke não encontrado');
  assert.match(hookBlock[0], /SMARTHELP_FTS_CHECK/, 'api smoke deve exigir SMARTHELP_FTS_CHECK=1');
  assert.match(hookBlock[0], /node scripts\/ci\/api-smoke\.mjs/, 'hook deve chamar node scripts/ci/api-smoke.mjs');
  const ftsData = s.indexOf('fts-check.mjs data');
  const apiHook = s.indexOf('SMARTHELP_API_CHECK');
  const down = s.indexOf('"${compose[@]}" down', apiHook);
  assert.ok(apiHook > ftsData, 'api smoke deve rodar após o seed FTS');
  assert.ok(down > apiHook, 'api smoke deve rodar antes do down/rebuild');
});

test('workflow dedicado de api smoke existe e encadeia FTS + API no runner hosted', () => {
  assert.ok(fs.existsSync(WORKFLOW), 'workflow .github/workflows/api-smoke.yml ausente');
  const w = read(WORKFLOW);
  assert.match(w, /ubuntu-latest/, 'workflow deve usar runner GitHub-hosted');
  assert.match(w, /node-version:\s*'22'/, 'workflow deve usar Node 22');
  assert.match(w, /npm ci/, 'workflow deve rodar npm ci');
  assert.match(w, /prisma generate/, 'workflow deve rodar prisma generate');
  assert.match(w, /npm test/, 'workflow deve rodar npm test');
  assert.match(w, /SMARTHELP_FTS_CHECK:\s*'1'/, 'workflow deve habilitar o FTS check');
  assert.match(w, /SMARTHELP_API_CHECK:\s*'1'/, 'workflow deve habilitar o api check');
  assert.match(w, /migration-smoke\.sh/, 'workflow deve chamar migration-smoke.sh');
  assert.match(w, /scripts\/ci\/api-smoke\.mjs/, 'workflow deve reagir a mudanças do script');
});

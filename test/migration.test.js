// Etapa 4 — verificação offline da migration inicial.
// Não conecta em banco: valida integridade do SQL e do lock e confere
// equivalência com o diff canônico gerado por `prisma migrate diff`.
import { test } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const MIGRATION_DIR = path.join(ROOT, 'prisma', 'migrations', '20261008_initial');
const MIGRATION_SQL = path.join(MIGRATION_DIR, 'migration.sql');
const LOCK_FILE = path.join(ROOT, 'prisma', 'migrations', 'migration_lock.toml');
const SCHEMA = path.join(ROOT, 'prisma', 'schema.prisma');

const sql = () => fs.readFileSync(MIGRATION_SQL, 'utf8');

test('arquivos da migration existem', () => {
  assert.ok(fs.existsSync(MIGRATION_SQL), 'migration.sql ausente');
  assert.ok(fs.existsSync(LOCK_FILE), 'migration_lock.toml ausente');
});

test('lock declara provider postgresql', () => {
  const lock = fs.readFileSync(LOCK_FILE, 'utf8');
  assert.match(lock, /provider\s*=\s*"postgresql"/);
});

test('SQL cria enums, tabelas e tabelas de junção', () => {
  const s = sql();
  assert.match(s, /CREATE TYPE "Status"/);
  assert.match(s, /CREATE TYPE "Prioridade"/);
  for (const t of ['Usuario', 'Categoria', 'Chamado', 'Solucao', 'Tag', '_ChamadoToTag']) {
    assert.match(s, new RegExp(`CREATE TABLE "${t}"`), `tabela ${t} ausente`);
  }
});

test('PKs, constraints únicos e índices presentes', () => {
  const s = sql();
  for (const t of ['Usuario', 'Categoria', 'Chamado', 'Solucao', 'Tag']) {
    assert.match(s, new RegExp(`CONSTRAINT "${t}_pkey" PRIMARY KEY`), `PK de ${t} ausente`);
  }
  // 1:1 Solucao e valores únicos
  assert.match(s, /CREATE UNIQUE INDEX "Solucao_chamadoId_key"/);
  assert.match(s, /CREATE UNIQUE INDEX "Usuario_email_key"/);
  assert.match(s, /CREATE UNIQUE INDEX "Categoria_nome_key"/);
  assert.match(s, /CREATE UNIQUE INDEX "Tag_nome_key"/);
  // índices de Chamado e FKs
  for (const idx of ['Chamado_autorId_idx', 'Chamado_categoriaId_idx', 'Chamado_status_idx', 'Chamado_criadoEm_idx', 'Solucao_responsavelId_idx']) {
    assert.match(s, new RegExp(`CREATE INDEX "${idx}"`), `índice ${idx} ausente`);
  }
  assert.match(s, /CREATE INDEX "_ChamadoToTag_B_index"/);
});

test('FKs e ações de deleção conforme o schema', () => {
  const s = sql();
  assert.match(s, /"Chamado_autorId_fkey".*REFERENCES "Usuario"\("id"\) ON DELETE RESTRICT ON UPDATE CASCADE/s);
  assert.match(s, /"Chamado_categoriaId_fkey".*REFERENCES "Categoria"\("id"\) ON DELETE RESTRICT ON UPDATE CASCADE/s);
  assert.match(s, /"Solucao_chamadoId_fkey".*REFERENCES "Chamado"\("id"\) ON DELETE CASCADE ON UPDATE CASCADE/s);
  assert.match(s, /"Solucao_responsavelId_fkey".*REFERENCES "Usuario"\("id"\) ON DELETE RESTRICT ON UPDATE CASCADE/s);
  assert.match(s, /"_ChamadoToTag_A_fkey".*REFERENCES "Chamado"\("id"\) ON DELETE CASCADE ON UPDATE CASCADE/s);
  assert.match(s, /"_ChamadoToTag_B_fkey".*REFERENCES "Tag"\("id"\) ON DELETE CASCADE ON UPDATE CASCADE/s);
});

test('SQL é equivalente ao diff canônico do schema (offline)', () => {
  const canonical = execFileSync(
    path.join(ROOT, 'node_modules', '.bin', 'prisma'),
    ['migrate', 'diff', '--from-empty', '--to-schema-datamodel', SCHEMA, '--script'],
    { cwd: ROOT, encoding: 'utf8', env: { ...process.env, DATABASE_URL: 'postgresql://synthetic:synthetic@127.0.0.1:1/synthetic?schema=public' } },
  );
  assert.equal(sql().trim(), canonical.trim(), 'migration.sql diverge do diff canônico');
});

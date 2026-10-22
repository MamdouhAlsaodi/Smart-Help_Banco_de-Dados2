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
  // O schema evolui por migrações incrementais. A migração inicial permanece congelada
  // (histórico); o diff canônico do schema.prisma atual é validado contra a cadeia
  // acumulada de todas as migrações, comparando o DDL efetivo (sem comentários e sem o
  // ALTER TYPE ... ADD VALUE, que o diff canônico já incorpora no CREATE TYPE).
  const migrationsRoot = path.join(ROOT, 'prisma', 'migrations');
  const arquivos = fs.readdirSync(migrationsRoot)
    .filter((d) => /^\d{8,}/.test(d))
    .sort();
  const acumulado = arquivos
    .map((d) => fs.readFileSync(path.join(migrationsRoot, d, 'migration.sql'), 'utf8'))
    .join('\n');
  const canonical = execFileSync(
    'npx',
    ['prisma', 'migrate', 'diff', '--from-empty', '--to-schema-datamodel', 'prisma/schema.prisma', '--script'],
    { shell: true, cwd: ROOT, encoding: 'utf8', env: { ...process.env, DATABASE_URL: 'postgresql://synthetic:***@127.0.0.1:1/synthetic?schema=public' } },
  );
  const ddlEfetivo = (t) => t
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('--'))
    .join('\n');
  // O ALTER TYPE ... ADD VALUE das migrações incrementais é incorporado ao CREATE TYPE
  // inicial para reconstruir o enum efetivo (o diff canônico já o traz no CREATE TYPE).
  // Os comandos podem estar em arquivos diferentes da cadeia (linha não adjacente).
  const aplicaAddValue = (t) => {
    const adicionados = {};
    for (const m of t.matchAll(/^ALTER TYPE "(\w+)" ADD VALUE '(\w+)';?$/gm)) {
      (adicionados[m[1]] ||= []).push(`'${m[2]}'`);
    }
    let out = t.replace(/^ALTER TYPE "\w+" ADD VALUE '\w+';?\n?/gm, '');
    for (const [tipo, valores] of Object.entries(adicionados)) {
      out = out.replace(
        new RegExp(`CREATE TYPE "${tipo}" AS ENUM \\(([^)]*?)\\)`),
        (m, base) => `CREATE TYPE "${tipo}" AS ENUM (${base.trim().replace(/,\s*$/, '')}, ${valores.join(', ')})`,
      );
    }
    return out;
  };
  const schemaEfetivo = (t) => aplicaAddValue(ddlEfetivo(t));
  const extraiEnums = (t) => [...t.matchAll(/CREATE TYPE "(\w+)" AS ENUM \(([^)]*)\)/g)]
    .map((m) => ({ tipo: m[1], valores: m[2].match(/'(\w+)'/g).map((v) => v.replaceAll("'", '')) }));
  const extraiTabelas = (t) => [...t.matchAll(/CREATE TABLE "(\w+)"/g)].map((m) => m[1]);
  const extraiIndices = (t) => [...t.matchAll(/CREATE (?:UNIQUE )?INDEX "(\w+)"/g)].map((m) => m[1]);
  const extraiFks = (t) => [...t.matchAll(/ADD CONSTRAINT "(\w+_fkey)"/g)].map((m) => m[1]);

  const a = { enums: extraiEnums(schemaEfetivo(acumulado)), tabelas: extraiTabelas(schemaEfetivo(acumulado)), indices: extraiIndices(schemaEfetivo(acumulado)), fks: extraiFks(schemaEfetivo(acumulado)) };
  const c = { enums: extraiEnums(schemaEfetivo(canonical)), tabelas: extraiTabelas(schemaEfetivo(canonical)), indices: extraiIndices(schemaEfetivo(canonical)), fks: extraiFks(schemaEfetivo(canonical)) };

  assert.deepEqual(
    a.enums.sort((x, y) => x.tipo.localeCompare(y.tipo)),
    c.enums.sort((x, y) => x.tipo.localeCompare(y.tipo)),
    'enums divergem do schema canônico',
  );
  assert.deepEqual(a.tabelas.sort(), c.tabelas.sort(), 'tabelas divergem do schema canônico');
  // O índice GIN de Full-Text Search vive apenas nas migrações (expressão SQL fora do
  // schema Prisma), então o acumulado é um SUPERCONJUNTO do canônico: exige-se que todos
  // os índices canônicos existam na cadeia; extras documentados (FTS) são permitidos.
  const fts = new Set(['Chamado_fts_idx']);
  const extrasAcc = a.indices.filter((i) => !c.indices.includes(i));
  assert.ok(extrasAcc.every((i) => fts.has(i)), `índices extras não documentados: ${extrasAcc.join(', ')}`);
  for (const indice of c.indices) {
    assert.ok(a.indices.includes(indice), `índice canônico ausente nas migrations: ${indice}`);
  }
  assert.deepEqual(a.fks.sort(), c.fks.sort(), 'FKs divergem do schema canônico');
});

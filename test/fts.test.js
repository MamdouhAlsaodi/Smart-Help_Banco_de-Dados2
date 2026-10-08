// Etapa 8 — verificação offline da migration de Full-Text Search.
// Não conecta em banco: confere que o índice GIN de expressão da migration
// corresponde EXATAMENTE à expressão de filtro (WHERE) já usada pela
// consulta existente em src/services/search.service.js.
import { test } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const MIGRATIONS_DIR = path.join(ROOT, 'prisma', 'migrations');
const INITIAL_DIR = '20261008_initial';
const FTS_DIR = '20261008b_full_text_search';
const MIGRATION_SQL = path.join(MIGRATIONS_DIR, FTS_DIR, 'migration.sql');
const SEARCH_SERVICE = path.join(ROOT, 'src', 'services', 'search.service.js');

// Colapsa espaços para comparar expressões SQL de forma estável.
const normalize = (sql) => sql.replace(/\s+/g, ' ').trim().replace(/"/g, '');

test('migration FTS existe e aplica depois da migration inicial', () => {
  assert.ok(fs.existsSync(MIGRATION_SQL), `migration ausente: ${FTS_DIR}/migration.sql`);
  // O Prisma Migrate ordena migrations lexicograficamente pelo nome do diretório:
  // a migration de FTS precisa ordenar após 20261008_initial.
  assert.ok(
    FTS_DIR > INITIAL_DIR,
    `"${FTS_DIR}" ordena antes de "${INITIAL_DIR}": o Prisma aplicaria o índice antes de criar a tabela "Chamado"`,
  );
});

test('SQL cria índice GIN de expressão na tabela Chamado', () => {
  const s = fs.readFileSync(MIGRATION_SQL, 'utf8');
  assert.match(s, /CREATE INDEX "Chamado_fts_idx"\s+ON "Chamado"\s+USING GIN\s*\(/i);
});

test('expressão do índice GIN equivale ao WHERE da busca existente', () => {
  const migrationSql = fs.readFileSync(MIGRATION_SQL, 'utf8');
  const serviceSql = fs.readFileSync(SEARCH_SERVICE, 'utf8');

  // Expressão do índice declarada na migration (entre USING GIN ( e o fechamento).
  const indexMatch = migrationSql.match(/USING GIN\s*\(([^;]+)\)\s*;?\s*$/is);
  assert.ok(indexMatch, 'expressão do índice GIN não encontrada na migration');
  const indexExpr = normalize(indexMatch[1]);

  // Expressão de filtro extraída da consulta real do serviço (com alias "c.").
  const whereMatch = serviceSql.match(
    /to_tsvector\('portuguese',\s*coalesce\(c\.titulo, ''\)\s*\|\|\s*' '\s*\|\|\s*coalesce\(c\.descricao, ''\)\)/,
  );
  assert.ok(whereMatch, 'expressão de FTS não encontrada em search.service.js');
  // a busca usa o alias "c."; a migration referencia as colunas diretamente
  const whereExpr = normalize(whereMatch[0].replace(/c\./g, ''));

  assert.equal(
    indexExpr,
    whereExpr,
    'a expressão do índice GIN diverge do WHERE da busca: o planejador não conseguiria usá-lo',
  );
});

test('a consulta existente continua parametrizada e com limite aplicado', () => {
  const serviceSql = fs.readFileSync(SEARCH_SERVICE, 'utf8');
  assert.match(serviceSql, /plainto_tsquery\('portuguese', \$\{termo\}\)/);
  assert.match(serviceSql, /LIMIT \$\{take\}/);
});

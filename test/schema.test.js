import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { test } from 'node:test';

const DATABASE_URL = 'postgresql://synthetic:synthetic@127.0.0.1:5432/synthetic?schema=public';
const ENV = { ...process.env, DATABASE_URL };
const SCHEMA = 'prisma/schema.prisma';
const GENERATED_DIR = 'node_modules/.prisma/client';

function prisma(args) {
  return execFileSync('npx', ['prisma', ...args], { env: ENV, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}

test('schema.prisma existe e declara os cinco modelos do domínio', () => {
  const schema = readFileSync(SCHEMA, 'utf8');
  for (const model of ['Usuario', 'Categoria', 'Chamado', 'Solucao', 'Tag']) {
    assert.match(schema, new RegExp(`^model ${model} \\{`, 'm'), `modelo ${model} ausente`);
  }
});

test('prisma validate aceita o schema com DATABASE_URL sintética local', () => {
  const out = prisma(['validate']);
  assert.match(out, /valid/i);
});

test('prisma generate produz o client sem conexão com banco', () => {
  prisma(['generate']);
  assert.ok(existsSync(`${GENERATED_DIR}/schema.prisma`), 'client não foi gerado');
});

test('client gerado expõe relações e enums reais no DMMF', async () => {
  const { Prisma, Status, Prioridade } = await import('@prisma/client');
  const models = new Map(Prisma.dmmf.datamodel.models.map((model) => [model.name, model]));
  assert.deepEqual([...models.keys()].sort(), ['Categoria', 'Chamado', 'Solucao', 'Tag', 'Usuario']);
  const field = (model, name) => {
    const result = models.get(model)?.fields.find((item) => item.name === name);
    assert.ok(result, `${model}.${name} ausente do client gerado`);
    return result;
  };
  assert.equal(field('Usuario', 'email').isUnique, true);
  assert.equal(field('Usuario', 'cargo').isRequired, false);
  assert.equal(models.get('Usuario').fields.some((item) => item.name === 'senhaHash'), false);
  assert.equal(field('Categoria', 'nome').isUnique, true);
  assert.deepEqual(field('Chamado', 'autor').relationFromFields, ['autorId']);
  assert.deepEqual(field('Chamado', 'categoria').relationFromFields, ['categoriaId']);
  assert.equal(field('Chamado', 'tags').isList, true);
  assert.equal(field('Chamado', 'solucao').isRequired, false);
  assert.equal(field('Solucao', 'chamadoId').isUnique, true);
  assert.deepEqual(field('Solucao', 'responsavel').relationFromFields, ['responsavelId']);
  assert.equal(field('Tag', 'nome').isUnique, true);
  assert.ok(Status.ABERTO && Status.RESOLVIDO && Prioridade.MEDIA);
});

test('nomes de tabela default permanecem compatíveis com o SQL de busca', () => {
  const schema = readFileSync(SCHEMA, 'utf8');
  assert.doesNotMatch(schema, /@@map/); // sem @@map, tabelas são "Usuario", "Categoria", "Chamado", ...
  const search = readFileSync('src/services/search.service.js', 'utf8');
  for (const table of ['"Chamado"', '"Categoria"', '"Usuario"', '"criadoEm"', '"categoriaId"', '"autorId"']) {
    assert.ok(search.includes(table), `SQL de busca espera ${table}`);
  }
});

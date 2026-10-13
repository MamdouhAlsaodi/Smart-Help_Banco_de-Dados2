// Etapa 7 — verificação da estrutura do seeder e scripts de demonstração
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const SEED_FILE = path.join(ROOT, 'src', 'seed.js');
const DEMO_FILE = path.join(ROOT, 'src', 'demo.js');

test('arquivos de seed e demonstração existem', () => {
  assert.ok(fs.existsSync(SEED_FILE), 'src/seed.js não existe');
  assert.ok(fs.existsSync(DEMO_FILE), 'src/demo.js não existe');
});

test('seed.js declara meta de 5000 chamados e usa Faker', () => {
  const content = fs.readFileSync(SEED_FILE, 'utf8');
  assert.match(content, /5000/, 'meta padrão de 5.000 chamados não declarada');
  assert.match(content, /@faker-js\/faker/, 'seeder não importa @faker-js/faker');
  assert.match(content, /createManyAndReturn/, 'seeder não utiliza inserção em lote createManyAndReturn');
  assert.match(content, /_ChamadoToTag/, 'seeder não popula relacionamentos com tags');
});

test('demo.js importa o serviço de busca e trata o termo de pesquisa', () => {
  const content = fs.readFileSync(DEMO_FILE, 'utf8');
  assert.match(content, /searchService/, 'demo.js não utiliza o searchService');
  assert.match(content, /recuperar acesso senha/, 'termo padrão da demonstração ausente');
});

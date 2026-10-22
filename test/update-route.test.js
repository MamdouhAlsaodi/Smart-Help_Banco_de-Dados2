import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('service oferece atualizar() para editar campos do chamado', async () => {
  const src = fs.readFileSync(path.join(root, 'src/services/chamados.service.js'), 'utf8');
  assert.match(src, /async atualizar\(/, 'falta metodo atualizar no service');
  assert.match(src, /status: 'FECHADO'|FECHADO/, 'falta status FECHADO no fluxo de atualizacao/fechamento');
});

test('rota PUT/PATCH /:id existe no router de chamados', async () => {
  const src = fs.readFileSync(path.join(root, 'src/routes/chamados.routes.js'), 'utf8');
  assert.match(src, /\.put\('\/:id'/, 'falta rota PUT /:id');
  assert.match(src, /atualizar\(/, 'a rota deve chamar o service atualizar');
});

test('listar aplica filtro por autorId e ordenacao configuravel', async () => {
  const src = fs.readFileSync(path.join(root, 'src/services/chamados.service.js'), 'utf8');
  assert.match(src, /autorId/, 'listar deve aceitar filtro autorId');
  assert.match(src, /ordenacao|orderByDir|ordem/i, 'listar deve aceitar ordenacao configuravel');
});

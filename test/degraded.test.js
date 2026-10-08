import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import app from '../src/app.js';

let server;
let base;

before(async () => {
  server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  if (server) await new Promise((resolve) => server.close(resolve));
});

async function request(path, options) {
  const response = await fetch(`${base}${path}`, options);
  return { status: response.status, body: await response.json() };
}

test('root and unknown route are reachable without generated Prisma client', async () => {
  assert.equal((await request('/')).status, 200);
  assert.equal((await request('/missing')).status, 404);
});

test('health reports unavailable database rather than a false 200', async () => {
  const response = await request('/health');
  assert.equal(response.status, 503);
  assert.equal(response.body.banco, 'desconectado');
});

test('unavailable database never returns empty or fabricated records', async () => {
  assert.equal((await request('/api/chamados')).status, 503);
  assert.equal((await request('/api/categorias')).status, 503);
  assert.equal((await request('/api/usuarios')).status, 503);
  assert.equal((await request('/api/busca?q=senha')).status, 503);
  const response = await request('/api/chamados', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ titulo: 'Teste', descricao: 'Teste', autorId: 1, categoriaId: 1 })
  });
  assert.equal(response.status, 503);
  assert.equal(response.body.id, undefined);
});

test('internal errors never disclose database details to clients', async () => {
  const response = await request('/api/chamados');
  assert.equal(response.status, 503);
  assert.doesNotMatch(JSON.stringify(response.body), /PrismaClient|DATABASE_URL|schema|stack/i);
});

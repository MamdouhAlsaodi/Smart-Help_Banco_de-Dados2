// Smoke HTTP sintético de integração da API Express real sobre o PostgreSQL
// sintético de CI preparado por scripts/ci/migration-smoke.sh (e o seed de
// ~5k do fts-check.mjs data). Executa SOMENTE no runner GitHub-hosted
// isolado, contra o banco 127.0.0.1:5432/smarthelp_ci (schema public) e
// recusa qualquer escrita fora dele. Não há asserção de tempo/latência.
import assert from 'node:assert/strict';
import { app } from '../../src/app.js';
import { prisma } from '../../src/lib/prisma.js';

// ---------- guardas de alvo sintético ----------
const target = new URL(process.env.DATABASE_URL || 'postgresql://invalid/');
if (process.env.GITHUB_ACTIONS !== 'true'
  || process.env.RUNNER_ENVIRONMENT !== 'github-hosted'
  || target.hostname !== '127.0.0.1' || target.port !== '5432'
  || target.username !== 'smarthelp_ci' || target.pathname !== '/smarthelp_ci'
  || target.searchParams.get('schema') !== 'public') {
  throw new Error('Refusing to run the API smoke outside its synthetic CI database');
}

const server = app.listen(0, '127.0.0.1');
await new Promise((resolve, reject) => { server.once('listening', resolve); server.once('error', reject); });
const base = `http://127.0.0.1:${server.address().port}`;
const api = async (path, options) => {
  const res = await fetch(`${base}${path}`, options);
  let body = null;
  try { body = await res.json(); } catch { /* corpo não-JSON é reportado abaixo */ }
  return { status: res.status, body };
};

try {
  // ---------- health ----------
  const health = await api('/health');
  assert.equal(health.status, 200, `health falhou: ${JSON.stringify(health.body)}`);
  assert.equal(health.body.status, 'ok');
  assert.equal(health.body.banco, 'conectado');
  console.log(`[api-smoke] /health 200: banco conectado`);

  // ---------- registros sintéticos reutilizáveis ----------
  const suffix = `${process.env.GITHUB_RUN_ID ?? 'ci'}-${process.env.GITHUB_RUN_ATTEMPT ?? '1'}`;
  const autor = await prisma.usuario.upsert({
    where: { email: `api-smoke-${suffix}@smarthelp.dev` },
    update: {},
    create: { nome: 'Usuário API Smoke CI', email: `api-smoke-${suffix}@smarthelp.dev`, cargo: 'Analista' },
  });
  const categoria = await prisma.categoria.upsert({
    where: { nome: `API Smoke CI ${suffix}` },
    update: {},
    create: { nome: `API Smoke CI ${suffix}`, descricao: 'Categoria sintética do smoke HTTP' },
  });
  const responsavel = await prisma.usuario.upsert({
    where: { email: `api-smoke-resp-${suffix}@smarthelp.dev` },
    update: {},
    create: { nome: 'Responsável API Smoke CI', email: `api-smoke-resp-${suffix}@smarthelp.dev`, cargo: 'Técnico' },
  });

  // ---------- listagens ----------
  const categorias = await api('/api/categorias');
  assert.equal(categorias.status, 200);
  assert.ok(Array.isArray(categorias.body) && categorias.body.some((c) => c.id === categoria.id),
    'categoria sintética não listada em /api/categorias');
  const usuarios = await api('/api/usuarios');
  assert.equal(usuarios.status, 200);
  assert.ok(Array.isArray(usuarios.body) && usuarios.body.some((u) => u.id === autor.id),
    'usuário sintético não listado em /api/usuarios');
  const chamadosLista = await api('/api/chamados');
  assert.equal(chamadosLista.status, 200);
  assert.ok(Array.isArray(chamadosLista.body), '/api/chamados não retornou lista');
  console.log(`[api-smoke] listagens OK: ${categorias.body.length} categorias, ${usuarios.body.length} usuários, ${chamadosLista.body.length} chamados na página 1`);

  // ---------- POST /api/chamados com tag ----------
  const criado = await api('/api/chamados', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      titulo: 'Impressora sintética do smoke HTTP fora da rede',
      descricao: 'Chamado sintético criado pelo api-smoke para validar integração e busca',
      autorId: autor.id,
      categoriaId: categoria.id,
      tags: ['api-smoke-ci'],
    }),
  });
  assert.equal(criado.status, 201, `POST /api/chamados falhou: ${JSON.stringify(criado.body)}`);
  assert.ok(criado.body.tags?.some((t) => t.nome === 'api-smoke-ci'), 'tag não vinculada ao chamado criado');
  const chamadoId = criado.body.id;

  // persistência real no banco sintético
  const persistido = await prisma.chamado.findUnique({
    where: { id: chamadoId },
    include: { tags: true, solucao: true },
  });
  assert.equal(persistido?.status, 'ABERTO');
  assert.ok(persistido.tags.some((t) => t.nome === 'api-smoke-ci'));

  // ---------- GET por ID ----------
  const porId = await api(`/api/chamados/${chamadoId}`);
  assert.equal(porId.status, 200);
  assert.equal(porId.body.id, chamadoId);
  assert.equal(porId.body.status, 'ABERTO');
  assert.equal(porId.body.solucao, null);

  // ---------- PATCH resolver com responsável sintético ----------
  const resolvido = await api(`/api/chamados/${chamadoId}/resolver`, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ texto: 'Solução sintética do smoke HTTP', responsavelId: responsavel.id }),
  });
  assert.equal(resolvido.status, 200, `PATCH resolver falhou: ${JSON.stringify(resolvido.body)}`);
  assert.equal(resolvido.body.status, 'RESOLVIDO');
  assert.equal(resolvido.body.solucao?.texto, 'Solução sintética do smoke HTTP');
  const posResolver = await api(`/api/chamados/${chamadoId}`);
  assert.equal(posResolver.body.status, 'RESOLVIDO');
  assert.equal(posResolver.body.solucao?.responsavelId, responsavel.id);
  console.log(`[api-smoke] ciclo POST/GET/PATCH do chamado ${chamadoId} OK, persistido como RESOLVIDO`);

  // ---------- GET /api/busca com dados sintéticos reais do FTS ----------
  const busca = await api('/api/busca?q=impressora%20rede&limite=5');
  assert.equal(busca.status, 200, `busca falhou: ${JSON.stringify(busca.body)}`);
  assert.ok(Array.isArray(busca.body), '/api/busca não retornou lista');
  assert.ok(busca.body.length > 0, 'busca FTS "impressora rede" sem resultados no banco semeado');
  assert.ok(busca.body.length <= 5, 'limite=5 não foi respeitado');
  assert.ok(busca.body.every((r) => `${r.titulo} ${r.descricao}`.toLowerCase().includes('impressora')
    && `${r.titulo} ${r.descricao}`.toLowerCase().includes('rede')), 'resultado sem os termos pedidos');
  console.log(`[api-smoke] /api/busca "impressora rede" (limite 5): ${busca.body.length} resultados sintéticos`);

  // ---------- validações de erro ----------
  const buscaVazia = await api('/api/busca?q=%20%20');
  assert.equal(buscaVazia.status, 400, 'q vazio deveria retornar 400');
  const inexistente = await api('/api/chamados/999999999');
  assert.equal(inexistente.status, 404, 'ID inexistente deveria retornar 404');
  console.log('[api-smoke] validações de erro OK: q vazio → 400, ID inexistente → 404');

  console.log('[api-smoke] smoke HTTP sintético de integração concluído');
} finally {
  server.close();
  await prisma.$disconnect().catch(() => {});
}

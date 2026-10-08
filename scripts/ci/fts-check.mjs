// Etapa 8 — verificação real de Full-Text Search em PostgreSQL sintético de CI.
// Executa SOMENTE no projeto Compose guardado do CI (banco 127.0.0.1:5432/smarthelp_ci).
// Modos:
//   data  — semeia ~5.000 Chamados sintéticos e valida a busca real via searchService,
//           ranks, limite e índice no catálogo; registra o plano EXPLAIN ANALYZE.
//   index — após o rebuild com volume vazio, confere que o índice GIN foi recriado,
//           sem semear dados.
import assert from 'node:assert/strict';
import { PrismaClient } from '@prisma/client';
import { searchService } from '../src/services/search.service.js';

const mode = process.argv[2];
if (mode !== 'data' && mode !== 'index') {
  throw new Error('uso: node scripts/ci/fts-check.mjs <data|index>');
}

const target = new URL(process.env.DATABASE_URL || 'postgresql://invalid/');
if (process.env.GITHUB_ACTIONS !== 'true'
  || target.hostname !== '127.0.0.1' || target.port !== '5432'
  || target.username !== 'smarthelp_ci' || target.pathname !== '/smarthelp_ci'
  || target.searchParams.get('schema') !== 'public') {
  throw new Error('Refusing to run the FTS check outside its synthetic CI database');
}

const prisma = new PrismaClient();
const FTS_INDEX = 'Chamado_fts_idx';

async function assertIndexInCatalog() {
  const rows = await prisma.$queryRaw`
    SELECT i.indexname, i.indexdef, ix.indisvalid
    FROM pg_indexes i
    JOIN pg_class c ON c.relname = i.indexname
    JOIN pg_index ix ON ix.indexrelid = c.oid
    WHERE i.indexname = ${FTS_INDEX} AND i.tablename = 'Chamado'
      AND i.schemaname = 'public'
  `;
  assert.equal(rows.length, 1, `índice ${FTS_INDEX} ausente no catálogo`);
  assert.equal(rows[0].indisvalid, true, `índice ${FTS_INDEX} inválido`);
  assert.match(rows[0].indexdef, /\bgin\b/i, `índice ${FTS_INDEX} não é GIN`);
  console.log(`[fts-check] índice no catálogo: ${rows[0].indexdef}`);
}

if (mode === 'index') {
  await assertIndexInCatalog();
  console.log('[fts-check] índice GIN recriado após rebuild com volume vazio (sem seed)');
  await prisma.$disconnect();
  process.exit(0);
}

// ---------- modo data ----------
await assertIndexInCatalog();

// Usuário e categoria reutilizáveis, sintéticos e sem e-mail real.
const usuario = await prisma.usuario.create({
  data: { nome: 'Usuário FTS CI', email: 'fts-ci@smarthelp.dev', cargo: 'Analista' },
});
const categoria = await prisma.categoria.create({ data: { nome: 'FTS CI' } });

// ~5.000 Chamados sintéticos em lotes:
//  - "impressora" no título (100), só na descrição (100), ausente no resto;
//  - termos exclusivos (apenas 1 registro cada) para comparar rank título x descrição;
const TOTAL = 5000;
const BATCH = 500;
const base = (i) => ({
  titulo: i % 25 === 0
    ? 'Impressora sintética de rede travando'
    : i === 1
      ? 'Chamado comtermotitular exclusivo do título'
      : 'Monitor sintético comum de validação',
  descricao: i % 25 === 12
    ? 'Bandeja da impressora sintética emperrada'
    : i === 2
      ? 'Texto neutro com comtermotitular exclusivo na descrição'
      : 'Registro sintético comum para validação do índice de texto completo',
  status: i % 3 === 0 ? 'ABERTO' : i % 3 === 1 ? 'EM_ATENDIMENTO' : 'RESOLVIDO',
  prioridade: i % 3 === 0 ? 'BAIXA' : i % 3 === 1 ? 'MEDIA' : 'ALTA',
  autorId: usuario.id,
  categoriaId: categoria.id,
});
for (let start = 0; start < TOTAL; start += BATCH) {
  const batch = Array.from({ length: Math.min(BATCH, TOTAL - start) }, (_, k) => base(start + k));
  const res = await prisma.chamado.createMany({ data: batch });
  assert.equal(res.count, batch.length);
}
console.log(`[fts-check] ${TOTAL} chamados sintéticos semeados`);

// 1) correspondência multi-termo em título e descrição (plainto_tsquery faz AND).
const multi = await searchService.buscar('impressora rede', 50);
assert.ok(multi.length > 0, 'busca multi-termo não retornou nada');
assert.ok(multi.every((r) => {
  const t = `${r.titulo} ${r.descricao}`.toLowerCase();
  return t.includes('impressora') && t.includes('rede');
}), 'resultado multi-termo sem todos os termos');
console.log(`[fts-check] multi-termo "impressora rede": ${multi.length} resultados (limite 50)`);

// 2) rank do título acima do rank da descrição (setweight A/B).
const ranked = await searchService.buscar('comtermotitular', 10);
assert.equal(ranked.length, 2, 'esperava exatamente 2 registros com o termo exclusivo');
assert.match(ranked[0].titulo, /comtermotitular/i, 'registro com termo no título não ficou em primeiro');
assert.match(ranked[1].descricao, /comtermotitular/i, 'registro com termo só na descrição deveria vir depois');
assert.ok(Number(ranked[0].rank) > Number(ranked[1].rank), 'rank do título não superou o da descrição');
console.log(`[fts-check] rank título (${ranked[0].rank}) > rank descrição (${ranked[1].rank})`);

// 3) termo ausente não pode retornar nada.
const missing = await searchService.buscar('termoquelquenuncalevou999');
assert.equal(missing.length, 0, 'termo inexistente retornou resultados');

// 4) limite da consulta.
const limited = await searchService.buscar('comum', 5);
assert.equal(limited.length, 5, 'limite explícito não foi aplicado');
const capped = await searchService.buscar('comum', 999);
assert.ok(capped.length <= 50, 'teto de 50 não foi aplicado');
console.log(`[fts-check] limites: com limite 5 → ${limited.length}; com limite 999 → ${capped.length} (teto 50)`);

// 5) Atualiza estatísticas após o bulk insert para que o plano reflita 5.000 linhas.
await prisma.$executeRaw`ANALYZE "Chamado"`;
// EXPLAIN ANALYZE registra observações do plano e tempo APENAS no CI sintético.
//    Sem limiar de latência dependente de máquina nem extrapolação para produção.
const explain = await prisma.$queryRaw`
  EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
  SELECT c.id FROM "Chamado" c
  WHERE to_tsvector('portuguese', coalesce(c.titulo, '') || ' ' || coalesce(c.descricao, ''))
    @@ plainto_tsquery('portuguese', 'comtermotitular')`;
const plan = explain[0]['QUERY PLAN'][0];
const nodes = [];
(function walk(node) {
  nodes.push(node);
  (node.Plans || []).forEach(walk);
})(plan.Plan);
const usedGin = nodes.some((node) => node['Index Name'] === FTS_INDEX);
console.log(`[fts-check] EXPLAIN ANALYZE em ${TOTAL} chamados sintéticos: ${nodes.map((node) => node['Node Type']).join(' -> ')}; índice ${FTS_INDEX} usado: ${usedGin ? 'sim' : 'não (planejador preferiu outro caminho)'}; tempo observado ${plan['Execution Time']} ms (CI apenas)`);

console.log('[fts-check] verificação real de FTS concluída no banco sintético de CI');
await prisma.$disconnect();

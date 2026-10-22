# Roteiro da Demonstração — SmartHelp (Etapas 13–14)

Duração alvo: ~8 minutos. Preparar antes: `docker compose up -d postgres`,
`npm run db:migrate`, `npm run db:seed`, `npm run start` (ou `npm run dev`).

## 1. Infraestrutura (1 min)
- Mostrar `docker compose ps`: PostgreSQL 16 saudável em container.
- Apontar `docker-compose.yml`: serviços `postgres` e `pgadmin`, variáveis via `.env`
  (nenhuma senha no Git — `.env.example` documenta o formato).

## 2. Modelo e migrações (1,5 min)
- `docs/DER.md`: 5 tabelas + junção `_ChamadoToTag`, enums `Status` (com `FECHADO`)
  e `Prioridade`.
- `prisma/migrations/`: inicial → FTS (GIN) → `add_status_fechado`; histórico
  incremental, cada uma com teste no CI (`migration` workflow).

## 3. Massa de dados (1 min)
- `npm run db:seed` (já executado): 5.000 chamados em lotes de 500, ~2 s.
- Resumo do seed: 41 usuários, 8 categorias, 20 tags, 1.944 soluções, 12.000 vínculos.

## 4. API de chamados (2,5 min)
- `GET /api/chamados?status=ABERTO&prioridade=ALTA&limite=5` — filtros + paginação + ordenação.
- `POST /api/chamados` — abrir chamado ao vivo (mostrar validação 400 sem campos).
- `PUT /api/chamados/:id` — editar prioridade; depois `{"status":"FECHADO"}`.
- Regra de negócio: tentar reabrir um chamado resolvido → **409** (imutabilidade pós-resolução,
  exceto fechamento).
- `PATCH /api/chamados/:id/resolver` — registrar solução com responsável.

## 5. Full-Text Search (2 min) — destaque
- `npm run demo impressora rede` — CLI com latência e ranking.
- `GET /api/busca?q=impressora rede` — mesmos resultados via HTTP.
- `docs/DESEMPENHO-FTS.md`: EXPLAIN com Bitmap Index Scan no GIN (0,078 ms para
  localizar 500 candidatos; ~5 ms total com ranking).

## 6. Encerramento (30 s)
- Testes: `npm test` → 33/33. CI no GitHub: 5 workflows verdes em cada PR.
- Participação: commits separados por responsável (IA_LOG.md documenta cada uso de IA).

## Perguntas prováveis
- *Por que GIN e não índice B-tree?* — tsvector não ordena; GIN acelera o operador `@@`.
- *Por que Prisma?* — migrations versionadas + typesafety; FTS fica em SQL nativo
  (`$queryRaw`) onde o ORM não expressa.
- *Como escalaria?* — particionamento por data, `tsvector` materializado em coluna
  e `pg_trgm` para prefixo/typo (fora do escopo do MVP).

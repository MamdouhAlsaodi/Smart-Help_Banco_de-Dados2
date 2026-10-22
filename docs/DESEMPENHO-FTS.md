# Notas de Desempenho — Full-Text Search (Etapa 8)

Ambiente de medição: PostgreSQL 16 (Docker, `postgres:16-alpine`), host local,
banco populado pelo seeder com **5.000 chamados**, 41 usuários, 8 categorias,
20 tags, 1.944 soluções e 12.000 vínculos chamado↔tag.

Índice: `Chamado_fts_idx` — GIN sobre
`to_tsvector('portuguese', coalesce("titulo",'') || ' ' || coalesce("descricao",''))`.

## Consulta canônica (termo duplo: "impressora rede")

`EXPLAIN (ANALYZE, BUFFERS)`:

```
Limit  (cost=320.27..320.29 rows=10) (actual time=13.701..13.704 rows=10)
  Sort  (actual time=13.701..13.702 rows=10)
    Sort Method: top-N heapsort  Memory: 27kB
    Buffers: shared hit=237
    ->  Bitmap Heap Scan on "Chamado"  (actual time=0.177..13.605 rows=500)
          Recheck Cond: (to_tsvector(...) @@ '''impressor'' & ''red''')
          Heap Blocks: exact=224
          Buffers: shared hit=234
          ->  Bitmap Index Scan on "Chamado_fts_idx"  (actual time=0.078..0.078 rows=500)
                Index Cond: (to_tsvector(...) @@ '''impressor'' & ''red''')
```

Leitura do plano:
- **Bitmap Index Scan no GIN** resolve a filtragem: 0,078 ms para achar 500 candidatos.
- Recheck + leitura das tuplas (237 páginas em cache) leva o total a ~13,7 ms **com
  ordenação por relevância (`ts_rank`) e LIMIT 10** — primeira execução a frio.
- Execuções subsequentes (cache quente) estabilizam em ~4–5 ms pela API
  (`GET /api/busca?q=...`), medido com o script `npm run demo`.

## Termos individuais

| Termo          | Resultados | Índice usado |
| -------------- | ---------- | ------------ |
| `rede`         | 10 (LIMIT) | Bitmap GIN   |
| `impressora`   | 10 (LIMIT) | Bitmap GIN   |
| `impressora rede` (AND) | 500 → top 10 por rank | Bitmap GIN + Sort |

Conclusão: a busca continua eficiente com milhares de registros — o GIN mantém a
filtragem em escala sublinear e a ordenação por relevância é o custo dominante,
ainda assim na casa de poucos milissegundos.

## Latência observada pela API

- `GET /api/busca?q=rede` ≈ **4–5 ms** (cache quente, Node + Prisma).
- `npm run demo rede` imprime a latência de cada consulta no formato final de demonstração.

Como reproduzir:

```sh
docker compose up -d postgres
npm run db:migrate && npm run db:seed
npm run demo impressora rede
docker compose exec postgres psql -U $POSTGRES_USER -d $POSTGRES_DB -c \
  "EXPLAIN (ANALYZE, BUFFERS) SELECT id, titulo FROM \"Chamado\" \
   WHERE to_tsvector('portuguese', coalesce(titulo,'') || ' ' || coalesce(descricao,'')) \
     @@ websearch_to_tsquery('portuguese','impressora rede');"
```

# Arquitetura — persistência, infraestrutura e busca

## Infraestrutura

- `docker-compose.yml` define `postgres` (PostgreSQL 16) e `pgadmin` (pgAdmin 4).
- PostgreSQL e pgAdmin mantêm dados em volumes nomeados separados; `docker compose down` não remove esses volumes. **Não** use `down -v` em um banco que queira preservar.
- As duas portas são publicadas apenas em `127.0.0.1` do host, com portas configuráveis em `.env`.
- O healthcheck do PostgreSQL usa `pg_isready`; pgAdmin aguarda o serviço ficar saudável.
- Usuário, banco e senhas vêm do `.env` local (não versionado). `.env.example` deixa as senhas vazias para exigir configuração explícita.
- Para registrar um servidor no pgAdmin, use o host `postgres` e a porta `5432` na rede do Compose, com os mesmos `POSTGRES_USER`, `POSTGRES_PASSWORD` e `POSTGRES_DB` do `.env`.
- O Prisma/Node.js executado no **host** usará `DATABASE_URL` com `127.0.0.1` e `POSTGRES_PORT`; dentro de outro contêiner, usaria `postgres:5432`.

## Estado e limites

A sintaxe do Compose foi validada localmente; os contêineres não foram iniciados neste host porque o usuário atual não tem acesso ao daemon Docker. O workflow de infraestrutura do PR #6 (run 37852630617, head `5b9dc441`) confirmou PostgreSQL saudável, pgAdmin acessível por HTTP e persistência após `down`/`up` com registro sintético; os volumes do projeto efêmero foram removidos. Ainda falta reproduzir no ambiente dos dois integrantes e abrir as tabelas no pgAdmin.

## Modelo e migrations

- `prisma/schema.prisma` define `Usuario`, `Categoria`, `Chamado`, `Solucao`, `Tag`, enums `Status`/`Prioridade` e relações 1:N, 1:1 e M:N; `docs/DER.md` descreve o mesmo modelo.
- `prisma/migrations/20261008_initial/migration.sql` cria as tabelas, constraints/índices B-tree, FKs e tabela de junção; `prisma/migrations/migration_lock.toml` fixa o provider PostgreSQL. `npm run db:migrate` aplica o histórico existente com `prisma migrate deploy` em um banco configurado em `DATABASE_URL`.
- O CI do PR #8 (run 37853729957) executou `migrate deploy`, leitura/escrita sintética com relações, restrições, persistência após reinício e reconstrução de volume vazio. Não há prova de aplicação no PostgreSQL local dos participantes.

## Busca Full-Text Search

A migration posterior `20261008b_full_text_search` cria `Chamado_fts_idx`, um índice GIN de expressão sobre `to_tsvector('portuguese', coalesce(titulo, '') || ' ' || coalesce(descricao, ''))`. O nome com `b` é intencional: ordena **depois** de `20261008_initial`; `20261008_full_text_search` ordenaria antes e falharia porque a tabela ainda não existiria. O `WHERE` parametrizado do serviço `src/services/search.service.js` usa a mesma expressão; o ranking dá peso A ao título e B à descrição. O índice de expressão foi escrito em SQL de migration, não representado como campo/índice no schema Prisma: revise o diff de qualquer migration futura para não o remover acidentalmente.

O CI isolado do PR #9 (run 37855027555) inseriu 5.000 chamados sintéticos, verificou correspondência multi-termo, ranking, limite, ausência de resultados, catálogo do índice e sua reconstrução após volume vazio. O `EXPLAIN ANALYZE` daquela consulta seletiva exibiu Bitmap Index Scan em `Chamado_fts_idx` e tempo observado de **0,756 ms naquele runner**; não é meta de latência nem benchmark para produção. A rota HTTP de busca com o seeder do projeto e o teste em máquina dos integrantes ainda estão pendentes.

## Limites da validação

Os workflows usam credenciais aleatórias efêmeras e limpam apenas recursos Compose criados com identificador de execução; não usam `.env` nem registros reais. `npm test` inclui verificações offline (schema, SQL, import e comportamento degradado), mas não substitui o teste manual da API, a inspeção pgAdmin nem o teste cruzado da Etapa 9. Nunca remova um volume local com dados reais para repetir o smoke do CI.

# Arquitetura — infraestrutura (etapa 2)

## Implementado nesta etapa

- `docker-compose.yml` define `postgres` (PostgreSQL 16) e `pgadmin` (pgAdmin 4).
- PostgreSQL e pgAdmin mantêm dados em volumes nomeados separados; `docker compose down` não remove esses volumes. **Não** use `down -v` em um banco que queira preservar.
- As duas portas são publicadas apenas em `127.0.0.1` do host, com portas configuráveis em `.env`.
- O healthcheck do PostgreSQL usa `pg_isready`; pgAdmin aguarda o serviço ficar saudável.
- Usuário, banco e senhas vêm do `.env` local (não versionado). `.env.example` deixa as senhas vazias para exigir configuração explícita.
- Para registrar um servidor no pgAdmin, use o host `postgres` e a porta `5432` na rede do Compose, com os mesmos `POSTGRES_USER`, `POSTGRES_PASSWORD` e `POSTGRES_DB` do `.env`.
- O Prisma/Node.js executado no **host** usará `DATABASE_URL` com `127.0.0.1` e `POSTGRES_PORT`; dentro de outro contêiner, usaria `postgres:5432`.

## Estado e limites

A sintaxe do Compose foi validada localmente; os contêineres não foram iniciados neste host porque o usuário atual não tem acesso ao daemon Docker. Um workflow de CI isolado com credenciais sintéticas verificou PostgreSQL saudável, pgAdmin acessível por HTTP e persistência de um registro após `down`/`up` (run 37852346903). Os volumes sintéticos foram removidos ao final. Ainda falta reproduzir no ambiente dos dois integrantes. Schema Prisma, migrations e Full-Text Search pertencem a incrementos posteriores deste ramo; `docs/DER.md` será preenchido na etapa de modelo.

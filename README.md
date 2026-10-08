# SmartHelp — Banco de Dados II

MVP de backend para um **Sistema de Helpdesk**, desenvolvido com foco em modelagem relacional, conteinerização, ORM e recuperação eficiente de informações.

## Stack

- Node.js 22–24
- PostgreSQL 16
- Docker / Docker Compose
- Prisma ORM
- Express
- Full-Text Search nativo do PostgreSQL (recurso adicional)

## Objetivo

Registrar chamados de suporte com usuários, categorias, prioridades, tags e soluções, permitindo consultar e recuperar chamados antigos de forma rápida.

## Execução

**Estado atual:** a API base existe; o Compose já define PostgreSQL e pgAdmin, mas o schema Prisma,
as migrations, o seeder e a busca integrada ainda serão implementados. Neste ambiente o Compose
foi validado estaticamente, mas os contêineres não puderam ser iniciados (sem acesso ao daemon).

```bash
cp .env.example .env
# Edite .env: escolha POSTGRES_PASSWORD e PGADMIN_DEFAULT_PASSWORD distintos e preencha
# DATABASE_URL com o mesmo usuário/senha/banco/porta PostgreSQL do .env.
docker compose up -d
docker compose ps
npm ci
npm test
```

PostgreSQL: `127.0.0.1:5432` (porta ajustável em `.env`).
pgAdmin: `http://127.0.0.1:5050` (porta ajustável em `.env`). Para cadastrar o
servidor no pgAdmin, use host `postgres`, porta `5432` e as credenciais
`POSTGRES_*` do `.env`. `docker compose down` encerra preservando os volumes;
**não** use `down -v` se quiser manter os dados.

### Quando schema e migrations estiverem disponíveis

```bash
npm run prisma:generate
npm run db:migrate
npm run db:seed
npm start
```

O comando `npm run demo` e os exemplos de API ainda dependem das etapas seguintes.
Sem banco operacional, `GET /health` responde **503** e não simula registros.

## Rotas previstas (base implementada; integração de dados pendente)

- `GET /health`
- `GET /api/chamados`
- `GET /api/chamados/:id`
- `POST /api/chamados`
- `PATCH /api/chamados/:id/resolver`
- `GET /api/busca?q=...`
- `GET /api/categorias`
- `GET /api/usuarios`

## Documentação

- `PLANO.md` — plano de execução.
- `PROCESSO.md` — resumo do processo: arquivo discutido, análise, planejamento e execução.
- `IA_LOG.md` — registro do uso da IA como copiloto técnico.
- `docs/DER.md` — modelo entidade-relacionamento (pendente).
- `docs/ARQUITETURA.md` — arquitetura da infraestrutura e limites de validação.
- `requests.http` — exemplos de chamadas à API (pendentes).

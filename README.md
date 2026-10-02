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

```bash
cp .env.example .env
docker compose up -d
npm install
npx prisma generate
npx prisma migrate deploy
npm run db:seed
npm start
```

API: `http://localhost:3000`  
pgAdmin: `http://localhost:5050`

## Teste rápido

```bash
npm run demo -- "recuperar acesso senha"
```

Ou:

```bash
curl "http://localhost:3000/api/busca?q=recuperar%20acesso%20senha&limite=5"
```

## Rotas principais

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
- `docs/DER.md` — modelo entidade-relacionamento.
- `docs/ARQUITETURA.md` — visão da arquitetura.
- `requests.http` — exemplos prontos de chamadas à API.

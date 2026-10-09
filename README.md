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

## Estado e execução

**Implementado:** Compose PostgreSQL/pgAdmin, modelo Prisma/DER, duas migrations (tabelas e índice GIN de Full-Text Search) e base da API. No CI isolado, PostgreSQL/pgAdmin e persistência passaram (run 37852630617); as migrations reconstruíram um banco vazio (run 37853729957); e a busca real do serviço foi exercitada com 5.000 chamados **sintéticos** (run 37855027555). Nenhum desses runs substitui o teste local/cross-machine da dupla. O seeder `src/seed.js` ainda está vazio e `src/demo.js` não existe; `npm run db:seed` e `npm run demo` **não estão prontos**. A busca HTTP e os fluxos da API ainda exigem testes de integração no ambiente dos integrantes.

**Pré-requisitos:** Node.js 22–24, npm, Docker Engine e Docker Compose v2 com daemon acessível. Não coloque senhas no Git; o `.env` é local e ignorado.

```bash
cp .env.example .env
# Edite .env: escolha senhas distintas para POSTGRES_PASSWORD e
# PGADMIN_DEFAULT_PASSWORD. Preencha DATABASE_URL com o mesmo usuário,
# senha, banco e porta de POSTGRES_*; codifique caracteres especiais na URL.
docker compose up -d
docker compose ps                  # confira postgres saudável e pgadmin ativo
npm ci
npm run prisma:generate
npm run db:migrate                 # aplica a migration inicial e depois o índice GIN
npm test                           # testes automatizados (parte offline)
npm start                          # a API escuta na porta PORT do .env
```

PostgreSQL: `127.0.0.1:5432` (porta ajustável em `.env`). pgAdmin: `http://127.0.0.1:5050` (porta ajustável). Para cadastrar o servidor no pgAdmin, use host `postgres`, porta `5432`, banco e credenciais `POSTGRES_*` do `.env`. No pgAdmin, confira as tabelas `Usuario`, `Categoria`, `Chamado`, `Solucao`, `Tag`, `_ChamadoToTag` e `_prisma_migrations`; o índice de busca chama-se `Chamado_fts_idx` e está na tabela `Chamado`. Essa inspeção **ainda não foi feita neste host**.

Com dados cadastrados, experimente a rota já definida; sem dados ela retorna uma lista vazia:

```bash
curl --get 'http://127.0.0.1:3000/api/busca' --data-urlencode 'q=senha esquecida' --data-urlencode 'limite=5'
```

`docker compose down` encerra os serviços **preservando os volumes**. **Não** execute `down -v` sobre um banco que deseja conservar: esse comando elimina seus dados. A remoção/recriação de volume nos workflows acontece exclusivamente em projetos efêmeros com dados sintéticos.

Sem banco operacional, `GET /health` responde **503** e não simula registros. Se o Docker local não estiver acessível, o procedimento acima não está validado neste computador; não trate o CI como substituto do teste cruzado.

## Rotas atuais (a integração HTTP com banco populado ainda requer validação)

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
- `docs/DER.md` — modelo entidade-relacionamento implementado no Prisma (revisão cruzada pendente).
- `docs/ARQUITETURA.md` — persistência, migrations, Full-Text Search e limites de validação.
- `requests.http` — exemplos de chamadas da API (ainda pendentes).

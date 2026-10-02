# IA_LOG — Registro de Uso de Inteligência Artificial

## Etapa 1 — Leitura e análise das diretrizes
**Solicitação:** analisar o arquivo fornecido pela disciplina e identificar objetivo, requisitos obrigatórios, opções de expansão, documentação e critérios de avaliação.

**Resultado aplicado:** definição do escopo do MVP e escolha de uma arquitetura compatível com as diretrizes.

## Etapa 2 — Planejamento
**Solicitação:** elaborar uma proposta simples de Helpdesk, sem frontend, com foco em banco de dados, relacionamentos e recuperação de informação.

**Resultado aplicado:** criação do plano registrado em `PLANO.md`.

## Etapa 3 — Implementação assistida
**Solicitação:** preparar a estrutura inicial do projeto com Docker, PostgreSQL, Node.js, Prisma ORM, migrações, seeder de milhares de registros, rotas de API e consulta de busca.

**Adaptações realizadas no projeto:**
- nomenclatura em português para aproximar o código do domínio apresentado na disciplina;
- uso de transações no fluxo de criação e resolução de chamados;
- inclusão de índice Full-Text Search do PostgreSQL como recurso adicional de recuperação;
- organização da documentação para execução reproduzível.

> A IA foi utilizada como copiloto técnico. O código e a documentação devem ser revisados pela dupla antes da entrega.

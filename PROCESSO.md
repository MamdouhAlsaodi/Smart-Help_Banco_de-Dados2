# Processo de Desenvolvimento

O projeto foi conduzido de forma objetiva em quatro etapas:

1. **Arquivo enviado e discutido:** as diretrizes da disciplina foram disponibilizadas e os requisitos principais foram discutidos.
2. **Análise:** foram identificados o escopo, a stack obrigatória, as trilhas de expansão e os critérios de avaliação.
3. **Planejamento:** foi definida a proposta SmartHelp, baseada em Helpdesk, PostgreSQL, Docker, Node.js e Prisma ORM.
4. **Infraestrutura e banco (em revisão):** Compose com PostgreSQL e pgAdmin, schema Prisma/DER e migration inicial foram entregues em PRs separados. O CI com credenciais e dados sintéticos verificou PostgreSQL, acesso HTTP ao pgAdmin, aplicação/reconstrução das migrations e persistência; o daemon Docker não estava acessível neste host.
5. **Busca (em revisão):** uma segunda migration adiciona índice GIN de Full-Text Search em português. O serviço de busca existente foi testado no CI com 5.000 chamados sintéticos; o plano de execução usou o índice na consulta seletiva observada. Isso não mede produção nem prova o fluxo HTTP completo.
6. **Pendências compartilhadas:** seeder e demo ainda não implementados, revisão cruzada em ambiente limpo, integração HTTP/API com dados populados, documentação de endpoints e ensaio da demonstração. Os PRs #6–#9 permanecem separados e empilhados; aprovação/merge não é presumida.

# Plano Detalhado do Projeto — SmartHelp

## 1. Visão geral

O SmartHelp será um MVP de Helpdesk focado exclusivamente em backend, persistência e recuperação de dados. O sistema permitirá cadastrar usuários, categorias, chamados, soluções e tags, armazenar tudo no PostgreSQL e recuperar chamados antigos por meio de busca textual eficiente.

A infraestrutura será executada com Docker e Docker Compose. O backend será desenvolvido em Node.js e o banco principal será PostgreSQL. A trilha de expansão escolhida será Prisma ORM, com modelagem relacional, migrações e operações de leitura/escrita no banco. Como melhoria técnica do MVP, será utilizada a busca Full-Text Search do PostgreSQL para demonstrar recuperação rápida de informações em milhares de registros.

O trabalho será dividido entre duas pessoas, mas as etapas de integração, revisão, testes e documentação final serão feitas em conjunto. Cada integrante deverá produzir commits próprios e descritivos no Git durante o desenvolvimento.

---

## 2. Divisão geral de responsabilidades

### Mamdouh Alsaudi — Banco de Dados e Infraestrutura
Responsável principal por:
- preparação do repositório e estrutura inicial;
- Docker e Docker Compose;
- PostgreSQL e pgAdmin;
- configuração de variáveis de ambiente;
- modelagem relacional;
- Prisma ORM;
- migrations;
- índices e Full-Text Search;
- revisão de desempenho das consultas;
- apoio na documentação técnica do banco.

### Eberson Carneiro (@Mudoviskyy) — Backend, API e Dados de Teste
Responsável principal por:
- estrutura do backend Node.js;
- organização de rotas e serviços;
- endpoints da API;
- regras básicas de criação e atualização de chamados;
- seeder e geração de milhares de registros;
- scripts de demonstração;
- arquivo `requests.http`;
- testes manuais da API;
- apoio na documentação de uso e execução.

### Responsabilidades compartilhadas
Os dois integrantes devem participar de:
- análise inicial das diretrizes;
- decisões sobre escopo;
- revisão do modelo de dados;
- integração entre backend e banco;
- testes finais;
- README;
- IA_LOG.md;
- revisão dos commits;
- preparação da demonstração;
- validação final antes da entrega.

---

# 3. Etapas detalhadas

## ETAPA 0 — Leitura, discussão e análise das diretrizes

### Objetivo
Garantir que os dois integrantes entendam exatamente o que o professor solicitou antes de iniciar o desenvolvimento.

### Mamdouh Alsaudi
1. Ler o documento de diretrizes completo.
2. Identificar as tecnologias obrigatórias.
3. Separar os requisitos relacionados a banco de dados, Docker e modelagem.
4. Registrar pontos obrigatórios que não podem ser esquecidos.

### Eberson Carneiro (@Mudoviskyy)
1. Ler o mesmo documento completo.
2. Identificar o que precisa ser demonstrado pelo backend.
3. Separar os requisitos de API, seed, documentação e Git.
4. Registrar exemplos de uso esperados para o MVP.

### Em conjunto
1. Discutir o arquivo enviado.
2. Confirmar que o projeto será um sistema de Helpdesk.
3. Definir o nome SmartHelp.
4. Confirmar que não será desenvolvido frontend.
5. Escolher Prisma ORM como trilha principal.
6. Definir Full-Text Search do PostgreSQL como melhoria adicional.
7. Definir o MVP antes de escrever código.
8. Preparar este plano de execução.

### Resultado esperado
- escopo aprovado pela dupla;
- tecnologias definidas;
- responsabilidades separadas;
- nenhuma funcionalidade fora do escopo principal.

---

## ETAPA 1 — Preparação do repositório e estrutura do projeto

### Responsável principal: Mamdouh Alsaudi
### Revisão: Eberson Carneiro (@Mudoviskyy)

### Tarefas de Mamdouh Alsaudi
1. Criar o repositório Git.
2. Criar a estrutura de diretórios do projeto.
3. Adicionar `package.json`.
4. Criar `.gitignore`.
5. Garantir que `.env`, `node_modules`, `.claud.md` e `Agent.md` não sejam versionados.
6. Criar `.env.example` somente com nomes de variáveis e valores seguros para exemplo.
7. Definir scripts principais no `package.json`.
8. Fazer o primeiro commit de estrutura.

### Tarefas de Eberson Carneiro (@Mudoviskyy)
1. Revisar a estrutura criada.
2. Conferir se não existem arquivos sensíveis no repositório.
3. Verificar se a organização permite separar rotas, serviços e banco.
4. Criar a estrutura inicial de `src/` caso ainda não exista.
5. Fazer um commit próprio com sua parte da organização.

### Estrutura esperada
```text
smarthelp-banco-dados/
├── prisma/
├── src/
│   ├── lib/
│   ├── routes/
│   └── services/
├── docs/
├── docker-compose.yml
├── package.json
├── .env.example
├── .gitignore
├── README.md
├── IA_LOG.md
├── PLANO.md
└── requests.http
```

### Critério de conclusão
A dupla consegue clonar o repositório e entender onde cada parte do projeto será implementada.

### Exemplos de commits
- `chore: cria estrutura inicial do projeto`
- `chore: organiza pastas do backend`

---

## ETAPA 2 — Infraestrutura com Docker

### Responsável principal: Mamdouh Alsaudi
### Revisão: Eberson Carneiro (@Mudoviskyy)

### Tarefas de Mamdouh Alsaudi
1. Criar o `docker-compose.yml`.
2. Configurar o contêiner PostgreSQL.
3. Definir nome do banco, usuário e senha por variáveis de ambiente.
4. Configurar volume persistente para PostgreSQL.
5. Adicionar pgAdmin como ferramenta de visualização.
6. Configurar portas necessárias.
7. Adicionar dependências entre serviços quando necessário.
8. Adicionar healthcheck do PostgreSQL.
9. Subir os contêineres com Docker Compose.
10. Confirmar que PostgreSQL aceita conexões.
11. Confirmar que pgAdmin abre corretamente.
12. Derrubar e subir os serviços novamente para validar persistência.

### Tarefas de Eberson Carneiro (@Mudoviskyy)
1. Clonar ou atualizar o projeto em seu ambiente.
2. Executar o mesmo `docker compose up -d`.
3. Confirmar que a infraestrutura funciona fora do computador de Mamdouh Alsaudi.
4. Registrar qualquer ajuste necessário para portabilidade.
5. Validar se os nomes e portas usados estão claros.

### Critério de conclusão
O comando abaixo deve iniciar a infraestrutura sem configuração manual adicional além do `.env`:

```bash
docker compose up -d
```

### Testes obrigatórios
- PostgreSQL em estado saudável;
- pgAdmin acessível;
- volume persistente funcionando;
- reinicialização dos contêineres sem perda dos dados existentes.

### Exemplos de commits
- `feat: adiciona PostgreSQL e pgAdmin com Docker`
- `fix: adiciona healthcheck do PostgreSQL`

---

## ETAPA 3 — Modelagem do banco de dados

### Responsável principal: Mamdouh Alsaudi
### Revisão conjunta

### Entidades principais
- `Usuario`
- `Categoria`
- `Chamado`
- `Solucao`
- `Tag`
- relação entre `Chamado` e `Tag`

### Tarefas de Mamdouh Alsaudi
1. Definir os campos de cada entidade.
2. Definir chaves primárias.
3. Definir chaves estrangeiras.
4. Definir cardinalidades.
5. Evitar duplicação desnecessária de dados.
6. Garantir normalização coerente.
7. Definir campos obrigatórios e opcionais.
8. Definir timestamps de criação e atualização.
9. Definir status possíveis para chamados.
10. Implementar o modelo em `schema.prisma`.
11. Criar o DER em `docs/DER.md`.
12. Comparar DER e Prisma para garantir que ambos representam a mesma estrutura.

### Tarefas de Eberson Carneiro (@Mudoviskyy)
1. Revisar o modelo pensando no uso da API.
2. Confirmar se é possível criar um chamado com usuário e categoria.
3. Confirmar se um chamado pode ter várias tags.
4. Confirmar se uma solução pode ser relacionada ao chamado correto.
5. Verificar se os campos são suficientes para os endpoints planejados.
6. Sugerir ajustes antes da primeira migration.

### Regras que devem ser verificadas
- usuário pode possuir vários chamados;
- categoria pode possuir vários chamados;
- chamado pertence a um usuário;
- chamado pertence a uma categoria;
- chamado pode possuir várias tags;
- uma tag pode aparecer em vários chamados;
- solução deve estar associada ao chamado correspondente;
- exclusões não podem deixar relações inconsistentes.

### Critério de conclusão
O schema deve representar todo o MVP sem depender de alterações improvisadas durante a implementação das rotas.

### Exemplos de commits
- `feat: modela entidades do helpdesk no Prisma`
- `docs: adiciona DER do banco de dados`

---

## ETAPA 4 — Prisma e primeira migration

### Responsável principal: Mamdouh Alsaudi
### Apoio: Eberson Carneiro (@Mudoviskyy)

### Tarefas
1. Configurar `DATABASE_URL`.
2. Conectar Prisma ao PostgreSQL do Docker.
3. Validar o schema.
4. Gerar a primeira migration.
5. Aplicar a migration no banco vazio.
6. Verificar tabelas criadas pelo pgAdmin.
7. Conferir chaves estrangeiras.
8. Conferir constraints.
9. Gerar Prisma Client.
10. Criar o módulo de conexão em `src/lib/prisma.js`.
11. Testar uma operação simples de leitura.
12. Testar uma operação simples de inserção.

### Teste de reprodutibilidade
1. Remover o banco/volume de teste.
2. Criar novamente a infraestrutura.
3. Aplicar migrations do zero.
4. Confirmar que o resultado é idêntico.

### Critério de conclusão
O banco inteiro deve poder ser reconstruído usando o histórico de migrations.

### Exemplos de commits
- `feat: configura Prisma e cria migration inicial`
- `test: valida reconstrução do banco por migrations`

---

## ETAPA 5 — Base do backend Node.js

### Responsável principal: Eberson Carneiro (@Mudoviskyy)
### Revisão: Mamdouh Alsaudi

### Tarefas de Eberson Carneiro (@Mudoviskyy)
1. Criar o servidor Node.js.
2. Separar inicialização do servidor e configuração da aplicação.
3. Configurar parsing de JSON.
4. Criar rota simples de status/health.
5. Criar diretório de rotas.
6. Criar diretório de serviços.
7. Importar Prisma por um módulo central.
8. Definir padrão de respostas JSON.
9. Definir tratamento básico de erros.
10. Garantir encerramento adequado da conexão com Prisma.

### Tarefas de Mamdouh Alsaudi
1. Revisar uso do Prisma.
2. Verificar se conexões não são abertas repetidamente.
3. Confirmar se erros do banco são tratados de forma compreensível.
4. Conferir se o backend utiliza apenas a conexão configurada por variável de ambiente.

### Critério de conclusão
O servidor deve iniciar, responder à rota de status e conectar ao PostgreSQL sem erros.

### Exemplos de commits
- `feat: cria estrutura base da API Node.js`
- `feat: adiciona rota de healthcheck da aplicação`

---

## ETAPA 6 — API de chamados

### Responsável principal: Eberson Carneiro (@Mudoviskyy)
### Revisão funcional: Mamdouh Alsaudi

### Funcionalidades mínimas
1. Criar chamado.
2. Listar chamados.
3. Consultar chamado por ID.
4. Atualizar status.
5. Registrar solução.
6. Relacionar categoria.
7. Relacionar usuário.
8. Exibir tags quando existirem.

### Para cada endpoint
Eberson Carneiro (@Mudoviskyy) deverá:
1. definir método HTTP;
2. definir rota;
3. definir dados de entrada;
4. validar campos obrigatórios;
5. chamar a camada de serviço;
6. realizar operação no Prisma;
7. tratar registro não encontrado;
8. retornar status HTTP apropriado;
9. retornar resposta JSON clara;
10. adicionar exemplo em `requests.http`.

### Revisão de Mamdouh Alsaudi
1. Conferir se cada operação respeita relações do banco.
2. Verificar se não existem queries desnecessárias.
3. Conferir inclusões/joins realizados pelo Prisma.
4. Verificar integridade depois das operações.

### Critério de conclusão
Todas as operações principais de um chamado devem funcionar sem qualquer frontend.

### Exemplos de commits
- `feat: implementa criação de chamados`
- `feat: implementa consulta e atualização de chamados`
- `feat: adiciona registro de solução`

---

## ETAPA 7 — Seeder e massa de dados

### Responsável principal: Eberson Carneiro (@Mudoviskyy)
### Revisão de banco: Mamdouh Alsaudi

### Objetivo
Popular o banco com milhares de registros para que a busca e a estrutura possam ser demonstradas em volume maior que alguns exemplos manuais.

### Tarefas de Eberson Carneiro (@Mudoviskyy)
1. Criar `src/seed.js`.
2. Gerar usuários fictícios.
3. Gerar categorias fixas e coerentes.
4. Gerar tags reutilizáveis.
5. Gerar milhares de chamados.
6. Variar títulos e descrições.
7. Criar chamados com status diferentes.
8. Criar datas variadas.
9. Criar soluções para parte dos chamados.
10. Associar tags aos chamados.
11. Evitar dados completamente repetidos.
12. Exibir resumo ao final do seed.

### Tarefas de Mamdouh Alsaudi
1. Acompanhar tempo de inserção.
2. Verificar integridade das relações.
3. Conferir quantidade de registros no PostgreSQL.
4. Identificar possíveis gargalos.
5. Ajustar transações ou estratégia de inserção se necessário.

### Meta inicial
- aproximadamente 5.000 chamados;
- múltiplos usuários;
- várias categorias;
- várias tags;
- parte dos chamados com solução.

### Testes
- executar seed em banco vazio;
- confirmar quantidade final;
- abrir registros aleatórios;
- garantir que relações existem;
- executar novamente apenas se o script estiver preparado para isso ou reconstruir o banco antes do novo seed.

### Critério de conclusão
O banco deve possuir volume suficiente para uma demonstração real de recuperação de informações.

### Exemplos de commits
- `feat: cria seeder de 5000 chamados`
- `perf: melhora inserção da massa de dados`

---

## ETAPA 8 — Busca e recuperação de informações

### Responsável principal: Mamdouh Alsaudi
### Integração na API: Eberson Carneiro (@Mudoviskyy)

### Objetivo
Demonstrar que o sistema consegue recuperar chamados antigos de forma rápida usando texto pesquisado pelo usuário.

### Tarefas de Mamdouh Alsaudi
1. Definir quais campos participarão da busca.
2. Preparar Full-Text Search do PostgreSQL.
3. Criar os índices necessários.
4. Criar consulta de busca.
5. Testar termos presentes em títulos.
6. Testar termos presentes em descrições.
7. Testar consultas com vários termos.
8. Conferir plano de execução quando necessário.
9. Registrar observações de desempenho.
10. Garantir que a busca continua funcionando com milhares de registros.

### Tarefas de Eberson Carneiro (@Mudoviskyy)
1. Criar rota de busca.
2. Receber o termo pela API.
3. Rejeitar busca vazia quando necessário.
4. Encaminhar termo ao serviço de busca.
5. Retornar resultados em JSON.
6. Limitar quantidade de resultados.
7. Adicionar requisições de exemplo em `requests.http`.
8. Preparar exemplos para a demonstração.

### Exemplos de busca
- `senha esquecida`
- `erro de acesso`
- `problema no login`
- `sistema indisponível`

### Critério de conclusão
Uma consulta deve localizar rapidamente registros relevantes dentro da massa de dados criada pelo seeder.

### Exemplos de commits
- `feat: adiciona Full-Text Search para chamados`
- `feat: adiciona endpoint de busca textual`

---

## ETAPA 9 — Testes de integração

### Responsabilidade: ambos

### Testes de Mamdouh Alsaudi
1. Docker sobe sem falhas.
2. PostgreSQL fica saudável.
3. migrations funcionam em banco vazio.
4. constraints estão corretas.
5. índices existem.
6. consultas de busca funcionam.
7. dados permanecem após reinício dos contêineres.

### Testes de Eberson Carneiro (@Mudoviskyy)
1. servidor inicia corretamente;
2. healthcheck responde;
3. criação de chamado funciona;
4. listagem funciona;
5. consulta por ID funciona;
6. atualização funciona;
7. solução pode ser registrada;
8. busca retorna resultados;
9. erros comuns retornam respostas compreensíveis.

### Teste cruzado obrigatório
Mamdouh Alsaudi executa o projeto seguindo somente o README escrito/revisado por Eberson Carneiro (@Mudoviskyy).

Depois, Eberson Carneiro (@Mudoviskyy) executa o projeto em ambiente limpo seguindo somente as instruções aprovadas pela dupla.

### Critério de conclusão
Nenhum integrante deve precisar explicar oralmente uma etapa escondida para que o outro consiga iniciar o projeto.

---

## ETAPA 10 — Documentação técnica

### Divisão

#### Mamdouh Alsaudi
Responsável principalmente por:
- seção de Docker;
- PostgreSQL;
- Prisma;
- migrations;
- DER;
- Full-Text Search;
- arquitetura de persistência.

#### Eberson Carneiro (@Mudoviskyy)
Responsável principalmente por:
- instalação Node.js;
- comandos npm;
- execução da API;
- endpoints;
- seed;
- exemplos de requisição;
- roteiro de demonstração.

### README deve conter
1. nome do projeto;
2. objetivo resumido;
3. tecnologias;
4. pré-requisitos;
5. configuração do `.env`;
6. comando para subir Docker;
7. comando para instalar dependências;
8. comando para aplicar migration;
9. comando para executar seed;
10. comando para iniciar backend;
11. exemplos de busca;
12. estrutura resumida do projeto;
13. instruções para encerrar os serviços.

### Outros documentos
- `PLANO.md`: planejamento e divisão do trabalho;
- `PROCESSO.md`: registro resumido do processo utilizado;
- `docs/DER.md`: modelo relacional;
- `docs/ARQUITETURA.md`: organização técnica;
- `IA_LOG.md`: uso de IA e ajustes manuais;
- `requests.http`: exemplos de chamadas da API.

### Critério de conclusão
Uma pessoa que não participou do desenvolvimento deve conseguir entender e executar o projeto usando a documentação.

---

## ETAPA 11 — Registro do uso de IA

### Responsabilidade: ambos

### Processo a registrar
1. O arquivo de diretrizes foi enviado e discutido.
2. Os requisitos foram analisados.
3. Foi preparada uma proposta de arquitetura e um plano.
4. A dupla revisou a direção escolhida.
5. A implementação foi realizada por etapas.
6. Prompts relevantes foram registrados.
7. Alterações manuais feitas após sugestões da IA foram anotadas.

### Cada integrante deve registrar
- tarefa na qual utilizou IA;
- objetivo do prompt;
- resultado aproveitado;
- resultado alterado ou descartado;
- ajuste manual realizado.

### Regra importante
O `IA_LOG.md` deve ser um registro do processo real do projeto, não apenas uma lista genérica de ferramentas.

---

## ETAPA 12 — Organização dos commits e evidência de participação

### Responsabilidade: ambos

O histórico Git deve demonstrar contribuição real dos dois integrantes ao longo do projeto.

### Mamdouh Alsaudi — possíveis commits
- `chore: configura ambiente Docker`
- `feat: modela banco no Prisma`
- `feat: cria migration inicial`
- `feat: adiciona indices de busca`
- `feat: implementa Full-Text Search`
- `docs: documenta arquitetura do banco`

### Eberson Carneiro (@Mudoviskyy) — possíveis commits
- `feat: cria estrutura da API`
- `feat: adiciona rotas de chamados`
- `feat: implementa servico de chamados`
- `feat: cria seeder de 5000 registros`
- `test: adiciona requisicoes de demonstracao`
- `docs: documenta execucao da API`

### Regras
1. Não concentrar todo o projeto em um único commit.
2. Não realizar commits enormes sem descrição.
3. Cada commit deve representar uma mudança compreensível.
4. Não utilizar mensagens como `update`, `teste` ou `final` quando for possível informar a tarefa realizada.
5. Antes de integrar mudanças maiores, o outro integrante deve revisar.

---

## ETAPA 13 — Revisão final técnica

### Checklist de Mamdouh Alsaudi
- [ ] PostgreSQL inicia no Docker.
- [ ] pgAdmin inicia corretamente.
- [ ] volume está configurado.
- [ ] Prisma conecta ao banco.
- [ ] migrations funcionam do zero.
- [ ] schema está coerente.
- [ ] relações estão corretas.
- [ ] índices existem.
- [ ] busca funciona com milhares de registros.
- [ ] nenhuma senha real está versionada.

### Checklist de Eberson Carneiro (@Mudoviskyy)
- [ ] Node.js inicia a API.
- [ ] endpoints principais funcionam.
- [ ] validações mínimas funcionam.
- [ ] seeder popula o banco.
- [ ] `requests.http` possui exemplos úteis.
- [ ] erros comuns são tratados.
- [ ] README contém todos os comandos.
- [ ] demonstração pode ser executada sem frontend.

### Checklist conjunto
- [ ] `.gitignore` está correto.
- [ ] `.env` não foi enviado ao Git.
- [ ] `IA_LOG.md` foi revisado.
- [ ] `PROCESSO.md` está coerente com o trabalho realizado.
- [ ] DER corresponde ao schema atual.
- [ ] README corresponde aos comandos atuais.
- [ ] ambos possuem commits no repositório.
- [ ] projeto foi testado a partir de ambiente limpo.

---

## ETAPA 14 — Preparação da demonstração

### Responsabilidade: ambos

### Mamdouh Alsaudi demonstra
1. Docker Compose.
2. PostgreSQL e pgAdmin.
3. tabelas e relacionamentos.
4. Prisma schema/migration.
5. quantidade de dados.
6. índice e mecanismo de busca.

### Eberson Carneiro (@Mudoviskyy) demonstra
1. inicialização da API.
2. criação de chamado.
3. listagem de chamado.
4. consulta por ID.
5. registro/atualização de solução ou status.
6. busca por termo.
7. resultado retornado pela API.

### Demonstração integrada
1. subir os contêineres;
2. aplicar migration;
3. executar seed;
4. iniciar API;
5. realizar uma consulta normal;
6. realizar uma busca textual;
7. mostrar que o resultado vem do banco populado;
8. mostrar rapidamente o Git e a documentação.

---

# 4. Ordem recomendada de execução

A ordem abaixo reduz conflitos entre os integrantes e permite trabalho paralelo:

1. **Ambos:** leitura e análise das diretrizes.
2. **Ambos:** definição do escopo.
3. **Mamdouh Alsaudi:** Docker e PostgreSQL.
4. **Eberson Carneiro (@Mudoviskyy):** estrutura básica Node.js.
5. **Mamdouh Alsaudi:** Prisma e modelagem.
6. **Eberson Carneiro (@Mudoviskyy):** preparação das rotas e serviços sem depender de todas as queries finais.
7. **Ambos:** revisão do schema.
8. **Mamdouh Alsaudi:** migration e conexão final.
9. **Eberson Carneiro (@Mudoviskyy):** implementação completa dos endpoints.
10. **Eberson Carneiro (@Mudoviskyy):** seeder.
11. **Mamdouh Alsaudi:** índices e Full-Text Search.
12. **Eberson Carneiro (@Mudoviskyy):** endpoint de busca.
13. **Ambos:** integração.
14. **Ambos:** testes cruzados.
15. **Ambos:** documentação.
16. **Ambos:** IA_LOG e revisão do histórico Git.
17. **Ambos:** ensaio da demonstração.
18. **Ambos:** revisão e entrega.

---

# 5. Cronograma sugerido até a entrega

## Bloco 1 — Estrutura e infraestrutura
- análise do documento;
- divisão das tarefas;
- Git;
- Docker;
- PostgreSQL;
- estrutura Node.js.

## Bloco 2 — Banco de dados
- schema Prisma;
- DER;
- migration;
- relações;
- validação do banco.

## Bloco 3 — Backend
- serviços;
- rotas;
- CRUD necessário para o MVP;
- tratamento básico de erros.

## Bloco 4 — Massa de dados e busca
- seeder;
- milhares de chamados;
- índices;
- Full-Text Search;
- endpoint de busca.

## Bloco 5 — Integração e documentação
- testes entre ambientes;
- README;
- IA_LOG;
- PROCESSO;
- revisão dos commits;
- correções.

## Bloco 6 — Entrega
- teste final em ambiente limpo;
- demonstração completa;
- revisão do repositório;
- entrega até 10/11/2026.

---

# 6. Definição de pronto do projeto

O SmartHelp será considerado pronto somente quando:

1. o PostgreSQL subir pelo Docker Compose;
2. as migrations criarem o banco do zero;
3. o Prisma estiver conectado corretamente;
4. a API Node.js funcionar sem frontend;
5. for possível criar e consultar chamados;
6. o banco estiver populado com milhares de registros fictícios;
7. a busca textual recuperar registros existentes;
8. as relações do banco estiverem consistentes;
9. o README permitir reproduzir o ambiente;
10. o IA_LOG documentar o uso real de IA;
11. os dois integrantes possuírem commits identificáveis;
12. o projeto tiver sido testado em ambiente limpo;
13. a dupla conseguir demonstrar o fluxo completo sem correções de última hora.

---

# 7. Resumo da divisão final

| Área | Mamdouh Alsaudi | Eberson Carneiro (@Mudoviskyy) |
|---|---|---|
| Análise das diretrizes | Participa | Participa |
| Planejamento | Participa | Participa |
| Git / estrutura inicial | Principal | Revisão |
| Docker | Principal | Teste |
| PostgreSQL | Principal | Teste |
| Prisma | Principal | Revisão |
| DER e modelagem | Principal | Revisão |
| Backend Node.js | Revisão | Principal |
| Rotas/API | Revisão | Principal |
| Seeder | Revisão | Principal |
| Full-Text Search | Principal | Integração API |
| Testes | Banco/infra | API/fluxo |
| README | Parte técnica DB | Parte execução/API |
| IA_LOG | Participa | Participa |
| Git commits | Obrigatório | Obrigatório |
| Demonstração | Banco/busca | API/fluxo |
| Revisão final | Participa | Participa |

A divisão define responsáveis principais, mas não cria dois projetos separados. O resultado final deve funcionar como um único sistema integrado e os dois integrantes devem compreender o fluxo completo do SmartHelp.

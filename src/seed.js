import 'dotenv/config';
import { fakerPT_BR as faker } from '@faker-js/faker';
import prisma from './lib/prisma.js';

// Configuração do volume de dados (meta: 5.000 chamados conforme PLANO.md)
const TOTAL_CHAMADOS = Number(process.env.SEED_COUNT) || 5000;
const BATCH_SIZE = 500;

// Categorias padrão de Helpdesk corporativo
const CATEGORIAS_PADRAO = [
  { nome: 'Acesso e Contas', descricao: 'Problemas com credenciais, redefinição de senhas, autenticação e contas' },
  { nome: 'Redes e Conectividade', descricao: 'Instabilidades em conexões Wi-Fi, cabeamento de rede, DNS e VPN' },
  { nome: 'Hardware e Equipamentos', descricao: 'Defeitos em computadores, monitores, periféricos e peças físicas' },
  { nome: 'Impressoras e Periféricos', descricao: 'Atolamento de papel, troca de suprimentos, falhas de impressão e scanners' },
  { nome: 'Email e Comunicação', descricao: 'Configuração do Outlook, lentidão de sincronização e listas de distribuição' },
  { nome: 'Sistemas e ERP', descricao: 'Erros em portais corporativos, falhas de integração e travamentos de software' },
  { nome: 'Segurança da Informação', descricao: 'Bloqueio preventivo, alertas de antivírus, suspeitas de phishing e certificados' },
  { nome: 'Infraestrutura e Servidores', descricao: 'Ambientes de homologação, reinício agendado de máquinas e espaço em disco' }
];

// Tags corporativas reutilizáveis
const TAGS_PADRAO = [
  'senha', 'acesso', 'vpn', 'wifi', 'rede', 'impressora', 'hardware',
  'email', 'outlook', 'travamento', 'lentidao', 'permissao', 'bloqueio',
  'windows', 'linux', 'backup', 'urgente', 'antivirus', 'disco', 'login'
];

// Padrões de problemas comuns para enriquecer a recuperação em Full-Text Search
const TEMPLATES_CHAMADOS = [
  {
    titulo: 'Não consigo recuperar acesso e senha no portal corporativo',
    descricao: 'Após digitar a senha temporária, a mensagem de credenciais inválidas persiste. Usuário bloqueado.',
    tags: ['senha', 'acesso', 'login']
  },
  {
    titulo: 'Impressora de rede travando na bandeja principal',
    descricao: 'A impressora localizada no departamento financeiro emperra papel contínuo e não conclui o spool de impressão.',
    tags: ['impressora', 'hardware']
  },
  {
    titulo: 'Falha na conexão VPN durante trabalho remoto',
    descricao: 'Conexão VPN fecha subitamente após autenticar no cliente corporativo. Código de erro timeout de rede.',
    tags: ['vpn', 'rede', 'acesso']
  },
  {
    titulo: 'Lentidão severa ao abrir planilhas no sistema compartilhado',
    descricao: 'Arquivos na rede demoram mais de cinco minutos para abrir. Verificado alto consumo de disco e rede.',
    tags: ['lentidao', 'rede', 'disco']
  },
  {
    titulo: 'Tela azul no Windows após atualização do sistema',
    descricao: 'Computador reinicia constantemente com erro de despejo de memória (BSOD) na estação de trabalho.',
    tags: ['windows', 'travamento', 'hardware']
  },
  {
    titulo: 'Outlook não sincroniza novas mensagens da caixa postal',
    descricao: 'Cliente de correio informa erro de sincronização com o servidor Exchange. Mensagens pendentes na caixa de saída.',
    tags: ['email', 'outlook']
  },
  {
    titulo: 'Permissão negada ao tentar acessar pasta departamental',
    descricao: 'Colaborador recém-transferido precisa de acesso com permissão de leitura e escrita nos relatórios mensais.',
    tags: ['permissao', 'acesso', 'bloqueio']
  },
  {
    titulo: 'Alerta de malware bloqueado em dispositivo USB',
    descricao: 'Antivírus corporativo detectou arquivo suspeito ao plugar pendrive com apresentações de clientes.',
    tags: ['antivirus', 'seguranca', 'urgente']
  },
  {
    titulo: 'Monitor secundário não dá vídeo após suspensão',
    descricao: 'Cabo DisplayPort testado, porém a segunda tela continua sem sinal ao acordar o computador.',
    tags: ['hardware']
  },
  {
    titulo: 'Restauração de backup de banco de dados para testes',
    descricao: 'Equipe de sistemas solicita restauração do snapshot mais recente do banco de dados na máquina de homologação.',
    tags: ['backup', 'disco']
  }
];

const SOLUCOES_TEMPLATES = [
  'Senha resetada com sucesso e enviado link de confirmação para o email alternativo do colaborador.',
  'Limpeza mecânica dos roletes da impressora efetuada e fila de impressão purgada com êxito.',
  'Configuração de MTU do túnel VPN ajustada e certificado de segurança renovado.',
  'Limpeza de cache temporário efetuada e alocação de memória virtual otimizada na estação.',
  'Driver de vídeo restaurado para versão estável anterior, resolvendo o problema de travamento.',
  'Perfil local do Outlook reconstruído a partir do servidor e indexação de emails concluída.',
  'Permissões atribuídas no grupo de segurança correspondente via diretório de usuários.',
  'Arquivo em quarentena analisado, estação escaneada por completo e nenhuma ameaça ativa detectada.',
  'Firmware do monitor atualizado e cabo adaptador trocado por modelo homologado.',
  'Snapshot do banco restaurado e verificação de integridade concluída sem divergências.'
];

export async function runSeed() {
  console.log('=====================================================');
  console.log('🌱 SmartHelp — Inicialização da Massa de Dados (Seed)');
  console.log(`🎯 Meta de chamados a gerar: ${TOTAL_CHAMADOS.toLocaleString('pt-BR')}`);
  console.log('=====================================================\n');

  const inicio = performance.now();

  try {
    // 1. Criar Categorias
    console.log('📁 Criando categorias de atendimento...');
    const categorias = [];
    for (const cat of CATEGORIAS_PADRAO) {
      const registro = await prisma.categoria.upsert({
        where: { nome: cat.nome },
        update: { descricao: cat.descricao },
        create: cat
      });
      categorias.push(registro);
    }
    console.log(`   ✅ ${categorias.length} categorias configuradas.`);

    // 2. Criar Tags
    console.log('🏷️  Criando tags reutilizáveis...');
    const tags = [];
    for (const nome of TAGS_PADRAO) {
      const registro = await prisma.tag.upsert({
        where: { nome },
        update: {},
        create: { nome }
      });
      tags.push(registro);
    }
    console.log(`   ✅ ${tags.length} tags configuradas.`);

    // 3. Criar Usuários Fictícios (Analistas e Solicitantes)
    console.log('👥 Criando usuários de teste com Faker...');
    const totalUsuariosDesejados = 40;
    const usuarios = [];

    // Usuário técnico garantido para resolver chamados
    const adminTecnico = await prisma.usuario.upsert({
      where: { email: 'suporte.tecnico@smarthelp.local' },
      update: {},
      create: {
        nome: 'Suporte Técnico Central',
        email: 'suporte.tecnico@smarthelp.local',
        cargo: 'Especialista em Suporte N2'
      }
    });
    usuarios.push(adminTecnico);

    const cargosFaker = [
      'Analista de Suporte', 'Desenvolvedor Pleno', 'Assistente Administrativo',
      'Coordenador Financeiro', 'Designer Gráfico', 'Gerente de Projetos',
      'Analista de Recursos Humanos', 'Especialista de Infraestrutura'
    ];

    for (let i = 1; i <= totalUsuariosDesejados; i++) {
      const email = `usuario.seed${i}@smarthelp.local`;
      const nome = faker.person.fullName();
      const cargo = faker.helpers.arrayElement(cargosFaker);

      const u = await prisma.usuario.upsert({
        where: { email },
        update: { nome, cargo },
        create: { nome, email, cargo }
      });
      usuarios.push(u);
    }
    console.log(`   ✅ ${usuarios.length} usuários disponíveis.`);

    // 4. Gerar Chamados em Lotes
    console.log(`\n🎫 Gerando e inserindo ${TOTAL_CHAMADOS.toLocaleString('pt-BR')} chamados em lotes de ${BATCH_SIZE}...`);

    let totalChamadosInseridos = 0;
    let totalSolucoesInseridas = 0;
    let totalRelacoesTags = 0;

    const statuses = ['ABERTO', 'EM_ATENDIMENTO', 'RESOLVIDO'];
    const prioridades = ['BAIXA', 'MEDIA', 'ALTA'];

    for (let offset = 0; offset < TOTAL_CHAMADOS; offset += BATCH_SIZE) {
      const tamanhoLote = Math.min(BATCH_SIZE, TOTAL_CHAMADOS - offset);
      const loteChamados = [];

      for (let j = 0; j < tamanhoLote; j++) {
        const indexGlobal = offset + j;
        const template = TEMPLATES_CHAMADOS[indexGlobal % TEMPLATES_CHAMADOS.length];

        // Status distribuído realisticamente (~40% resolvido, ~35% atendimento, ~25% aberto)
        const statusRandom = Math.random();
        const status = statusRandom < 0.40 ? 'RESOLVIDO' : (statusRandom < 0.75 ? 'EM_ATENDIMENTO' : 'ABERTO');

        // Prioridade (~20% alta, ~50% média, ~30% baixa)
        const prioridadeRandom = Math.random();
        const prioridade = prioridadeRandom < 0.20 ? 'ALTA' : (prioridadeRandom < 0.70 ? 'MEDIA' : 'BAIXA');

        const autor = faker.helpers.arrayElement(usuarios);
        const categoria = faker.helpers.arrayElement(categorias);

        // Variação textual realista
        const sufixoFaker = faker.lorem.sentence({ min: 4, max: 10 });
        const complementoDetalhe = faker.company.buzzPhrase();

        const titulo = `${template.titulo} (${complementoDetalhe})`;
        const descricao = `${template.descricao} Contexto adicional: ${sufixoFaker} Estação ID: #${1000 + (indexGlobal % 300)}.`;

        // Data distribuída nos últimos 180 dias
        const diasAtras = Math.floor(Math.random() * 180);
        const criadoEm = new Date(Date.now() - diasAtras * 24 * 60 * 60 * 1000);

        loteChamados.push({
          titulo,
          descricao,
          status,
          prioridade,
          autorId: autor.id,
          categoriaId: categoria.id,
          criadoEm,
          atualizadoEm: criadoEm,
          // Metadados auxiliares para pós-processamento
          _templateTags: template.tags,
          _deveTerSolucao: status === 'RESOLVIDO'
        });
      }

      // Inserir os chamados e recuperar os registros gerados
      const chamadosCriados = await prisma.chamado.createManyAndReturn({
        data: loteChamados.map(({ _templateTags, _deveTerSolucao, ...dados }) => dados),
        select: { id: true, status: true }
      });

      totalChamadosInseridos += chamadosCriados.length;

      // Montar soluções para os chamados RESOLVIDO
      const solucoesLote = [];
      const relacoesTagLote = [];

      for (let k = 0; k < chamadosCriados.length; k++) {
        const criado = chamadosCriados[k];
        const configOriginal = loteChamados[k];

        if (criado.status === 'RESOLVIDO') {
          const responsavel = adminTecnico;
          const textoSolucao = faker.helpers.arrayElement(SOLUCOES_TEMPLATES);
          solucoesLote.push({
            chamadoId: criado.id,
            responsavelId: responsavel.id,
            texto: `${textoSolucao} Solução validada pelo usuário solicitante.`
          });
        }

        // Selecionar 1 a 3 tags
        const tagsDoChamado = tags.filter(t => configOriginal._templateTags.includes(t.nome));
        const tagsFinais = tagsDoChamado.length > 0
          ? tagsDoChamado
          : [faker.helpers.arrayElement(tags)];

        for (const tag of tagsFinais) {
          relacoesTagLote.push({ chamadoId: criado.id, tagId: tag.id });
        }
      }

      // Inserir soluções em lote
      if (solucoesLote.length > 0) {
        await prisma.solucao.createMany({ data: solucoesLote });
        totalSolucoesInseridas += solucoesLote.length;
      }

      // Inserir relacionamentos M:N de tags na tabela física `_ChamadoToTag`
      if (relacoesTagLote.length > 0) {
        const valoresSql = relacoesTagLote.map(r => `(${r.chamadoId}, ${r.tagId})`).join(',');
        await prisma.$executeRawUnsafe(`
          INSERT INTO "_ChamadoToTag" ("A", "B")
          VALUES ${valoresSql}
          ON CONFLICT DO NOTHING;
        `);
        totalRelacoesTags += relacoesTagLote.length;
      }

      const percentual = Math.round((totalChamadosInseridos / TOTAL_CHAMADOS) * 100);
      process.stdout.write(`   ⏳ Progresso: ${totalChamadosInseridos.toLocaleString('pt-BR')}/${TOTAL_CHAMADOS.toLocaleString('pt-BR')} chamados (${percentual}%)\r`);
    }

    const fim = performance.now();
    const duracaoSegundos = ((fim - inicio) / 1000).toFixed(2);

    console.log('\n\n=====================================================');
    console.log('🎉 Seed concluído com sucesso!');
    console.log(`⏱️  Tempo total de execução: ${duracaoSegundos}s`);
    console.log('📊 Resumo dos registros populados:');
    console.log(`   - Usuários cadastrados: ${usuarios.length}`);
    console.log(`   - Categorias:           ${categorias.length}`);
    console.log(`   - Tags únicas:          ${tags.length}`);
    console.log(`   - Chamados gerados:     ${totalChamadosInseridos.toLocaleString('pt-BR')}`);
    console.log(`   - Soluções associadas:  ${totalSolucoesInseridas.toLocaleString('pt-BR')}`);
    console.log(`   - Vínculos com tags:    ${totalRelacoesTags.toLocaleString('pt-BR')}`);
    console.log('=====================================================');
    console.log('💡 Dica: Você pode testar a recuperação textual executando:');
    console.log('   npm run demo -- "recuperar acesso senha"\n');

  } catch (error) {
    console.error('\n❌ Falha durante a execução do seed:');
    console.error(error.message);
    if (error.code === 'P1001' || error.message.includes('Can\'t reach database server')) {
      console.error('\n📌 O banco de dados PostgreSQL não está acessível.');
      console.error('   Certifique-se de iniciar a infraestrutura com:');
      console.error('   docker compose up -d');
      console.error('   E aplicar as migrações com:');
      console.error('   npm run db:migrate\n');
    }
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

// Execução direta via terminal: node src/seed.js
runSeed();

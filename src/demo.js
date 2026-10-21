import 'dotenv/config';
import { searchService } from './services/search.service.js';
import prisma from './lib/prisma.js';

async function main() {
  const args = process.argv.slice(2).filter(arg => !arg.startsWith('--'));
  const termo = args.join(' ').trim() || 'recuperar acesso senha';

  console.log('================================================================');
  console.log('🔍 SmartHelp — Demonstração de Recuperação de Informação (FTS)');
  console.log(`🔎 Termo pesquisado: "${termo}"`);
  console.log('================================================================\n');

  const inicio = performance.now();

  try {
    const resultados = await searchService.buscar(termo, 5);
    const fim = performance.now();
    const duracaoMs = (fim - inicio).toFixed(2);

    if (!resultados || resultados.length === 0) {
      console.log(`⚠️  Nenhum chamado encontrado para o termo: "${termo}".`);
      console.log('💡 Dica: Certifique-se de popular o banco executando: npm run db:seed\n');
      return;
    }

    console.log(`✨ Encontrados ${resultados.length} chamado(s) relevante(s) em ${duracaoMs} ms:\n`);

    resultados.forEach((chamado, idx) => {
      const rankFormatado = typeof chamado.rank === 'number' ? chamado.rank.toFixed(4) : chamado.rank;
      const dataCriacao = chamado.criadoEm ? new Date(chamado.criadoEm).toLocaleDateString('pt-BR') : 'N/A';

      console.log(`----------------------------------------------------------------`);
      console.log(`[#${idx + 1}] Chamado ID: #${chamado.id} | Relevância (Rank): ${rankFormatado}`);
      console.log(`📌 Título:     ${chamado.titulo}`);
      console.log(`📁 Categoria:  ${chamado.categoria || 'Geral'} | Autor: ${chamado.autor || 'Sistema'}`);
      console.log(`🏷️  Status:     ${chamado.status} | Prioridade: ${chamado.prioridade} | Data: ${dataCriacao}`);
      console.log(`📝 Descrição:  ${chamado.descricao}`);
    });

    console.log('----------------------------------------------------------------\n');
    console.log(`✅ Consulta executada via Full-Text Search nativo com índice GIN.`);

  } catch (error) {
    console.error('\n❌ Erro ao realizar a busca no banco de dados:');
    console.error(error.message);
    if (error.code === 'P1001' || error.message.includes('Can\'t reach database server')) {
      console.error('\n📌 O PostgreSQL não está acessível no momento.');
      console.error('   Suba os contêineres com: docker compose up -d');
      console.error('   Aplique as migrações com: npm run db:migrate\n');
    }
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main();

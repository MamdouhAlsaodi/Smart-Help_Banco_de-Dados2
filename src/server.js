import 'dotenv/config';
import app from './app.js';
import prisma from './lib/prisma.js';

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`🚀 SmartHelp API iniciada com sucesso em http://localhost:${PORT}`);
  console.log(`📋 Verificação de saúde disponível em http://localhost:${PORT}/health`);
});

// Encerramento gracioso do servidor e das conexões de banco
const encerrar = async (sinal) => {
  console.log(`\nSinal ${sinal} recebido. Finalizando servidor e conexões...`);

  server.close(async () => {
    try {
      await prisma.$disconnect();
      console.log('Conexões com banco de dados encerradas.');
    } catch (err) {
      console.error('Erro ao desconectar do banco:', err);
    } finally {
      process.exit(0);
    }
  });

  // Forçar encerramento após 5 segundos se não fechar
  setTimeout(() => {
    console.error('Tempo limite de encerramento excedido. Forçando saída.');
    process.exit(1);
  }, 5000);
};

process.on('SIGINT', () => encerrar('SIGINT'));
process.on('SIGTERM', () => encerrar('SIGTERM'));

export default server;

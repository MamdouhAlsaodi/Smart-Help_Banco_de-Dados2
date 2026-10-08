import express from 'express';
import { chamadosRouter } from './routes/chamados.routes.js';
import { searchRouter } from './routes/search.routes.js';
import prisma from './lib/prisma.js';

export const app = express();

// Middlewares essenciais
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rota raiz informativa
app.get('/', (req, res) => {
  res.json({
    projeto: 'SmartHelp — Banco de Dados II',
    status: 'online',
    versao: '1.0.0',
    documentacao: '/requests.http',
    endpoints: [
      'GET /health',
      'GET /api/chamados',
      'GET /api/chamados/:id',
      'POST /api/chamados',
      'PATCH /api/chamados/:id/resolver',
      'GET /api/busca?q=...&limite=5',
      'GET /api/categorias',
      'GET /api/usuarios'
    ]
  });
});

// Rota de Healthcheck da aplicação
app.get('/health', async (req, res) => {
  let dbStatus = 'pendente';
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = 'conectado';
  } catch {
    dbStatus = 'desconectado';
  }

  res.status(dbStatus === 'conectado' ? 200 : 200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    banco: dbStatus
  });
});

// Rotas da API
app.use('/api/chamados', chamadosRouter);
app.use('/api/busca', searchRouter);

// Rotas auxiliares para categorias e usuários
app.get('/api/categorias', async (req, res, next) => {
  try {
    if (prisma.categoria) {
      const categorias = await prisma.categoria.findMany({
        orderBy: { nome: 'asc' },
        include: { _count: { select: { chamados: true } } }
      });
      return res.json(categorias);
    }
    res.json([]);
  } catch (error) {
    next(error);
  }
});

app.get('/api/usuarios', async (req, res, next) => {
  try {
    if (prisma.usuario) {
      const usuarios = await prisma.usuario.findMany({
        orderBy: { nome: 'asc' },
        select: { id: true, nome: true, email: true, cargo: true }
      });
      return res.json(usuarios);
    }
    res.json([]);
  } catch (error) {
    next(error);
  }
});

// Middleware 404 para rotas inexistentes
app.use((req, res) => {
  res.status(404).json({
    erro: 'Rota não encontrada',
    caminho: req.originalUrl,
    metodo: req.method
  });
});

// Middleware centralizado de tratamento de erros
app.use((err, req, res, _next) => {
  console.error('[Erro na requisição]:', err);

  const status = err.status || 500;
  const resposta = {
    erro: err.message || 'Erro interno no servidor'
  };

  if (process.env.NODE_ENV === 'development' && err.stack) {
    resposta.stack = err.stack;
  }

  res.status(status).json(resposta);
});

export default app;

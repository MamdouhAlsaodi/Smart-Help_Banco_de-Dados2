import { Router } from 'express';
import { chamadosService } from '../services/chamados.service.js';

export const chamadosRouter = Router();

// Listar chamados com filtros e paginação opcionais
chamadosRouter.get('/', async (req, res, next) => {
  try {
    const chamados = await chamadosService.listar(req.query);
    res.json(chamados);
  } catch (error) {
    next(error);
  }
});

// Buscar chamado específico por ID
chamadosRouter.get('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const chamado = await chamadosService.buscarPorId(id);
    if (!chamado) {
      return res.status(404).json({ error: 'Chamado não encontrado' });
    }
    res.json(chamado);
  } catch (error) {
    next(error);
  }
});

// Criar novo chamado
chamadosRouter.post('/', async (req, res, next) => {
  try {
    const novoChamado = await chamadosService.criar(req.body);
    res.status(201).json(novoChamado);
  } catch (error) {
    next(error);
  }
});

// Resolver chamado
chamadosRouter.patch('/:id/resolver', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const chamadoResolvido = await chamadosService.resolver(id, req.body);
    res.json(chamadoResolvido);
  } catch (error) {
    next(error);
  }
});

export default chamadosRouter;

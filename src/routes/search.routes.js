import { Router } from 'express';
import { searchService } from '../services/search.service.js';

export const searchRouter = Router();

searchRouter.get('/', async (req, res, next) => {
  try {
    const { q, limite = 10 } = req.query;

    if (!q || typeof q !== 'string' || q.trim() === '') {
      return res.status(400).json({ error: 'Parâmetro de busca "q" é obrigatório.' });
    }

    const resultados = await searchService.buscar(q.trim(), Number(limite));
    res.json(resultados);
  } catch (error) {
    next(error);
  }
});

export default searchRouter;

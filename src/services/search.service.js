import prisma from '../lib/prisma.js';

export const searchService = {
  async buscar(termo, limite = 10) {
    const take = Math.min(Number(limite) || 10, 50);

    // Busca Full-Text no PostgreSQL; erros de banco nunca equivalem a zero resultados.
    const resultados = await prisma.$queryRaw`
        SELECT
          c.id,
          c.titulo,
          c.descricao,
          c.prioridade,
          c.status,
          c."criadoEm",
          cat.nome AS categoria,
          u.nome AS autor,
          ts_rank(
            setweight(to_tsvector('portuguese', coalesce(c.titulo, '')), 'A') ||
            setweight(to_tsvector('portuguese', coalesce(c.descricao, '')), 'B'),
            plainto_tsquery('portuguese', ${termo})
          ) AS rank
        FROM "Chamado" c
        LEFT JOIN "Categoria" cat ON c."categoriaId" = cat.id
        LEFT JOIN "Usuario" u ON c."autorId" = u.id
        WHERE
          to_tsvector('portuguese', coalesce(c.titulo, '') || ' ' || coalesce(c.descricao, '')) @@ plainto_tsquery('portuguese', ${termo})
        ORDER BY rank DESC, c."criadoEm" DESC
        LIMIT ${take};
      `;
    return resultados;
  }
};

export default searchService;

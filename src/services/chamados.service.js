import prisma from '../lib/prisma.js';

export const chamadosService = {
  async listar(filtros = {}) {
    const { status, prioridade, categoriaId, limite = 20, pagina = 1 } = filtros;
    const take = Math.min(Number(limite) || 20, 100);
    const skip = ((Number(pagina) || 1) - 1) * take;

    const where = {};
    if (status) where.status = status;
    if (prioridade) where.prioridade = prioridade;
    if (categoriaId) where.categoriaId = Number(categoriaId);

    return prisma.chamado.findMany({
      where,
      take,
      skip,
      orderBy: { criadoEm: 'desc' },
      include: {
        autor: { select: { id: true, nome: true, email: true } },
        categoria: true,
        tags: true,
        solucao: true
      }
    });
  },

  async buscarPorId(id) {
    return prisma.chamado.findUnique({
      where: { id },
      include: {
        autor: { select: { id: true, nome: true, email: true } },
        categoria: true,
        tags: true,
        solucao: true
      }
    });
  },

  async criar(dados) {
    const { titulo, descricao, prioridade = 'MEDIA', autorId, categoriaId, tags = [] } = dados;

    if (!titulo || !descricao || !autorId || !categoriaId) {
      const error = new Error('Campos obrigatórios: titulo, descricao, autorId, categoriaId');
      error.status = 400;
      throw error;
    }

    return prisma.chamado.create({
      data: {
        titulo,
        descricao,
        prioridade,
        autorId: Number(autorId),
        categoriaId: Number(categoriaId),
        tags: {
          connectOrCreate: tags.map(tagNome => ({
            where: { nome: tagNome },
            create: { nome: tagNome }
          }))
        }
      },
      include: {
        autor: true,
        categoria: true,
        tags: true
      }
    });
  },

  async resolver(id, dados) {
    const { texto, responsavelId } = dados;

    if (!texto || !responsavelId) {
      const error = new Error('Campos obrigatórios: texto, responsavelId');
      error.status = 400;
      throw error;
    }

    return prisma.$transaction(async (tx) => {
      const solucao = await tx.solucao.create({
        data: {
          texto,
          chamadoId: id,
          responsavelId: Number(responsavelId)
        }
      });

      const chamado = await tx.chamado.update({
        where: { id },
        data: {
          status: 'RESOLVIDO'
        },
        include: {
          solucao: true,
          autor: true,
          categoria: true,
          tags: true
        }
      });

      return chamado;
    });
  }
};

export default chamadosService;

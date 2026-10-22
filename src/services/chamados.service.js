import prisma from '../lib/prisma.js';

export const chamadosService = {
  async listar(filtros = {}) {
    const {
      status, prioridade, categoriaId, autorId, tag,
      limite = 20, pagina = 1, ordenarPor = 'criadoEm', ordem = 'desc'
    } = filtros;
    const take = Math.min(Number(limite) || 20, 100);
    const skip = ((Number(pagina) || 1) - 1) * take;

    const CAMPOS_ORDENACAO = ['criadoEm', 'atualizadoEm', 'titulo', 'prioridade', 'status'];
    const campo = CAMPOS_ORDENACAO.includes(ordenarPor) ? ordenarPor : 'criadoEm';
    const direcao = ordem === 'asc' ? 'asc' : 'desc';

    const where = {};
    if (status) where.status = status;
    if (prioridade) where.prioridade = prioridade;
    if (categoriaId) where.categoriaId = Number(categoriaId);
    if (autorId) where.autorId = Number(autorId);
    if (tag) where.tags = { some: { nome: tag } };

    return prisma.chamado.findMany({
      where,
      take,
      skip,
      orderBy: { [campo]: direcao },
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

  async atualizar(id, dados) {
    const permitidos = {};
    if (dados.titulo !== undefined) permitidos.titulo = String(dados.titulo);
    if (dados.descricao !== undefined) permitidos.descricao = String(dados.descricao);
    if (dados.prioridade !== undefined) permitidos.prioridade = dados.prioridade;
    if (dados.categoriaId !== undefined) permitidos.categoriaId = Number(dados.categoriaId);
    if (dados.status !== undefined) {
      permitidos.status = dados.status;
    }

    if (Object.keys(permitidos).length === 0) {
      const error = new Error('Nenhum campo válido para atualizar (titulo, descricao, prioridade, categoriaId, status)');
      error.status = 400;
      throw error;
    }

    if (permitidos.status && !['ABERTO', 'EM_ATENDIMENTO', 'RESOLVIDO', 'FECHADO'].includes(permitidos.status)) {
      const error = new Error('Status inválido (ABERTO, EM_ATENDIMENTO, RESOLVIDO, FECHADO)');
      error.status = 400;
      throw error;
    }

    const existente = await prisma.chamado.findUnique({
      where: { id },
      include: { solucao: true }
    });
    if (!existente) {
      const error = new Error('Chamado não encontrado');
      error.status = 404;
      throw error;
    }
    if (existente.solucao && permitidos.status && permitidos.status !== 'FECHADO') {
      const error = new Error('Chamado resolvido só pode ser fechado; não é reaberto nem editado para outro status');
      error.status = 409;
      throw error;
    }

    return prisma.chamado.update({
      where: { id },
      data: permitidos,
      include: {
        autor: { select: { id: true, nome: true, email: true } },
        categoria: true,
        tags: true,
        solucao: true
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

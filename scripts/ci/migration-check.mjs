import assert from 'node:assert/strict';
import { PrismaClient } from '@prisma/client';

const target = new URL(process.env.DATABASE_URL || 'postgresql://invalid/');
if (process.env.GITHUB_ACTIONS !== 'true'
  || target.hostname !== '127.0.0.1' || target.port !== '5432'
  || target.username !== 'smarthelp_ci' || target.pathname !== '/smarthelp_ci'
  || target.searchParams.get('schema') !== 'public') {
  throw new Error('Refusing to run the write probe outside its synthetic CI database');
}

const prisma = new PrismaClient();
try {
  if (process.argv[2] === 'persisted') {
    const usuario = await prisma.usuario.findUnique({ where: { email: 'ci@smarthelp.dev' } });
    assert.equal(usuario?.cargo, 'Analista');
    const chamado = await prisma.chamado.findFirst({
      where: { autorId: usuario.id },
      include: { categoria: true, tags: true }
    });
    assert.equal(chamado?.titulo, 'Chamado sintético de CI');
    assert.equal(chamado.categoria.nome, 'Teste CI');
    assert.equal(chamado.tags.length, 1);
  } else if (process.argv[2] === 'create') {
    const usuario = await prisma.usuario.create({
      data: { nome: 'Usuário sintético', email: 'ci@smarthelp.dev', cargo: 'Analista' }
    });
    const categoria = await prisma.categoria.create({ data: { nome: 'Teste CI' } });
    const tag = await prisma.tag.create({ data: { nome: 'sintetico' } });
    const chamado = await prisma.chamado.create({
      data: {
        titulo: 'Chamado sintético de CI', descricao: 'Verificação de migration e volume',
        autorId: usuario.id, categoriaId: categoria.id,
        tags: { connect: { id: tag.id } }
      },
      include: { autor: true, categoria: true, tags: true }
    });
    assert.equal(chamado.status, 'ABERTO');
    assert.equal(chamado.prioridade, 'MEDIA');
    assert.equal(chamado.tags[0].id, tag.id);
    assert.equal(chamado.autor.cargo, 'Analista');
    await assert.rejects(
      prisma.usuario.delete({ where: { id: usuario.id } }),
      (error) => error.code === 'P2003'
    );
    const resolvido = await prisma.chamado.create({
      data: {
        titulo: 'Descartável CI', descricao: 'Verificação de cascade',
        autorId: usuario.id, categoriaId: categoria.id
      }
    });
    const solucao = await prisma.solucao.create({
      data: { texto: 'Resolvido no teste', chamadoId: resolvido.id, responsavelId: usuario.id }
    });
    await assert.rejects(
      prisma.solucao.create({
        data: { texto: 'Solução duplicada', chamadoId: resolvido.id, responsavelId: usuario.id }
      }),
      (error) => error.code === 'P2002'
    );
    await prisma.chamado.delete({ where: { id: resolvido.id } });
    assert.equal(await prisma.solucao.findUnique({ where: { id: solucao.id } }), null);
    assert.ok(await prisma.tag.findUnique({ where: { id: tag.id } }));
  } else {
    throw new Error('Expected create or persisted mode');
  }
} finally {
  await prisma.$disconnect();
}

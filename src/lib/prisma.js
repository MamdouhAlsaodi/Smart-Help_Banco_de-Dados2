let prismaInstance;

try {
  const { PrismaClient } = await import('@prisma/client');
  if (typeof PrismaClient !== 'function') {
    throw new Error('PrismaClient não gerado');
  }
  prismaInstance = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error']
  });
} catch {
  console.warn('PrismaClient indisponível. Execute "npx prisma generate" após configurar o schema.');
  // Mantém a API inicializável, mas nunca inventa resultados sem banco.
  prismaInstance = new Proxy({}, {
    get: (_target, prop) => {
      if (prop === '$disconnect') return async () => {};
      const error = new Error('Banco de dados indisponível');
      error.status = 503;
      throw error;
    }
  });
}

export const prisma = prismaInstance;
export default prisma;

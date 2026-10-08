import { PrismaClient } from '@prisma/client';

let prismaInstance = null;

try {
  prismaInstance = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error']
  });
} catch (error) {
  console.warn('⚠️ PrismaClient ainda não gerado. Execute "npx prisma generate" após configurar o schema.');
  prismaInstance = new Proxy({}, {
    get: (_target, prop) => {
      if (prop === '$queryRaw') return async () => { throw new Error('PrismaClient pendente de geração'); };
      if (prop === '$disconnect') return async () => {};
      return undefined;
    }
  });
}

export const prisma = prismaInstance;
export default prisma;

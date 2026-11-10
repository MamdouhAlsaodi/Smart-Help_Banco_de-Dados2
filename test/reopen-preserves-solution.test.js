import test from 'node:test';
import assert from 'node:assert/strict';
import prisma from '../src/lib/prisma.js';
import { chamadosService } from '../src/services/chamados.service.js';

test('reopening a solved ticket preserves its registered solution',async()=>{
 const originalFind=prisma.chamado.findUnique, originalUpdate=prisma.chamado.update;
 let payload;
 try {
  prisma.chamado.findUnique=async()=>({id:123,solucao:{id:9,texto:'Solução anterior'}});
  prisma.chamado.update=async params=>{payload=params;return {id:123,status:params.data.status,solucao:{id:9,texto:'Solução anterior'}}};
  const result=await chamadosService.atualizar(123,{status:'ABERTO'});
  assert.equal(result.status,'ABERTO');assert.equal(result.solucao.texto,'Solução anterior');
  assert.deepEqual(payload.data,{status:'ABERTO'});
 } finally {prisma.chamado.findUnique=originalFind;prisma.chamado.update=originalUpdate;}
});

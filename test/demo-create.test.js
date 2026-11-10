import test from 'node:test';
import assert from 'node:assert/strict';
import { createDemoTicket } from '../public/demo-create.mjs';

test('creates a real example with available author and category through the ticket API', async () => {
  const calls=[];
  const fetcher=async (url, options={}) => {
    calls.push({url,options});
    if(url==='/api/usuarios') return {ok:true,json:async()=>[{id:7}]};
    if(url==='/api/categorias') return {ok:true,json:async()=>[{id:9}]};
    return {ok:true,status:201,json:async()=>({id:101,status:'ABERTO'})};
  };
  const ticket=await createDemoTicket(fetcher);
  const post=calls.find(c=>c.url==='/api/chamados');
  assert.equal(post.options.method,'POST');
  assert.deepEqual(JSON.parse(post.options.body),{titulo:'Teste de integração — impressora de rede',descricao:'Demonstração acadêmica: falha simulada de impressão enviada por um sistema externo.',prioridade:'MEDIA',autorId:7,categoriaId:9});
  assert.equal(ticket.id,101);
});

test('does not create a ticket if required references are missing', async () => {
  let posts=0;
  const fetcher=async (_url,options={}) => { if(options.method==='POST') posts++; return {ok:true,json:async()=>[]}; };
  await assert.rejects(createDemoTicket(fetcher), /usuário e categoria/i);
  assert.equal(posts,0);
});

test('reports API failure rather than success', async () => {
  const fetcher=async (url) => url==='/api/chamados' ? {ok:false,status:500,json:async()=>({})} : {ok:true,json:async()=>[{id:1}]};
  await assert.rejects(createDemoTicket(fetcher), /500/);
});

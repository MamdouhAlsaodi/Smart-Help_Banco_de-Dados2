import test from 'node:test';
import assert from 'node:assert/strict';
import { changeStatus, changePriority, resolveTicket } from '../public/ticket-actions.mjs';

test('ticket state and priority actions send the correct API updates', async () => {
  const calls=[]; const fetcher=async (url,opts) => {calls.push({url,opts}); return {ok:true,json:async()=>({id:5})};};
  await changeStatus(5,'ABERTO',fetcher);
  await changePriority(5,'ALTA',fetcher);
  assert.deepEqual(calls.map(c=>[c.url,c.opts.method,JSON.parse(c.opts.body)]),[['/api/chamados/5','PUT',{status:'ABERTO'}],['/api/chamados/5','PUT',{prioridade:'ALTA'}]]);
});
test('completion sends a solution and responsible user', async()=>{
  let call; const fetcher=async(url,opts)=>{call={url,opts};return {ok:true,json:async()=>({id:7})}};
  await resolveTicket(7,'Impressora reiniciada',4,fetcher);
  assert.deepEqual([call.url,call.opts.method,JSON.parse(call.opts.body)],['/api/chamados/7/resolver','PATCH',{texto:'Impressora reiniciada',responsavelId:4}]);
});
test('API failure is not reported as a success',async()=>{
  await assert.rejects(changeStatus(3,'FECHADO',async()=>({ok:false,status:409,json:async()=>({erro:'Conflito'})})),/Conflito/);
});

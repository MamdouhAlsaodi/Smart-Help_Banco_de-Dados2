import test from 'node:test';
import assert from 'node:assert/strict';
import { summarizeTickets } from '../src/services/analytics.service.js';

test('statistics aggregate every row and preserve zero-valued categories', () => {
 const rows=[{status:'ABERTO',prioridade:'ALTA',criadoEm:new Date('2026-11-08T12:00:00Z')},{status:'FECHADO',prioridade:'MEDIA',criadoEm:new Date('2026-11-09T12:00:00Z')}];
 const s=summarizeTickets(rows, new Date('2026-11-09T18:00:00Z'), 3);
 assert.equal(s.total,2); assert.equal(s.status.ABERTO,1); assert.equal(s.status.EM_ATENDIMENTO,0); assert.equal(s.prioridades.ALTA,1); assert.deepEqual(s.serie.map(x=>x.total),[0,1,1]);
});

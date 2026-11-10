export function summarizeTickets(rows, now = new Date(), days = 14) {
  const status = { ABERTO: 0, EM_ATENDIMENTO: 0, RESOLVIDO: 0, FECHADO: 0 };
  const prioridades = { BAIXA: 0, MEDIA: 0, ALTA: 0 };
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const serie = Array.from({ length: days }, (_, i) => ({ data: new Date(today - (days - 1 - i) * 86400000).toISOString().slice(0, 10), total: 0 }));
  const byDay = new Map(serie.map(d => [d.data, d]));
  for (const row of rows) {
    if (Object.hasOwn(status, row.status)) status[row.status]++;
    if (Object.hasOwn(prioridades, row.prioridade)) prioridades[row.prioridade]++;
    const date = new Date(row.criadoEm);
    if (!Number.isNaN(date.valueOf())) { const bucket = byDay.get(date.toISOString().slice(0, 10)); if (bucket) bucket.total++; }
  }
  return { total: rows.length, status, prioridades, serie };
}

async function send(id, suffix, method, data, fetcher) {
  const response = await fetcher(`/api/chamados/${encodeURIComponent(id)}${suffix}`, {method,headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
  const result = await response.json();
  if (!response.ok) throw new Error(result.erro || result.error || `Erro ${response.status}`);
  return result;
}
export function changeStatus(id, status, fetcher = fetch) { return send(id,'','PUT',{status},fetcher); }
export function changePriority(id, prioridade, fetcher = fetch) { return send(id,'','PUT',{prioridade},fetcher); }
export function resolveTicket(id, texto, responsavelId, fetcher = fetch) { return send(id,'/resolver','PATCH',{texto,responsavelId},fetcher); }

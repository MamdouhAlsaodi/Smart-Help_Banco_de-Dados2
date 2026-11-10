const $ = id => document.getElementById(id);
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const number = n => Number(n || 0).toLocaleString('pt-BR');
const date = d => new Date(d).toLocaleDateString('pt-BR', { timeZone:'UTC' });
const labels = { ABERTO:'Aberto',EM_ATENDIMENTO:'Em atendimento',RESOLVIDO:'Resolvido',FECHADO:'Fechado',BAIXA:'Baixa',MEDIA:'Média',ALTA:'Alta' };
const colors = { ABERTO:'#f1b75e',EM_ATENDIMENTO:'#8c7bea',RESOLVIDO:'#47c2a0',FECHADO:'#5a7fe7',BAIXA:'#51bb9a',MEDIA:'#8096e8',ALTA:'#ea9871' };
let page = 1, lastCount = 0;
async function request(url) { const r=await fetch(url); if(!r.ok) throw new Error(`Não foi possível carregar os dados (${r.status}).`); return r.json(); }
function showError(error) { $('error').textContent=error.message || 'Não foi possível carregar os dados.'; $('error').hidden=false; }
function bar(name,value,max,color) { return `<div class="bar-row"><div><span>${esc(name)}</span><strong>${number(value)}</strong></div><div class="track"><span style="width:${max ? Math.max(0,value/max*100) : 0}%;background:${color}"></span></div></div>`; }
function renderStats(s) {
 $('metric-total').textContent=number(s.total); $('metric-open').textContent=number(s.status.ABERTO); $('metric-progress').textContent=number(s.status.EM_ATENDIMENTO); $('metric-resolved').textContent=number(s.status.RESOLVIDO+s.status.FECHADO); $('donut-total').textContent=number(s.total);
 const keys=['ABERTO','EM_ATENDIMENTO','RESOLVIDO','FECHADO']; let offset=0;
 const segments=keys.map(key=>{let start=offset;offset+=s.total?s.status[key]/s.total*100:0;return `${colors[key]} ${start}% ${offset}%`});
 $('donut').style.background=s.total?`conic-gradient(${segments.join(',')})`:'#edf1f7';
 $('status-legend').innerHTML=keys.map(key=>`<div class="legend-row"><i style="background:${colors[key]}"></i>${labels[key]} <strong>${number(s.status[key])}</strong></div>`).join('');
 let max=Math.max(1,...Object.values(s.prioridades));
 $('priority-bars').innerHTML=['ALTA','MEDIA','BAIXA'].map(key=>bar(labels[key],s.prioridades[key],max,colors[key])).join('');
 const values=s.serie.map(d=>d.total), peak=Math.max(1,...values), width=700,height=160, last=Math.max(1,values.length-1);
 const points=values.map((value,i)=>`${i/last*width},${height-(value/peak)*(height-14)-5}`).join(' ');
 $('timeline').innerHTML=`<svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" role="img" aria-label="Chamados criados nos últimos 14 dias: ${values.join(', ')}"><defs><linearGradient id="area" x1="0" x2="0" y1="0" y2="1"><stop stop-color="#668cf1" stop-opacity=".24"/><stop offset="1" stop-color="#668cf1" stop-opacity="0"/></linearGradient></defs><polygon points="0,${height} ${points} ${width},${height}" fill="url(#area)"/><polyline points="${points}" fill="none" stroke="#4f79e7" stroke-width="3" vector-effect="non-scaling-stroke"/></svg>`;
 $('timeline-labels').innerHTML=`<span>${esc(s.serie[0]?.data || '')}</span><span>Máximo diário: ${number(peak === 1 && !values.some(Boolean) ? 0 : peak)}</span><span>${esc(s.serie.at(-1)?.data || '')}</span>`;
}
function renderCategories(rows) { const ranked=[...rows].sort((a,b)=>b._count.chamados-a._count.chamados);const max=Math.max(1,...ranked.map(x=>x._count.chamados));$('category-bars').innerHTML=ranked.map(x=>bar(x.nome,x._count.chamados,max,'#6689eb')).join('')||'<p>Nenhuma categoria cadastrada.</p>'; }
function statusClass(status){ return status==='ABERTO'?'open':['RESOLVIDO','FECHADO'].includes(status)?'done':''; }
async function tickets() {
 const params=new URLSearchParams({pagina:String(page),limite:'10',ordenarPor:'criadoEm',ordem:'desc'});if($('filter-status').value)params.set('status',$('filter-status').value);
 const rows=await request('/api/chamados?'+params);lastCount=rows.length;
 $('ticket-list').innerHTML=rows.map(t=>`<tr><td><span class="ticket-id">#${number(t.id)}</span><strong>${esc(t.titulo)}</strong></td><td><span class="badge ${statusClass(t.status)}">${esc(labels[t.status]||t.status)}</span></td><td>${esc(labels[t.prioridade]||t.prioridade)}</td><td>${esc(date(t.criadoEm))}</td><td><button class="button-secondary" data-ticket="${Number(t.id)}">Ver detalhes ↗</button></td></tr>`).join('')||'<tr><td colspan="5">Nenhum chamado encontrado.</td></tr>';
 $('list-caption').textContent=`${number(rows.length)} chamados nesta página`; $('page-number').textContent=`Página ${page}`;$('previous').disabled=page===1;$('next').disabled=lastCount<10;
}
async function detail(id) { try {const t=await request('/api/chamados/'+encodeURIComponent(id));$('ticket-detail').innerHTML=`<span class="ticket-id">CHAMADO #${number(t.id)}</span><h3>${esc(t.titulo)}</h3><p><span class="badge ${statusClass(t.status)}">${esc(labels[t.status]||t.status)}</span> &nbsp; Prioridade: ${esc(labels[t.prioridade]||t.prioridade)}</p><p class="detail-description">${esc(t.descricao)}</p><p><strong>Categoria:</strong> ${esc(t.categoria?.nome||'—')}</p><p><strong>Solicitante:</strong> ${esc(t.autor?.nome||'—')}</p>${t.solucao?`<p><strong>Solução:</strong> ${esc(t.solucao.texto)}</p>`:''}`;$('ticket-dialog').showModal();}catch(e){showError(e);} }
async function refresh(){try{$('error').hidden=true;const [s,c]=await Promise.all([request('/api/estatisticas'),request('/api/categorias')]);renderStats(s);renderCategories(c);await tickets();$('connection').textContent='Banco conectado';}catch(e){$('connection').textContent='Indisponível';$('connection-dot').style.background='#d46262';showError(e);}}
$('filter-status').addEventListener('change',()=>{page=1;tickets().catch(showError)});$('previous').onclick=()=>{if(page>1){page--;tickets().catch(showError)}};$('next').onclick=()=>{if(lastCount===10){page++;tickets().catch(showError)}};$('refresh').onclick=refresh;
document.addEventListener('click',e=>{const button=e.target.closest('[data-ticket]');if(button)detail(button.dataset.ticket);});$('close-dialog').onclick=()=>$('ticket-dialog').close();
$('search-form').addEventListener('submit',async e=>{e.preventDefault();let q=$('query').value.trim();if(!q)return;$('search-results').textContent='Pesquisando...';try{const results=await request('/api/busca?'+new URLSearchParams({q,limite:'5'}));$('search-results').innerHTML=results.length?results.map(t=>`<button type="button" data-ticket="${Number(t.id)}">#${number(t.id)} · ${esc(t.titulo)} ↗</button>`).join(''):'Nenhum resultado encontrado.';}catch(error){$('search-results').textContent=error.message;}});
refresh();

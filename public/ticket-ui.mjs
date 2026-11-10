import { changeStatus, changePriority, resolveTicket } from './ticket-actions.mjs';

const dialog = document.getElementById('ticket-dialog');
const container = document.getElementById('ticket-detail');
document.addEventListener('smarthelp:ticket-detail', async ({detail: ticket}) => {
  const panel = document.createElement('section');
  panel.className = 'ticket-actions';
  panel.innerHTML = `<h3>Gerenciar chamado</h3><p>As alterações são salvas no banco de demonstração.</p><div class="action-buttons"><button type="button" data-status="EM_ATENDIMENTO">Iniciar atendimento</button><button type="button" data-status="FECHADO">Fechar chamado</button><button type="button" data-status="ABERTO">Reabrir chamado</button></div><form class="priority-form"><label>Prioridade <select name="prioridade"><option value="BAIXA">Baixa</option><option value="MEDIA">Média</option><option value="ALTA">Alta</option></select></label><button type="submit">Salvar prioridade</button></form><form class="resolve-form"><h4>Concluir atendimento</h4><p class="resolution-note"></p><label class="solution-label">Solução<textarea name="texto" rows="3" maxlength="2000" placeholder="Descreva a solução aplicada"></textarea></label><label class="responsible-label">Responsável<select name="responsavelId"></select></label><button type="submit">Marcar como resolvido</button></form><p class="action-message" role="status" aria-live="polite"></p>`;
  container.append(panel);
  panel.querySelector('[name=prioridade]').value = ticket.prioridade;
  const solutionForm = panel.querySelector('.resolve-form');
  if (ticket.solucao) {
    panel.querySelector('.solution-label').hidden = true;
    panel.querySelector('.responsible-label').hidden = true;
    panel.querySelector('.resolution-note').textContent = 'Este chamado já possui uma solução. Ao concluir novamente, a solução existente será preservada.';
  } else {
    panel.querySelector('.resolution-note').textContent = 'Registre a solução e o responsável. A solução e o status são salvos na mesma transação.';
    const select = panel.querySelector('[name=responsavelId]');
    try {
      const res = await fetch('/api/usuarios');
      if (!res.ok) throw new Error('Não foi possível carregar os responsáveis.');
      const users = await res.json();
      for (const user of users) { const option = document.createElement('option'); option.value = user.id; option.textContent = user.nome; select.append(option); }
      if (!users.length) throw new Error('Nenhum responsável disponível.');
    } catch (error) { panel.querySelector('.action-message').textContent = error.message; solutionForm.querySelector('button').disabled = true; }
  }
  const perform = async fn => {
    const controls = [...panel.querySelectorAll('button')];
    controls.forEach(b => b.disabled = true);
    const message = panel.querySelector('.action-message'); message.textContent = 'Salvando…';
    try { await fn(); dialog.close(); document.getElementById('refresh').click(); }
    catch (error) { message.textContent = `Não foi possível salvar: ${error.message}`; }
    finally { controls.forEach(b => b.disabled = false); }
  };
  panel.querySelectorAll('[data-status]').forEach(button => {
    button.disabled = button.dataset.status === ticket.status;
    button.addEventListener('click', () => perform(() => changeStatus(ticket.id,button.dataset.status)));
  });
  panel.querySelector('.priority-form').addEventListener('submit', e => { e.preventDefault(); perform(() => changePriority(ticket.id,panel.querySelector('[name=prioridade]').value)); });
  solutionForm.addEventListener('submit', e => {
    e.preventDefault();
    if (ticket.solucao) { perform(() => changeStatus(ticket.id,'RESOLVIDO')); return; }
    const text=panel.querySelector('[name=texto]').value.trim(), responsible=Number(panel.querySelector('[name=responsavelId]').value);
    if (!text || !responsible) {panel.querySelector('.action-message').textContent='Informe a solução e o responsável.';return;}
    perform(() => resolveTicket(ticket.id,text,responsible));
  });
});

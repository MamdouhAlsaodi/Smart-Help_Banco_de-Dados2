import { createDemoTicket } from './demo-create.mjs';
const button = document.getElementById('create');
const result = document.getElementById('result');
button.addEventListener('click', async () => {
  button.disabled = true;
  result.hidden = false;
  result.className = 'result';
  result.textContent = 'Enviando chamado para a API…';
  try {
    const ticket = await createDemoTicket();
    result.classList.add('success');
    result.replaceChildren();
    const message = document.createElement('strong');
    message.textContent = `Chamado #${ticket.id} criado no PostgreSQL.`;
    const detail = document.createElement('p');
    detail.textContent = `Status: ${ticket.status === 'ABERTO' ? 'Aberto' : ticket.status}. Veja o registro atualizado no painel.`;
    const link = document.createElement('a');
    link.href = '/painel/#chamados';
    link.textContent = 'Ver chamados no painel ↗';
    result.append(message, detail, link);
  } catch (error) {
    result.classList.add('failure');
    result.textContent = `${error.message} Verifique a conexão e tente novamente.`;
  } finally { button.disabled = false; }
});

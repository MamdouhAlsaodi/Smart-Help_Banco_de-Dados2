export async function createDemoTicket(fetcher = fetch) {
  const get = async url => {
    const response = await fetcher(url);
    if (!response.ok) throw new Error(`Não foi possível consultar os dados (${response.status}).`);
    return response.json();
  };
  const [users, categories] = await Promise.all([get('/api/usuarios'), get('/api/categorias')]);
  if (!users[0]?.id || !categories[0]?.id) throw new Error('É necessário ter um usuário e categoria cadastrados.');
  const payload = {
    titulo: 'Teste de integração — impressora de rede',
    descricao: 'Demonstração acadêmica: falha simulada de impressão enviada por um sistema externo.',
    prioridade: 'MEDIA', autorId: users[0].id, categoriaId: categories[0].id
  };
  const response = await fetcher('/api/chamados', {
    method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(payload)
  });
  if (!response.ok) throw new Error(`Não foi possível criar o chamado (${response.status}).`);
  return response.json();
}

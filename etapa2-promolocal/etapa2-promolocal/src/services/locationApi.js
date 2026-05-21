const IBGE_BASE_URL = 'https://servicodados.ibge.gov.br/api/v1/localidades';

export async function buscarCepCorreios(cepDigitado) {
  // Aqui eu limpo o CEP porque a API espera apenas os numeros, sem traco ou ponto.
  const cep = String(cepDigitado).replace(/\D/g, '');

  if (cep.length !== 8) {
    throw new Error('Digite um CEP com 8 numeros.');
  }

  // Usei a ViaCEP porque ela consulta o endereco pelo CEP no mesmo padrao usado pelos Correios.
  const resposta = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
  const dados = await resposta.json();

  if (dados.erro) {
    throw new Error('CEP nao encontrado.');
  }

  return {
    cep: dados.cep,
    rua: dados.logradouro,
    bairro: dados.bairro,
    cidade: dados.localidade,
    uf: dados.uf
  };
}

export async function buscarEstadosIbge() {
  // Essa funcao carrega os estados direto da API oficial do IBGE.
  const resposta = await fetch(`${IBGE_BASE_URL}/estados?orderBy=nome`);
  const estados = await resposta.json();

  return estados.map((estado) => ({
    id: estado.id,
    nome: estado.nome,
    sigla: estado.sigla
  }));
}

export async function buscarMunicipiosPorUf(uf) {
  // Busco os municipios para validar se a cidade informada realmente existe no estado.
  const resposta = await fetch(`${IBGE_BASE_URL}/estados/${uf}/municipios?orderBy=nome`);
  const municipios = await resposta.json();

  return municipios.map((municipio) => ({
    id: municipio.id,
    nome: municipio.nome
  }));
}

export async function validarCidadeNoIbge(cidade, uf) {
  const municipios = await buscarMunicipiosPorUf(uf);
  const cidadeNormalizada = String(cidade).trim().toLowerCase();

  return municipios.some((municipio) => municipio.nome.toLowerCase() === cidadeNormalizada);
}

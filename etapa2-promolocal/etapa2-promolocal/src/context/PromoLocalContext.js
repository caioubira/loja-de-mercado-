import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  alternarStatusPromocao,
  buscarLoja,
  criarPromocao,
  excluirPromocao,
  iniciarBanco,
  listarPromocoes,
  salvarLoja
} from '../database/promolocalDb';

const PromoLocalContext = createContext(null);

export function PromoLocalProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [loja, setLoja] = useState(null);
  const [promocoes, setPromocoes] = useState([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    carregarDados();
  }, []);

  async function carregarDados() {
    // Essa funcao prepara o banco e depois busca tudo que a tela precisa mostrar.
    setCarregando(true);
    await iniciarBanco();
    const lojaSalva = await buscarLoja();
    const listaPromocoes = await listarPromocoes();
    setLoja(lojaSalva);
    setPromocoes(listaPromocoes);
    setCarregando(false);
  }

  function entrar(email) {
    // Login simples para a fase do projeto, simulando que o usuario foi autenticado.
    setUsuario({
      nome: email?.split('@')[0] || 'usuario',
      email
    });
  }

  function sair() {
    setUsuario(null);
  }

  async function atualizarLoja(dadosLoja) {
    await salvarLoja(dadosLoja);
    await carregarDados();
  }

  async function adicionarPromocao(dadosPromocao) {
    await criarPromocao({
      ...dadosPromocao,
      lojaNome: loja?.nome || 'Minha Loja'
    });
    await carregarDados();
  }

  async function mudarStatusPromocao(promocao) {
    await alternarStatusPromocao(promocao.id, promocao.ativa ? 0 : 1);
    await carregarDados();
  }

  async function removerPromocao(id) {
    await excluirPromocao(id);
    await carregarDados();
  }

  const value = useMemo(
    () => ({
      usuario,
      loja,
      promocoes,
      carregando,
      entrar,
      sair,
      atualizarLoja,
      adicionarPromocao,
      mudarStatusPromocao,
      removerPromocao
    }),
    [usuario, loja, promocoes, carregando]
  );

  return <PromoLocalContext.Provider value={value}>{children}</PromoLocalContext.Provider>;
}

export function usePromoLocal() {
  return useContext(PromoLocalContext);
}

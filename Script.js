/* =========================================================
   CLTS DO COMBATE — SCRIPT GLOBAL
========================================================= */
"use strict";

const USER_KEY = "clts-usuario-logado";
const ADMIN_KEY = "clts-admin-logado";
const PRODUCTS_KEY = "clts-produtos";

function obterUsuarioLogado() {
  try {
    const salvo = localStorage.getItem(USER_KEY);
    return salvo ? JSON.parse(salvo) : null;
  } catch { return null; }
}

function obterChaveCarrinho() {
  const usuario = obterUsuarioLogado();
  if (!usuario) return null;
  const id = usuario.id || usuario.email;
  return id ? `clts-carrinho-${encodeURIComponent(String(id))}` : null;
}

function carregarCarrinhoGlobal() {
  const chave = obterChaveCarrinho();
  if (!chave) return [];
  try {
    const carrinho = JSON.parse(localStorage.getItem(chave) || "[]");
    return Array.isArray(carrinho) ? carrinho : [];
  } catch { return []; }
}

function salvarCarrinhoGlobal(carrinho) {
  const chave = obterChaveCarrinho();
  if (!chave) return false;
  localStorage.setItem(chave, JSON.stringify(Array.isArray(carrinho) ? carrinho : []));
  atualizarContadorCarrinho();
  return true;
}

function contarItensCarrinho() {
  return carregarCarrinhoGlobal().reduce((total, item) => total + Number(item.quantidade || 1), 0);
}

function atualizarContadorCarrinho() {
  const qtd = contarItensCarrinho();
  document.querySelectorAll("#cartCount, #header-cart-count, [data-cart-count]").forEach(el => {
    el.textContent = qtd;
  });
}

function mostrarToastGlobal(mensagem) {
  let toast = document.getElementById("toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toast";
    toast.className = "global-toast";
    document.body.appendChild(toast);
  }
  toast.textContent = mensagem;
  toast.classList.add("show");
  clearTimeout(window.__cltsToast);
  window.__cltsToast = setTimeout(() => toast.classList.remove("show"), 2500);
}

function obterProdutosAtuais() {
  let lista = [];
  try {
    const salvo = localStorage.getItem(PRODUCTS_KEY);
    if (salvo) {
      const parsed = JSON.parse(salvo);
      if (Array.isArray(parsed)) lista = parsed;
    }
  } catch {}
  if (!lista.length && typeof produtos !== "undefined" && Array.isArray(produtos)) {
    lista = produtos.map(p => ({ ...p, disponivel: p.disponivel !== false }));
  }
  return lista;
}

function chaveProdutoGlobal(produto) {
  return `${String(produto.categoria || produto.modalidade || "").toLowerCase()}-${String(produto.id)}`;
}

function produtoEstaDisponivel(produto) {
  return produto && produto.disponivel !== false;
}

function atualizarContaGlobal() {
  const btn = document.getElementById("accountButton");
  if (!btn) return;
  const usuario = obterUsuarioLogado();
  if (!usuario) {
    btn.href = "login.html";
    btn.title = "Entrar";
    return;
  }
  btn.href = "perfil.html";
  btn.title = `Minha conta — ${usuario.nome || "cliente"}`;
}

function atualizarAdminGlobal() {
  const btn = document.getElementById("adminButton");
  if (!btn) return;
  btn.style.display = localStorage.getItem(ADMIN_KEY) === "true" ? "flex" : "none";
}

function configurarCarrinhoGlobal() {
  document.querySelectorAll(".cart-btn, .catalog-cart").forEach(btn => {
    btn.addEventListener("click", () => {
      if (!obterUsuarioLogado()) {
        window.location.href = "login.html";
        return;
      }
      window.location.href = "carrinho.html";
    });
  });
}


const campoBuscaGlobal = document.querySelector(".search input");
campoBuscaGlobal?.addEventListener("keydown", event => {
  if (event.key !== "Enter") return;
  const termo = campoBuscaGlobal.value.trim();
  if (!termo) return;
  window.location.href = `catalogo.html?busca=${encodeURIComponent(termo)}`;
});

function iniciarGlobal() {
  atualizarContaGlobal();
  atualizarAdminGlobal();
  atualizarContadorCarrinho();
  configurarCarrinhoGlobal();
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", iniciarGlobal);
else iniciarGlobal();

window.addEventListener("storage", iniciarGlobal);
window.addEventListener("pageshow", iniciarGlobal);

window.CLTS = {
  obterUsuario: obterUsuarioLogado,
  obterChaveCarrinho,
  carregarCarrinho: carregarCarrinhoGlobal,
  salvarCarrinho: salvarCarrinhoGlobal,
  atualizarContadorCarrinho,
  mostrarToast: mostrarToastGlobal,
  obterProdutos: obterProdutosAtuais,
  produtoEstaDisponivel,
  chaveProduto: chaveProdutoGlobal
};

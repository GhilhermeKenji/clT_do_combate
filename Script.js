/* ==========================================================
   CLTS DO COMBATE — SCRIPT.JS (MOTOR GLOBAL UNIFICADO)
========================================================== */
"use strict";

window.CLTS = window.CLTS || {};

window.CLTS.normalizarTexto = function(str) {
  return String(str || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
};

window.CLTS.mesmoItem = function(a, b) {
  const catA = CLTS.normalizarTexto(a.categoria || a.modalidade || "geral");
  const catB = CLTS.normalizarTexto(b.categoria || b.modalidade || "geral");
  return (
    String(a.id) === String(b.id) &&
    (a.tamanho || "Único") === (b.tamanho || "Único") &&
    catA === catB
  );
};

window.CLTS.obterUsuario = function() {
  try {
    return JSON.parse(localStorage.getItem("clts-usuario-logado") || "null");
  } catch {
    return null;
  }
};

window.CLTS.terminarSessao = function() {
  localStorage.removeItem("clts-usuario-logado");
  localStorage.removeItem("clts-admin-logado");
};

window.CLTS.migrarCarrinhoAnonimo = function() {
  const usuario = CLTS.obterUsuario();
  if (!usuario || !usuario.email) return;

  try {
    const anonimo = JSON.parse(localStorage.getItem("clts-carrinho-anonimo") || "[]");
    if (!Array.isArray(anonimo) || anonimo.length === 0) return;

    const chaveUsuario = `clts-carrinho-${usuario.email}`;
    const carrinhoUsuario = JSON.parse(localStorage.getItem(chaveUsuario) || "[]");

    anonimo.forEach(itemAnon => {
      const existente = carrinhoUsuario.find(item => CLTS.mesmoItem(item, itemAnon));
      if (existente) {
        existente.quantidade = Number(existente.quantidade || 1) + Number(itemAnon.quantidade || 1);
      } else {
        carrinhoUsuario.push(itemAnon);
      }
    });

    localStorage.setItem(chaveUsuario, JSON.stringify(carrinhoUsuario));
    localStorage.removeItem("clts-carrinho-anonimo");
  } catch (e) {
    console.error("Erro ao migrar carrinho:", e);
  }
};

window.CLTS.obterChaveCarrinho = function() {
  const usuario = CLTS.obterUsuario();
  if (usuario && usuario.email) {
    CLTS.migrarCarrinhoAnonimo();
    return `clts-carrinho-${usuario.email}`;
  }
  return "clts-carrinho-anonimo";
};

window.CLTS.carregarCarrinho = function() {
  try {
    return JSON.parse(localStorage.getItem(CLTS.obterChaveCarrinho()) || "[]");
  } catch {
    return [];
  }
};

window.CLTS.salvarCarrinho = function(carrinho) {
  try {
    localStorage.setItem(CLTS.obterChaveCarrinho(), JSON.stringify(carrinho));
    CLTS.atualizarContadorCarrinho();
  } catch (e) {
    console.error("Erro ao salvar carrinho:", e);
  }
};

if (!document.getElementById("clts-global-styles")) {
  const style = document.createElement("style");
  style.id = "clts-global-styles";
  style.textContent = `
    @keyframes cartPulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.35); color: #fff; background: #ff0055; }
      100% { transform: scale(1); }
    }
    .cart-pulsing {
      animation: cartPulse 0.35s ease-in-out;
    }
    .global-toast {
      position: fixed;
      bottom: 24px;
      right: 24px;
      background: #071923;
      color: #f7fbff;
      border: 1px solid #00e8ff;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.65);
      padding: 14px 20px;
      font-family: Inter, system-ui, sans-serif;
      font-size: 13px;
      font-weight: 700;
      z-index: 99999;
      opacity: 0;
      transform: translateY(16px);
      pointer-events: none;
      transition: opacity 0.25s ease, transform 0.25s ease;
    }
    .global-toast.show {
      opacity: 1;
      transform: translateY(0);
    }
  `;
  document.head.appendChild(style);
}

window.CLTS.atualizarContadorCarrinho = function() {
  const carrinho = CLTS.carregarCarrinho();
  const totalItens = carrinho.reduce((acc, item) => acc + Number(item.quantidade || 1), 0);

  document.querySelectorAll("[data-cart-count], #cartCount").forEach(el => {
    if (String(el.textContent) !== String(totalItens)) {
      el.textContent = totalItens;
      el.classList.add("cart-pulsing");
      setTimeout(() => el.classList.remove("cart-pulsing"), 350);
    }
  });
};

window.CLTS.mostrarToast = function(mensagem) {
  let toast = document.getElementById("global-toast-msg");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "global-toast-msg";
    toast.className = "global-toast";
    document.body.appendChild(toast);
  }
  toast.textContent = mensagem;
  toast.classList.add("show");
  clearTimeout(window.__toastTimeout);
  window.__toastTimeout = setTimeout(() => {
    toast.classList.remove("show");
  }, 2400);
};

window.CLTS.atualizarHeaderUsuario = function() {
  const usuario = CLTS.obterUsuario();
  if (!usuario) return;

  document.querySelectorAll('a[href="login.html"], a[href="./login.html"]').forEach(link => {
    link.setAttribute("href", "perfil.html");
    link.setAttribute("title", `Perfil de ${usuario.nome || "Cliente"}`);
  });
};

window.abrirProduto = window.abrirProduto || function(categoria, id) {
  if (id === undefined && categoria !== undefined) {
    location.href = `produto.html?id=${encodeURIComponent(categoria)}`;
    return;
  }
  const cat = categoria ? `&categoria=${encodeURIComponent(categoria)}` : "";
  location.href = `produto.html?id=${encodeURIComponent(id)}${cat}`;
};

document.addEventListener("DOMContentLoaded", () => {
  CLTS.migrarCarrinhoAnonimo();
  CLTS.atualizarHeaderUsuario();
  CLTS.atualizarContadorCarrinho();

  document.querySelectorAll(".cart-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      location.href = "carrinho.html";
    });
  });

  const inputBusca = document.getElementById("globalSearchInput");
  if (inputBusca) {
    const executarBusca = () => {
      const termo = inputBusca.value.trim();
      if (termo) {
        window.location.href = `catalogo.html?busca=${encodeURIComponent(termo)}`;
      }
    };

    inputBusca.addEventListener("keydown", e => {
      if (e.key === "Enter") {
        e.preventDefault();
        executarBusca();
      }
    });

    inputBusca.addEventListener("search", executarBusca);

    const iconeLupa = inputBusca.closest(".search")?.querySelector("svg");
    iconeLupa?.addEventListener("click", e => {
      if (inputBusca.value.trim()) {
        e.preventDefault();
        executarBusca();
      }
    });
  }
});
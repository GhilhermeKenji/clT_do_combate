/* ==========================================================
   CLTS DO COMBATE — SCRIPT.JS (Motor Global Unificado)
========================================================== */
"use strict";

window.CLTS = window.CLTS || {};

// Gestão do Utilizador
window.CLTS.obterUsuario = function() {
  try {
    return JSON.parse(localStorage.getItem("clts-usuario-logado") || null);
  } catch {
    return null;
  }
};

window.CLTS.terminarSessao = function() {
  localStorage.removeItem("clts-usuario-logado");
  localStorage.removeItem("clts-admin-logado");
};

// Chave única de carrinho baseada no utilizador (ou anónimo)
window.CLTS.obterChaveCarrinho = function() {
  const usuario = CLTS.obterUsuario();
  return usuario ? `clts-carrinho-${usuario.email}` : "clts-carrinho-anonimo";
};

// Carregar Carrinho
window.CLTS.carregarCarrinho = function() {
  try {
    const chave = CLTS.obterChaveCarrinho();
    return JSON.parse(localStorage.getItem(chave) || "[]");
  } catch {
    return [];
  }
};

// Guardar Carrinho
window.CLTS.salvarCarrinho = function(carrinho) {
  try {
    const chave = CLTS.obterChaveCarrinho();
    localStorage.setItem(chave, JSON.stringify(carrinho));
    CLTS.atualizarContadorCarrinho();
  } catch (e) {
    console.error(e);
  }
};

// Adicionar Animação CSS para o Contador do Carrinho
if (!document.getElementById("cart-pulse-style")) {
  const style = document.createElement("style");
  style.id = "cart-pulse-style";
  style.textContent = `
    @keyframes cartPulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.35); color: #fff; background: #ff0055; }
      100% { transform: scale(1); }
    }
    .cart-pulsing {
      animation: cartPulse 0.35s ease-in-out;
    }
  `;
  document.head.appendChild(style);
}

// Atualizar Contador do Carrinho no Cabeçalho
window.CLTS.atualizarContadorCarrinho = function() {
  const carrinho = CLTS.carregarCarrinho();
  const totalItens = carrinho.reduce((acc, item) => acc + Number(item.quantidade || 1), 0);
  
  document.querySelectorAll("[data-cart-count], #cartCount").forEach(el => {
    if (el.textContent != totalItens) {
      el.textContent = totalItens;
      el.classList.add("cart-pulsing");
      setTimeout(() => el.classList.remove("cart-pulsing"), 350);
    }
  });
};

// Sistema de Notificações Toast Global
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
  }, 2200);
};

// Inicialização automática ao carregar qualquer página
document.addEventListener("DOMContentLoaded", () => {
  CLTS.atualizarContadorCarrinho();

  // Sincronizar clique no botão do carrinho do cabeçalho
  document.querySelectorAll(".cart-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      location.href = "carrinho.html";
    });
  });
});
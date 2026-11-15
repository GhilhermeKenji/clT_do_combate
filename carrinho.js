/* ==========================================================
   CLTS DO COMBATE — CARRINHO.JS (COMPLETO E BLINDADO)
========================================================== */
"use strict";

document.addEventListener("DOMContentLoaded", () => {
  const formatoMoeda = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  });

  // Fallback seguro caso Script.js não tenha sido carregado antes
  const Store = window.CLTS || {
    obterUsuario() {
      try {
        return JSON.parse(localStorage.getItem("clts-usuario-logado") || "null");
      } catch {
        return null;
      }
    },
    obterChaveCarrinho() {
      const u = this.obterUsuario();
      return u && u.email ? `clts-carrinho-${u.email}` : "clts-carrinho-anonimo";
    },
    carregarCarrinho() {
      try {
        return JSON.parse(localStorage.getItem(this.obterChaveCarrinho()) || "[]");
      } catch {
        return [];
      }
    },
    salvarCarrinho(lista) {
      localStorage.setItem(this.obterChaveCarrinho(), JSON.stringify(lista));
    },
    mesmoItem(a, b) {
      return (
        String(a.id) === String(b.id) &&
        (a.tamanho || "Único") === (b.tamanho || "Único") &&
        String(a.categoria || "geral").toLowerCase() === String(b.categoria || "geral").toLowerCase()
      );
    },
    atualizarContadorCarrinho() {},
    mostrarToast(msg) {
      alert(msg);
    }
  };

  function obterOuCriarContainerItens() {
    let container = document.querySelector(
      "#cart-items, #carrinho-itens, #itens-carrinho, #lista-carrinho, #produtos-carrinho, #cart-list, #cart-products, .cart-items, .carrinho-itens, .itens-carrinho"
    );
    if (container) return container;

    // Procura a caixa do Resumo para inserir a lista de itens logo acima dela
    const headingResumo = Array.from(document.querySelectorAll("h2, h3, h4")).find(
      el => el.textContent.trim().toLowerCase() === "resumo"
    );
    const caixaResumo =
      document.querySelector("aside, .resumo, .cart-summary, .summary") ||
      headingResumo?.closest("div, section, aside");

    container = document.createElement("div");
    container.id = "cart-items";
    container.style.marginBottom = "24px";

    if (caixaResumo && caixaResumo.parentElement) {
      caixaResumo.parentElement.insertBefore(container, caixaResumo);
    } else {
      const main = document.querySelector("main") || document.body;
      main.appendChild(container);
    }

    return container;
  }

  function obterElementoTotal() {
    const direto = document.querySelector(
      "#total, #cart-total, #total-carrinho, #valor-total, .cart-total"
    );
    if (direto) return direto;

    const labelTotal = Array.from(document.querySelectorAll("span, p, strong, div")).find(
      el => el.children.length === 0 && /^total\s*:?$/i.test(el.textContent.trim())
    );
    return labelTotal?.nextElementSibling || null;
  }

  const containerItens = obterOuCriarContainerItens();
  const elSubtotal = document.querySelector("#subtotal, #cart-subtotal, #subtotal-carrinho");
  const elFrete = document.querySelector("#shipping, #frete, #cart-shipping, #frete-carrinho");
  const elTotal = obterElementoTotal();
  const btnCheckout =
    document.querySelector("#checkout-btn, #finalizar-compra, #btn-finalizar, .checkout-btn, .finish") ||
    Array.from(document.querySelectorAll("button, a")).find(el =>
      el.textContent.toUpperCase().includes("FINALIZAR")
    );
  const btnLimpar = document.querySelector("#clear-cart, #limpar-carrinho");

  const FRETE_PADRAO = 19.90;

  function renderizarCarrinho() {
    const carrinho = Store.carregarCarrinho();

    if (carrinho.length === 0) {
      containerItens.innerHTML = `
        <div class="empty-cart" style="text-align:center;padding:45px 20px;background:#071923;border:1px solid #193d4b;color:#8799a4;">
          <p style="font-size:16px;margin-bottom:16px;">O seu carrinho está vazio.</p>
          <a href="catalogo.html" style="display:inline-block;padding:12px 22px;background:#00e8ff;color:#001016;font-weight:900;font-size:12px;text-decoration:none;">
            EXPLORAR CATÁLOGO
          </a>
        </div>`;

      if (elSubtotal) elSubtotal.textContent = formatoMoeda.format(0);
      if (elFrete) elFrete.textContent = formatoMoeda.format(0);
      if (elTotal) elTotal.textContent = formatoMoeda.format(0);
      if (btnCheckout && "disabled" in btnCheckout) btnCheckout.disabled = true;
      return;
    }

    if (btnCheckout && "disabled" in btnCheckout) btnCheckout.disabled = false;
    containerItens.innerHTML = "";

    let subtotal = 0;

    carrinho.forEach((item, index) => {
      const qtd = Math.max(1, Number(item.quantidade || 1));
      const preco = Number(item.preco || 0);
      const totalItem = preco * qtd;
      subtotal += totalItem;

      const card = document.createElement("div");
      card.className = "cart-item";
      card.style.cssText =
        "display:flex;align-items:center;justify-content:space-between;gap:16px;padding:16px;margin-bottom:12px;background:#071923;border:1px solid #193d4b;flex-wrap:wrap;";

      card.innerHTML = `
        <div style="display:flex;align-items:center;gap:14px;flex:1;min-width:220px;">
          <img
            src="${item.imagem || "images/logo-clts.png"}"
            alt="${item.nome || "Produto"}"
            style="width:74px;height:74px;object-fit:cover;background:#031019;border:1px solid #193d4b;flex-shrink:0;"
          >
          <div>
            <span style="display:block;font-size:10px;font-weight:800;text-transform:uppercase;color:#00e8ff;margin-bottom:4px;">
              ${item.categoria || item.modalidade || "Combate"}
            </span>
            <strong style="display:block;font-size:15px;color:#f7fbff;margin-bottom:4px;">
              ${item.nome || "Produto"}
            </strong>
            <span style="font-size:12px;color:#8799a4;">
              Tamanho: ${item.tamanho || "Único"} • Unitário: ${formatoMoeda.format(preco)}
            </span>
          </div>
        </div>

        <div style="display:flex;align-items:center;gap:16px;">
          <div style="display:flex;align-items:center;border:1px solid #294653;background:#031019;">
            <button type="button" data-dec style="width:32px;height:34px;background:transparent;border:none;color:#fff;font-weight:900;cursor:pointer;">−</button>
            <span style="min-width:32px;text-align:center;font-size:13px;font-weight:800;color:#fff;">${qtd}</span>
            <button type="button" data-inc style="width:32px;height:34px;background:transparent;border:none;color:#fff;font-weight:900;cursor:pointer;">+</button>
          </div>

          <strong style="min-width:95px;text-align:right;font-size:15px;color:#fff;">
            ${formatoMoeda.format(totalItem)}
          </strong>

          <button
            type="button"
            data-rem
            title="Remover item"
            style="background:transparent;border:1px solid #3a1f28;color:#ff9d9d;padding:7px 10px;font-size:11px;font-weight:800;cursor:pointer;"
          >REMOVER</button>
        </div>
      `;

      const img = card.querySelector("img");
      if (img) {
        img.onerror = function() {
          this.onerror = null;
          this.src = "images/logo-clts.png";
        };
      }

      card.querySelector("[data-dec]")?.addEventListener("click", () => {
        const atual = Store.carregarCarrinho();
        const alvo = atual.find(x => Store.mesmoItem(x, item)) || atual[index];
        if (!alvo) return;

        if (Number(alvo.quantidade || 1) > 1) {
          alvo.quantidade = Number(alvo.quantidade || 1) - 1;
        } else {
          const idxRemover = atual.findIndex(x => Store.mesmoItem(x, item));
          atual.splice(idxRemover >= 0 ? idxRemover : index, 1);
        }
        Store.salvarCarrinho(atual);
        renderizarCarrinho();
      });

      card.querySelector("[data-inc]")?.addEventListener("click", () => {
        const atual = Store.carregarCarrinho();
        const alvo = atual.find(x => Store.mesmoItem(x, item)) || atual[index];
        if (!alvo) return;

        alvo.quantidade = Number(alvo.quantidade || 1) + 1;
        Store.salvarCarrinho(atual);
        renderizarCarrinho();
      });

      card.querySelector("[data-rem]")?.addEventListener("click", () => {
        const atual = Store.carregarCarrinho();
        const idxRemover = atual.findIndex(x => Store.mesmoItem(x, item));
        atual.splice(idxRemover >= 0 ? idxRemover : index, 1);
        Store.salvarCarrinho(atual);
        Store.mostrarToast("Item removido do carrinho.");
        renderizarCarrinho();
      });

      containerItens.appendChild(card);
    });

    const freteAplicado = elFrete ? FRETE_PADRAO : 0;
    const totalGeral = subtotal + freteAplicado;

    if (elSubtotal) elSubtotal.textContent = formatoMoeda.format(subtotal);
    if (elFrete) elFrete.textContent = formatoMoeda.format(freteAplicado);
    if (elTotal) elTotal.textContent = formatoMoeda.format(totalGeral);
  }

  btnLimpar?.addEventListener("click", () => {
    Store.salvarCarrinho([]);
    Store.mostrarToast("Carrinho esvaziado.");
    renderizarCarrinho();
  });

  btnCheckout?.addEventListener("click", e => {
    e.preventDefault();
    const carrinho = Store.carregarCarrinho();
    if (carrinho.length === 0) {
      Store.mostrarToast("O seu carrinho está vazio.");
      return;
    }

    const usuario = Store.obterUsuario();
    if (!usuario) {
      Store.mostrarToast("Faça login para finalizar a compra.");
      setTimeout(() => {
        location.href = "login.html";
      }, 800);
      return;
    }

    location.href = "finalizar-compra.html";
  });

  renderizarCarrinho();
  Store.atualizarContadorCarrinho();
});
/* ==========================================================
   CLTS DO COMBATE — PRODUTO.JS (Limpo e Funcional)
========================================================== */
"use strict";

const paramsP = new URLSearchParams(location.search);
const catP = paramsP.get("categoria");
const idP = paramsP.get("id");

const listaP = CLTS.obterProdutos();
const produtoP = listaP.find(p => String(p.id) === String(idP) && (p.categoria || "") === catP);

const els = {
  name: document.getElementById("product-name"),
  cat: document.getElementById("product-category"),
  desc: document.getElementById("product-description"),
  price: document.getElementById("product-price"),
  img: document.getElementById("product-main-image"),
  code: document.getElementById("product-code"),
  qty: document.getElementById("quantity"),
  minus: document.getElementById("quantity-minus"),
  plus: document.getElementById("quantity-plus"),
  add: document.getElementById("add-cart-button"),
  buy: document.getElementById("buy-button"),
  size: document.getElementById("selected-size"),
  unavailable: document.getElementById("unavailable")
};

if (!produtoP) {
  location.href = "catalogo.html";
} else {
  const disponivel = CLTS.produtoEstaDisponivel(produtoP);
  
  els.name.textContent = produtoP.nome;
  els.cat.textContent = catP;
  els.desc.textContent = produtoP.descricao || "Equipamento para artes marciais.";
  els.price.textContent = Number(produtoP.preco || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  els.code.textContent = `${catP}-${produtoP.id}`;
  
  if (els.img) {
    els.img.src = produtoP.imagem || "images/logo-clts.png";
    els.img.onerror = () => { els.img.src = "images/logo-clts.png"; };
  }

  if (!disponivel) {
    els.unavailable?.classList.add("show");
    if (els.add) els.add.disabled = true;
    if (els.buy) els.buy.disabled = true;
    if (els.size) els.size.disabled = true;
    if (els.minus) els.minus.disabled = true;
    if (els.plus) els.plus.disabled = true;
  }

  function adicionar(irCheckout = false) {
    if (!disponivel) {
      CLTS.mostrarToast("Este produto está indisponível.");
      return;
    }
    
    const u = CLTS.obterUsuario();
    if (!u) {
      location.href = "login.html";
      return;
    }

    const cart = CLTS.carregarCarrinho();
    const size = els.size ? els.size.value : "";
    const qtdDesejada = Number(els.qty.textContent || 1);

    const existing = cart.find(i => 
      String(i.id) === String(produtoP.id) && 
      (i.categoria || "") === catP && 
      (i.tamanho || "") === size
    );

    if (existing) {
      existing.quantidade = Number(existing.quantidade || 1) + qtdDesejada;
    } else {
      cart.push({
        id: produtoP.id,
        categoria: catP,
        nome: produtoP.nome,
        preco: produtoP.preco,
        imagem: produtoP.imagem || "images/logo-clts.png",
        tamanho: size,
        quantidade: qtdDesejada,
        disponivel: true
      });
    }

    CLTS.salvarCarrinho(cart);
    CLTS.mostrarToast("Produto adicionado ao carrinho.");
    
    if (irCheckout) {
      setTimeout(() => { location.href = "carrinho.html"; }, 350);
    }
  }

  els.minus?.addEventListener("click", () => {
    let q = Math.max(1, Number(els.qty.textContent) - 1);
    els.qty.textContent = q;
  });

  els.plus?.addEventListener("click", () => {
    let q = Math.min(99, Number(els.qty.textContent) + 1);
    els.qty.textContent = q;
  });

  els.add?.addEventListener("click", () => adicionar(false));
  els.buy?.addEventListener("click", () => adicionar(true));
}

document.getElementById("go-cart")?.addEventListener("click", () => {
  location.href = CLTS.obterUsuario() ? "carrinho.html" : "login.html";
});
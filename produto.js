/* ==========================================================
   CLTS DO COMBATE — PRODUTO.JS
========================================================== */
"use strict";

document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(location.search);
  const id = params.get("id") || params.get("produto") || params.get("p");
  const categoriaParam = params.get("categoria") || params.get("modalidade");

  const normalizar = str =>
    String(str || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();

  let listaProdutos = [];
  try {
    const salvo = localStorage.getItem("clts-produtos");
    if (salvo) {
      const parsed = JSON.parse(salvo);
      if (Array.isArray(parsed)) listaProdutos = parsed;
    }
  } catch (e) {
    console.error(e);
  }

  if (typeof produtos !== "undefined") {
    const origem = Array.isArray(produtos)
      ? produtos
      : Object.entries(produtos).flatMap(([cat, itens]) =>
          Array.isArray(itens) ? itens.map(item => ({ categoria: cat, ...item })) : []
        );

    origem.forEach(p => {
      const jaExiste = listaProdutos.some(
        item =>
          String(item.id) === String(p.id) &&
          normalizar(item.categoria || item.modalidade) === normalizar(p.categoria || p.modalidade)
      );
      if (!jaExiste) listaProdutos.push(p);
    });
  }

  let produto = null;
  if (categoriaParam) {
    const catNorm = normalizar(categoriaParam);
    produto = listaProdutos.find(
      p => String(p.id) === String(id) && normalizar(p.categoria || p.modalidade) === catNorm
    );
  }
  if (!produto) {
    produto = listaProdutos.find(p => String(p.id) === String(id));
  }

  if (!produto) {
    document.body.innerHTML = `
      <div style="text-align:center;padding:80px 20px;color:#fff;font-family:Inter,sans-serif;background:#020b11;min-height:100vh;">
        <h2 style="font-size:24px;margin-bottom:12px;">Produto não encontrado</h2>
        <a href="catalogo.html" style="color:#00e8ff;text-decoration:none;font-weight:800;">← Voltar ao catálogo</a>
      </div>`;
    return;
  }

  const elTitulo = document.querySelector("#product-title, #product-name, #nome-produto, .product-title, main h1");
  const elPreco = document.querySelector("#product-price, #preco-produto, .product-price");
  const elDesc = document.querySelector("#product-desc, #product-description, #descricao-produto, .product-desc");
  const imgEl = document.querySelector("#product-img, #product-image, #imagem-produto, .product-image img, main img");

  if (elTitulo) elTitulo.textContent = produto.nome || "Produto";
  if (elPreco) {
    elPreco.textContent = Number(produto.preco || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });
  }
  if (elDesc) {
    elDesc.textContent =
      produto.descricao ||
      "Equipamento profissional desenvolvido para máxima durabilidade e alta performance.";
  }

  if (imgEl) {
    imgEl.src = produto.imagem || "images/logo-clts.png";
    imgEl.alt = produto.nome || "Produto";
    imgEl.onerror = function() {
      this.onerror = null;
      this.src = "images/logo-clts.png";
    };
  }

  const elCodigo = document.querySelector("#product-code, #codigo-produto, #codigo");
  if (elCodigo) {
    elCodigo.textContent = produto.codigo || produto.sku || produto.id;
  } else {
    document.querySelectorAll("main p, main span, main div").forEach(el => {
      if (el.children.length === 0 && el.textContent.trim() === "Código:") {
        el.textContent = `Código: ${produto.codigo || produto.sku || produto.id}`;
      }
    });
  }

  const selectTamanho = document.querySelector("#tamanho, #select-tamanho, main select");
  if (selectTamanho && Array.isArray(produto.tamanhos) && produto.tamanhos.length > 0) {
    selectTamanho.innerHTML = produto.tamanhos
      .map(t => `<option value="${t}">${t}</option>`)
      .join("");
  }

  const btnMenos = Array.from(document.querySelectorAll("main button")).find(b =>
    ["-", "−"].includes(b.textContent.trim())
  );
  const qtdInput =
    document.querySelector("#quantidade, #qty, main input[type='number']") ||
    btnMenos?.parentElement?.querySelector("input");

  if (qtdInput && qtdInput.parentElement) {
    qtdInput.parentElement.querySelectorAll("button").forEach(btn => {
      const simbolo = btn.textContent.trim();
      if (simbolo === "-" || simbolo === "−") {
        btn.addEventListener("click", () => {
          qtdInput.value = Math.max(1, Number(qtdInput.value || 1) - 1);
        });
      }
      if (simbolo === "+") {
        btn.addEventListener("click", () => {
          qtdInput.value = Number(qtdInput.value || 1) + 1;
        });
      }
    });
  }

  const botoesMain = Array.from(document.querySelectorAll("main button"));
  const btnAdicionar =
    document.getElementById("add-to-cart") ||
    botoesMain.find(b => b.textContent.toUpperCase().includes("ADICIONAR"));
  const btnComprarAgora =
    document.getElementById("buy-now") ||
    botoesMain.find(b => b.textContent.toUpperCase().includes("COMPRAR"));

  function adicionarItemAoCarrinho() {
    const tamanhoSel = selectTamanho?.value || "Único";
    const qtdSel = qtdInput ? Math.max(1, Number(qtdInput.value || 1)) : 1;
    const categoriaFinal = produto.categoria || produto.modalidade || categoriaParam || "geral";

    const novoItem = {
      id: produto.id,
      nome: produto.nome,
      preco: produto.preco,
      imagem: produto.imagem,
      tamanho: tamanhoSel,
      quantidade: qtdSel,
      categoria: categoriaFinal
    };

    const carrinho = CLTS.carregarCarrinho();
    const itemExistente = carrinho.find(item =>
      window.CLTS && typeof CLTS.mesmoItem === "function"
        ? CLTS.mesmoItem(item, novoItem)
        : String(item.id) === String(novoItem.id) &&
          (item.tamanho || "Único") === novoItem.tamanho &&
          normalizar(item.categoria || "geral") === normalizar(novoItem.categoria)
    );

    if (itemExistente) {
      itemExistente.quantidade = Number(itemExistente.quantidade || 1) + qtdSel;
    } else {
      carrinho.push(novoItem);
    }

    CLTS.salvarCarrinho(carrinho);
  }

  btnAdicionar?.addEventListener("click", () => {
    adicionarItemAoCarrinho();
    CLTS.mostrarToast("Produto adicionado ao carrinho!");
  });

  btnComprarAgora?.addEventListener("click", () => {
    adicionarItemAoCarrinho();
    location.href = "carrinho.html";
  });

  if (window.CLTS) CLTS.atualizarContadorCarrinho();
});
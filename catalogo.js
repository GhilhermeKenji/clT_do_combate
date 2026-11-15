/* ==========================================================
   CLTS DO COMBATE — CATALOGO.JS (COMPLETO E CORRIGIDO)
========================================================== */
"use strict";

let produtosDoCatalogo = [];
let categoriaAtiva = "todos";
let termoBuscaAtivo = "";
let ordenacaoAtiva = "padrao";
let apenasFavoritos = false;

const formatoMoeda = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL"
});

function normalizarTexto(str) {
  return String(str || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function categoriaProduto(p) {
  return normalizarTexto(p?.categoria || p?.modalidade || p?.category || "geral");
}

function imagemProduto(p) {
  return (
    p?.imagem ||
    p?.img ||
    p?.foto ||
    p?.image ||
    (Array.isArray(p?.imagens) ? p.imagens[0] : "") ||
    "images/logo-clts.png"
  );
}

function chaveFavorito(p) {
  return `${categoriaProduto(p)}:${p.id}`;
}

function obterFavoritos() {
  try {
    const salvo = JSON.parse(localStorage.getItem("clts-favoritos") || "[]");
    return Array.isArray(salvo) ? salvo : [];
  } catch {
    return [];
  }
}

function salvarFavoritos(lista) {
  try {
    localStorage.setItem("clts-favoritos", JSON.stringify(lista));
  } catch (e) {
    console.error("Erro ao salvar favoritos:", e);
  }
}

function alternarFavorito(chave) {
  const favoritos = obterFavoritos();
  const idx = favoritos.indexOf(chave);

  if (idx >= 0) {
    favoritos.splice(idx, 1);
    if (window.CLTS) CLTS.mostrarToast("Removido dos favoritos.");
  } else {
    favoritos.push(chave);
    if (window.CLTS) CLTS.mostrarToast("Adicionado aos favoritos!");
  }

  salvarFavoritos(favoritos);
  aplicarFiltrosCatalogo();
}

function carregarProdutosCatalogo() {
  const lista = [];

  try {
    const salvo = JSON.parse(localStorage.getItem("clts-produtos") || "[]");
    if (Array.isArray(salvo)) {
      salvo.forEach(p => lista.push(p));
    }
  } catch (e) {
    console.error("Erro ao ler produtos do localStorage:", e);
  }

  if (typeof produtos !== "undefined") {
    const origem = Array.isArray(produtos)
      ? produtos
      : Object.entries(produtos).flatMap(([cat, itens]) =>
          Array.isArray(itens) ? itens.map(item => ({ categoria: cat, ...item })) : []
        );

    origem.forEach(p => {
      const jaExiste = lista.some(
        item =>
          String(item.id) === String(p.id) &&
          categoriaProduto(item) === categoriaProduto(p)
      );
      if (!jaExiste) lista.push(p);
    });
  }

  return lista;
}

function mostrarMensagemCatalogo(texto) {
  if (window.CLTS && typeof CLTS.mostrarToast === "function") {
    CLTS.mostrarToast(texto);
    return;
  }
  const elMsg = document.querySelector("#catalog-message, #mensagem-catalogo");
  if (elMsg) elMsg.textContent = texto;
}

function abrirProduto(categoria, id) {
  const catNorm = normalizarTexto(categoria);
  const produto =
    produtosDoCatalogo.find(
      p => String(p.id) === String(id) && categoriaProduto(p) === catNorm
    ) || produtosDoCatalogo.find(p => String(p.id) === String(id));

  if (!produto || produto.disponivel === false) {
    if (produto) mostrarMensagemCatalogo("Este produto está indisponível no momento.");
    return;
  }

  const catFinal = categoria || categoriaProduto(produto) || "";
  location.href = `produto.html?id=${encodeURIComponent(id)}&categoria=${encodeURIComponent(catFinal)}`;
}

function adicionarRapidoAoCarrinho(produto) {
  if (!window.CLTS) return;

  const tamanhoPadrao =
    Array.isArray(produto.tamanhos) && produto.tamanhos.length > 0
      ? produto.tamanhos[0]
      : "Único";

  const novoItem = {
    id: produto.id,
    nome: produto.nome,
    preco: produto.preco,
    imagem: imagemProduto(produto),
    tamanho: tamanhoPadrao,
    quantidade: 1,
    categoria: produto.categoria || produto.modalidade || "geral"
  };

  const carrinho = CLTS.carregarCarrinho();
  const existente = carrinho.find(item =>
    typeof CLTS.mesmoItem === "function"
      ? CLTS.mesmoItem(item, novoItem)
      : String(item.id) === String(novoItem.id) &&
        (item.tamanho || "Único") === novoItem.tamanho &&
        categoriaProduto(item) === categoriaProduto(novoItem)
  );

  if (existente) {
    existente.quantidade = Number(existente.quantidade || 1) + 1;
  } else {
    carrinho.push(novoItem);
  }

  CLTS.salvarCarrinho(carrinho);
  CLTS.mostrarToast("Produto adicionado ao carrinho!");
}

function atualizarContadorResultados(total) {
  const texto = `${total} ${total === 1 ? "produto encontrado" : "produtos encontrados"}`;
  const seletorDireto = document.querySelector(
    "#products-count, #produtos-encontrados, #catalog-count, #resultados-count, .products-count, .catalog-count"
  );

  if (seletorDireto) {
    seletorDireto.textContent = texto;
    return;
  }

  document.querySelectorAll("p, span, small").forEach(el => {
    if (el.children.length === 0 && /produtos?\s+encontrados?/i.test(el.textContent)) {
      el.textContent = texto;
    }
  });
}

function injetarEstilosCards() {
  if (document.getElementById("clts-catalog-card-fix")) return;
  const style = document.createElement("style");
  style.id = "clts-catalog-card-fix";
  style.textContent = `
    .clts-card {
      background: #071923 !important;
      border: 1px solid #193d4b !important;
      display: flex !important;
      flex-direction: column !important;
      justify-content: space-between !important;
      overflow: hidden !important;
      height: 100% !important;
      transition: border-color 0.2s ease, transform 0.2s ease;
    }
    .clts-card:hover {
      border-color: #00e8ff !important;
      transform: translateY(-3px);
    }
    .clts-card-media {
      position: relative !important;
      width: 100% !important;
      height: 230px !important;
      min-height: 230px !important;
      max-height: 230px !important;
      background: #031019 !important;
      overflow: hidden !important;
      cursor: pointer;
    }
    .clts-card-media img {
      width: 100% !important;
      height: 100% !important;
      object-fit: cover !important;
      object-position: center !important;
      display: block !important;
    }
    .clts-card-body {
      padding: 16px !important;
      display: flex !important;
      flex-direction: column !important;
      gap: 8px !important;
      flex: 1 !important;
    }
    .clts-card-cat {
      font-size: 10px !important;
      font-weight: 800 !important;
      text-transform: uppercase !important;
      letter-spacing: 1px !important;
      color: #00e8ff !important;
    }
    .clts-card-title {
      font-size: 15px !important;
      font-weight: 700 !important;
      color: #f7fbff !important;
      line-height: 1.35 !important;
      margin: 0 !important;
      cursor: pointer;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .clts-card-price {
      font-size: 18px !important;
      font-weight: 800 !important;
      color: #ffffff !important;
      margin-top: auto !important;
      padding-top: 6px !important;
    }
    .clts-card-actions {
      display: flex !important;
      gap: 8px !important;
      margin-top: 10px !important;
    }
    .clts-btn-ver {
      flex: 1 !important;
      height: 40px !important;
      background: #00e8ff !important;
      color: #001016 !important;
      border: 1px solid #00e8ff !important;
      font-size: 11px !important;
      font-weight: 900 !important;
      letter-spacing: 0.5px !important;
      text-transform: uppercase !important;
      cursor: pointer !important;
      transition: filter 0.2s ease;
    }
    .clts-btn-ver:hover {
      filter: brightness(1.1);
    }
    .clts-btn-ver:disabled {
      background: #142c38 !important;
      border-color: #244554 !important;
      color: #6c828e !important;
      cursor: not-allowed !important;
    }
    .clts-btn-add {
      width: 42px !important;
      height: 40px !important;
      background: #031019 !important;
      color: #00e8ff !important;
      border: 1px solid #00e8ff !important;
      font-size: 18px !important;
      font-weight: 800 !important;
      line-height: 1 !important;
      cursor: pointer !important;
      transition: background 0.2s ease, color 0.2s ease;
    }
    .clts-btn-add:hover {
      background: #00e8ff !important;
      color: #001016 !important;
    }
  `;
  document.head.appendChild(style);
}

function renderizarCatalogo(lista) {
  injetarEstilosCards();
  atualizarContadorResultados(lista ? lista.length : 0);

  const container = document.querySelector(
    "#catalog-grid, #produtos-grid, #catalogo-produtos, #products-grid, .catalog-grid, .products-grid"
  );
  if (!container) return;

  if (!lista || lista.length === 0) {
    container.innerHTML = `
      <div style="grid-column:1/-1;text-align:center;padding:50px 20px;color:#8799a4;background:#071923;border:1px solid #193d4b;">
        <p style="font-size:15px;margin-bottom:14px;">Nenhum produto encontrado para o filtro selecionado.</p>
        <button type="button" id="btn-limpar-filtros" class="clts-btn-ver" style="padding:0 22px;">
          LIMPAR FILTROS
        </button>
      </div>`;

    document.getElementById("btn-limpar-filtros")?.addEventListener("click", () => {
      categoriaAtiva = "todos";
      termoBuscaAtivo = "";
      apenasFavoritos = false;

      const inputBusca = document.querySelector(
        "#catalogSearchInput, #searchInput, #busca-input, #globalSearchInput, input[type='search'], input[placeholder*='Pesquisar']"
      );
      if (inputBusca) inputBusca.value = "";

      atualizarBotoesCategoria();
      aplicarFiltrosCatalogo();
    });
    return;
  }

  const favoritos = obterFavoritos();
  container.innerHTML = "";

  lista.forEach(produto => {
    const cat = categoriaProduto(produto);
    const chave = chaveFavorito(produto);
    const isFav = favoritos.includes(chave);
    const indisponivel = produto.disponivel === false;
    const srcImagem = imagemProduto(produto);

    const card = document.createElement("article");
    card.className = "product-card clts-card";

    card.innerHTML = `
      <div class="clts-card-media" data-open-product>
        <img
          src="${srcImagem}"
          alt="${produto.nome || "Produto"}"
          ${indisponivel ? 'style="opacity:0.45;"' : ""}
        >
        <button
          type="button"
          class="btn-favorito ${isFav ? "ativo" : ""}"
          title="${isFav ? "Remover dos favoritos" : "Salvar nos favoritos"}"
          style="position:absolute;top:10px;right:10px;width:34px;height:34px;border-radius:50%;border:1px solid #193d4b;background:rgba(2,11,17,0.88);color:${isFav ? "#ff2e63" : "#8799a4"};font-size:16px;cursor:pointer;display:flex;align-items:center;justify-content:center;z-index:2;"
        >${isFav ? "♥" : "♡"}</button>
      </div>
      <div class="clts-card-body">
        <span class="clts-card-cat">
          ${produto.categoria || produto.modalidade || "Combate"}
        </span>
        <h3 class="clts-card-title" data-open-product>
          ${produto.nome || "Produto"}
        </h3>
        <strong class="clts-card-price">
          ${formatoMoeda.format(Number(produto.preco || 0))}
        </strong>
        <div class="clts-card-actions">
          <button
            type="button"
            class="clts-btn-ver"
            data-open-product
            ${indisponivel ? "disabled" : ""}
          >${indisponivel ? "INDISPONÍVEL" : "VER PRODUTO"}</button>
          ${
            indisponivel
              ? ""
              : `<button
                  type="button"
                  class="clts-btn-add"
                  data-quick-add
                  title="Adicionar ao carrinho"
                >+</button>`
          }
        </div>
      </div>
    `;

    const img = card.querySelector("img");
    if (img) {
      img.onerror = function() {
        this.onerror = null;
        this.src = "images/logo-clts.png";
      };
    }

    card.querySelector(".btn-favorito")?.addEventListener("click", e => {
      e.stopPropagation();
      alternarFavorito(chave);
    });

    card.querySelectorAll("[data-open-product]").forEach(el => {
      el.addEventListener("click", () => abrirProduto(cat, produto.id));
    });

    card.querySelector("[data-quick-add]")?.addEventListener("click", e => {
      e.stopPropagation();
      adicionarRapidoAoCarrinho(produto);
    });

    container.appendChild(card);
  });
}

function atualizarBotoesCategoria() {
  document
    .querySelectorAll("[data-categoria], [data-category], .filter-btn, .cat-btn, .category-pill")
    .forEach(btn => {
      const val = normalizarTexto(
        btn.dataset.categoria || btn.dataset.category || btn.textContent
      );
      const ativo = val === categoriaAtiva || (categoriaAtiva === "todos" && val.startsWith("todo"));
      btn.classList.toggle("active", ativo);
      btn.classList.toggle("ativo", ativo);
    });
}

function ordenarLista(lista) {
  const copia = [...lista];
  const ord = normalizarTexto(ordenacaoAtiva);

  if (ord.includes("menor") || ord === "price-asc" || ord === "preco-asc") {
    copia.sort((a, b) => Number(a.preco || 0) - Number(b.preco || 0));
  } else if (ord.includes("maior") || ord === "price-desc" || ord === "preco-desc") {
    copia.sort((a, b) => Number(b.preco || 0) - Number(a.preco || 0));
  } else if (ord === "az" || ord === "a-z" || ord.includes("nome-asc")) {
    copia.sort((a, b) => String(a.nome || "").localeCompare(String(b.nome || ""), "pt-BR"));
  } else if (ord === "za" || ord === "z-a" || ord.includes("nome-desc")) {
    copia.sort((a, b) => String(b.nome || "").localeCompare(String(a.nome || ""), "pt-BR"));
  }

  return copia;
}

function aplicarFiltrosCatalogo() {
  const favoritos = obterFavoritos();
  const termo = normalizarTexto(termoBuscaAtivo);

  const filtrados = produtosDoCatalogo.filter(p => {
    const cat = categoriaProduto(p);

    if (categoriaAtiva !== "todos" && !categoriaAtiva.startsWith("todo")) {
      if (cat !== categoriaAtiva) return false;
    }

    if (apenasFavoritos && !favoritos.includes(chaveFavorito(p))) {
      return false;
    }

    if (termo) {
      const nomeNorm = normalizarTexto(p.nome);
      const descNorm = normalizarTexto(p.descricao);
      if (!nomeNorm.includes(termo) && !descNorm.includes(termo) && !cat.includes(termo)) {
        return false;
      }
    }

    return true;
  });

  renderizarCatalogo(ordenarLista(filtrados));
}

window.abrirProduto = abrirProduto;

document.addEventListener("DOMContentLoaded", () => {
  produtosDoCatalogo = carregarProdutosCatalogo();

  const params = new URLSearchParams(location.search);
  const buscaUrl = params.get("busca") || params.get("q") || params.get("search");
  const catUrl = params.get("categoria") || params.get("modalidade");
  const favUrl = params.get("favoritos");

  if (buscaUrl) termoBuscaAtivo = buscaUrl;
  if (catUrl) categoriaAtiva = normalizarTexto(catUrl);
  if (favUrl === "1" || favUrl === "true") apenasFavoritos = true;

  const inputBusca = document.querySelector(
    "#catalogSearchInput, #searchInput, #busca-input, #globalSearchInput, input[type='search'], input[placeholder*='Pesquisar']"
  );
  if (inputBusca) {
    if (termoBuscaAtivo) inputBusca.value = termoBuscaAtivo;
    inputBusca.addEventListener("input", e => {
      termoBuscaAtivo = e.target.value;
      aplicarFiltrosCatalogo();
    });
  }

  document
    .querySelectorAll("[data-categoria], [data-category], .filter-btn, .cat-btn, .category-pill")
    .forEach(btn => {
      btn.addEventListener("click", () => {
        const valor = normalizarTexto(
          btn.dataset.categoria || btn.dataset.category || btn.textContent
        );
        if (valor === "favoritos") {
          apenasFavoritos = !apenasFavoritos;
          btn.classList.toggle("active", apenasFavoritos);
          btn.classList.toggle("ativo", apenasFavoritos);
        } else {
          apenasFavoritos = false;
          categoriaAtiva = valor.startsWith("todo") ? "todos" : valor;
          atualizarBotoesCategoria();
        }
        aplicarFiltrosCatalogo();
      });
    });

  const selectOrdenar = document.querySelector(
    "#sort-select, #ordenar, #sort, select[aria-label*='Ordenar'], main select"
  );
  selectOrdenar?.addEventListener("change", e => {
    ordenacaoAtiva = e.target.value || e.target.options[e.target.selectedIndex]?.text || "padrao";
    aplicarFiltrosCatalogo();
  });

  atualizarBotoesCategoria();
  aplicarFiltrosCatalogo();

  if (window.CLTS) CLTS.atualizarContadorCarrinho();
});
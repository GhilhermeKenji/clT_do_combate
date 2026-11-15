/* ==========================================================
   CLTS DO COMBATE — CATALOGO.JS (Versão Otimizada & Avançada)
========================================================== */
"use strict";

const productsGrid = document.getElementById("products-grid");
const productCount = document.getElementById("product-count");
const catalogTitle = document.getElementById("catalog-title");
const searchInput = document.getElementById("search");
const sortSelect = document.getElementById("sort");
const emptyState = document.getElementById("empty-state");

const nomesCategorias = {
  todos: "Todos os produtos",
  "jiu-jitsu": "Produtos de Jiu-Jitsu",
  judo: "Produtos de Judô",
  "muay-thai": "Produtos de Muay Thai",
  boxe: "Produtos de Boxe",
  karate: "Produtos de Karatê",
  taekwondo: "Produtos de Taekwondo",
  mma: "Produtos de MMA",
  acessorios: "Acessórios"
};

let categoriaAtual = new URLSearchParams(location.search).get("modalidade")
  || new URLSearchParams(location.search).get("categoria")
  || "todos";
let produtosDoCatalogo = [];

function normalizar(texto) {
  return String(texto || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}
function formatarPreco(preco) {
  return Number(preco || 0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
}
function carregarProdutos() {
  try {
    const salvo = localStorage.getItem("clts-produtos");
    if (salvo) {
      const lista = JSON.parse(salvo);
      if (Array.isArray(lista)) return lista.map(p => ({...p, disponivel:p.disponivel !== false}));
    }
  } catch (e) { console.error(e); }
  return (typeof produtos !== "undefined" && Array.isArray(produtos))
    ? produtos.map(p => ({...p, disponivel:p.disponivel !== false})) : [];
}
function categoriaProduto(p) { return p.categoria || p.modalidade || ""; }
function nomeCategoria(c) { return nomesCategorias[c] || c || "Artes Marciais"; }
function combina(p, pesquisa) {
  const campos = [p.nome,p.descricao,categoriaProduto(p),nomeCategoria(categoriaProduto(p))];
  return campos.some(c => normalizar(c).includes(pesquisa));
}

// Gestão de Favoritos (Wishlist)
function obterFavoritos() {
  try {
    return JSON.parse(localStorage.getItem("clts-favoritos") || "[]");
  } catch { return []; }
}
function alternarFavorito(id, cat) {
  let favs = obterFavoritos();
  const index = favs.findIndex(f => String(f.id) === String(id) && String(f.categoria) === String(cat));
  if (index >= 0) {
    favs.splice(index, 1);
    mostrarMensagemCatalogo("Removido dos favoritos.");
  } else {
    favs.push({ id, categoria: cat });
    mostrarMensagemCatalogo("Adicionado aos favoritos ❤️");
  }
  localStorage.setItem("clts-favoritos", JSON.stringify(favs));
  renderizarCatalogo();
}

function filtrarProdutos() {
  let lista = [...produtosDoCatalogo];
  
  if (categoriaAtual === "favoritos") {
    const favs = obterFavoritos();
    lista = lista.filter(p => favs.some(f => String(f.id) === String(p.id) && String(f.categoria) === String(categoriaProduto(p))));
  } else if (categoriaAtual !== "todos") {
    lista = lista.filter(p => normalizar(categoriaProduto(p)) === normalizar(categoriaAtual));
  }

  const pesquisa = normalizar(searchInput?.value.trim() || "");
  if (pesquisa) lista = lista.filter(p => combina(p,pesquisa));

  const ordem = sortSelect?.value || "default";
  if (ordem === "price-low") lista.sort((a,b)=>Number(a.preco||0)-Number(b.preco||0));
  if (ordem === "price-high") lista.sort((a,b)=>Number(b.preco||0)-Number(a.preco||0));
  if (ordem === "name") lista.sort((a,b)=>normalizar(a.nome).localeCompare(normalizar(b.nome),"pt-BR"));
  return lista;
}

function renderizarCatalogo() {
  if (!productsGrid) return;
  const lista = filtrarProdutos();
  productsGrid.innerHTML = "";
  if (productCount) productCount.textContent = `${lista.length} ${lista.length === 1 ? "produto encontrado" : "produtos encontrados"}`;
  
  if (catalogTitle) {
    if (categoriaAtual === "favoritos") catalogTitle.textContent = "Meus Produtos Favoritos";
    else catalogTitle.textContent = nomeCategoria(categoriaAtual);
  }

  if (!lista.length) {
    if (emptyState) emptyState.style.display = "block";
    return;
  }
  if (emptyState) emptyState.style.display = "none";
  lista.forEach(p => productsGrid.appendChild(criarCardProduto(p)));
}

function criarCardProduto(produto) {
  const card = document.createElement("article");
  const categoria = categoriaProduto(produto);
  const disponivel = produto.disponivel !== false;
  const favs = obterFavoritos();
  const eFavorito = favs.some(f => String(f.id) === String(produto.id) && String(f.categoria) === String(categoria));

  card.className = `product-card ${disponivel ? "" : "is-unavailable"}`;
  card.dataset.id = produto.id;
  card.dataset.categoria = categoria;
  const imagem = produto.imagem || "images/logo-clts.png";

  card.innerHTML = `
    <div class="product-image">
      <img src="${imagem}" alt="${produto.nome || "Produto"}" loading="lazy">
      <span class="product-badge ${disponivel ? "" : "unavailable"}">
        ${disponivel ? "DISPONÍVEL" : "INDISPONÍVEL"}
      </span>
      <button type="button" class="fav-btn ${eFavorito ? "active" : ""}" title="Favoritar" data-fav-id="${produto.id}" data-fav-cat="${categoria}">
        ${eFavorito ? "❤️" : "🤍"}
      </button>
    </div>
    <div class="product-info">
      <span class="product-category">${nomeCategoria(categoria)}</span>
      <h3 class="product-name">${produto.nome || "Produto"}</h3>
      <div class="product-rating"><span>★★★★★</span><small>5.0</small></div>
      <strong class="product-price">${formatarPreco(produto.preco)}</strong>
      <button type="button" class="product-buy ${disponivel ? "" : "disabled"}"
        data-product-id="${produto.id}" data-product-category="${categoria}" ${disponivel ? "" : "disabled"}>
        <span>${disponivel ? "VER PRODUTO" : "INDISPONÍVEL"}</span>
        <span class="product-buy-arrow">${disponivel ? "→" : "×"}</span>
      </button>
    </div>`;

  const img = card.querySelector("img");
  img.addEventListener("error",() => { img.onerror=null; img.src="images/logo-clts.png"; });
  
  card.querySelector(".fav-btn").addEventListener("click", (e) => {
    e.stopPropagation();
    alternarFavorito(produto.id, categoria);
  });

  return card;
}

function abrirProduto(categoria,id) {
  const produto = produtosDoCatalogo.find(p => String(p.id) === String(id) && categoriaProduto(p) === categoria);
  if (!produto || produto.disponivel === false) {
    if (produto) mostrarMensagemCatalogo("Este produto está indisponível no momento.");
    return;
  }
  location.href = `produto.html?categoria=${encodeURIComponent(categoria)}&id=${encodeURIComponent(id)}`;
}

productsGrid?.addEventListener("click", e => {
  const botao = e.target.closest(".product-buy");
  if (botao) {
    if (botao.disabled) return;
    e.stopPropagation();
    abrirProduto(botao.dataset.productCategory, botao.dataset.productId);
    return;
  }
  const card = e.target.closest(".product-card");
  if (card && !card.classList.contains("is-unavailable")) {
    abrirProduto(card.dataset.categoria,card.dataset.id);
  }
});

function atualizarCategoriaAtiva() {
  document.querySelectorAll(".category-btn").forEach(btn => btn.classList.toggle("active", btn.dataset.category === categoriaAtual));
}

function mostrarMensagemCatalogo(texto) {
  let el = document.getElementById("catalog-toast");
  if (!el) { el=document.createElement("div"); el.id="catalog-toast"; el.className="global-toast"; document.body.appendChild(el); }
  el.textContent=texto; el.classList.add("show");
  clearTimeout(window.__catalogToast); window.__catalogToast=setTimeout(()=>el.classList.remove("show"),2200);
}

sortSelect?.addEventListener("change", renderizarCatalogo);

function iniciarCatalogo() {
  produtosDoCatalogo = carregarProdutos();
  const q = new URLSearchParams(location.search).get("busca") || "";
  if (searchInput && q) searchInput.value = q;
  atualizarCategoriaAtiva();
  renderizarCatalogo();
  
  searchInput?.addEventListener("input", renderizarCatalogo);
}

if (document.readyState==="loading") document.addEventListener("DOMContentLoaded",iniciarCatalogo); else iniciarCatalogo();
window.addEventListener("storage", () => { produtosDoCatalogo = carregarProdutos(); renderizarCatalogo(); });
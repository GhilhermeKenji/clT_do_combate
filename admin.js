"use strict";

/* ==========================================================
   CONFIGURAÇÃO E AUTENTICAÇÃO MASTER
========================================================== */
const ADMIN_EMAILS = [
  "guilhermecanada93@gmail.com",
  "gui.kenn1221@gmail.com"
];

const KEYS = {
  ADMIN: "clts-admin-logado",
  USER: "clts-usuario-logado",
  USERS: "clts-usuarios",
  PRODUCTS: "clts-produtos",
  ORDERS: "clts-pedidos",
  COUPONS: "clts-cupons"
};

(function verificarAcessoAdmin() {
  let user = null;
  try {
    user = JSON.parse(localStorage.getItem(KEYS.USER) || "null");
  } catch {}

  const emailLogado = String(user?.email || "").trim().toLowerCase();
  const isAdminFlag = localStorage.getItem(KEYS.ADMIN) === "true";
  const isAdminEmail = ADMIN_EMAILS.includes(emailLogado);

  if (!isAdminFlag && !isAdminEmail) {
    window.location.href = "login.html";
    return;
  }

  localStorage.setItem(KEYS.ADMIN, "true");
  const display = document.getElementById("adminEmailDisplay");
  if (display && emailLogado) {
    display.textContent = emailLogado;
  }
})();

/* ==========================================================
   ESTADO GLOBAL
========================================================== */
let listaProdutos = [];
let listaPedidos = [];
let listaUsuarios = [];
let listaCupons = [];

const $ = (id) => document.getElementById(id);

function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function esc(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function toast(msg) {
  const el = $("toast");
  if (!el) return;
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(window.__adminToastTimer);
  window.__adminToastTimer = setTimeout(() => el.classList.remove("show"), 2600);
}

/* ==========================================================
   CARREGAMENTO E PERSISTÊNCIA
========================================================== */
function obterProdutosBase() {
  if (typeof produtos !== "undefined" && Array.isArray(produtos)) return produtos;
  if (Array.isArray(window.produtos)) return window.produtos;
  return [];
}

function carregarDados() {
  try {
    const salvos = JSON.parse(localStorage.getItem(KEYS.PRODUCTS) || "[]");
    if (Array.isArray(salvos) && salvos.length > 0) {
      listaProdutos = salvos;
    } else {
      throw new Error("Vazio");
    }
  } catch {
    listaProdutos = obterProdutosBase().map((p, idx) => ({
      ...p,
      id: p.id || idx + 1,
      disponivel: p.disponivel !== false,
      estoque: p.estoque ?? 15,
      tamanhos: p.tamanhos || "P, M, G, GG",
      destaque: Boolean(p.destaque)
    }));
    salvarProdutos();
  }

  listaProdutos = listaProdutos.map((p) => ({
    ...p,
    disponivel: p.disponivel !== false,
    estoque: Number(p.estoque ?? 15)
  }));

  try {
    const ped = JSON.parse(localStorage.getItem(KEYS.ORDERS) || "[]");
    listaPedidos = Array.isArray(ped) ? ped : [];
  } catch {
    listaPedidos = [];
  }

  try {
    const usr = JSON.parse(localStorage.getItem(KEYS.USERS) || "[]");
    listaUsuarios = Array.isArray(usr) ? usr : [];
  } catch {
    listaUsuarios = [];
  }

  try {
    const cup = JSON.parse(localStorage.getItem(KEYS.COUPONS) || "null");
    if (Array.isArray(cup) && cup.length > 0) {
      listaCupons = cup;
    } else {
      listaCupons = [
        { codigo: "COMBATE10", tipo: "percent", valor: 10, ativo: true },
        { codigo: "COMBATE20", tipo: "fixed", valor: 20, ativo: true }
      ];
      salvarCupons();
    }
  } catch {
    listaCupons = [];
  }
}

function salvarProdutos() {
  localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(listaProdutos));
}
function salvarPedidos() {
  localStorage.setItem(KEYS.ORDERS, JSON.stringify(listaPedidos));
}
function salvarUsuarios() {
  localStorage.setItem(KEYS.USERS, JSON.stringify(listaUsuarios));
}
function salvarCupons() {
  localStorage.setItem(KEYS.COUPONS, JSON.stringify(listaCupons));
}

/* ==========================================================
   NAVEGAÇÃO ENTRE ABAS
========================================================== */
const TITULOS_ABAS = {
  dashboard: "Dashboard Geral",
  produtos: "Gerenciar Produtos",
  pedidos: "Pedidos & Vendas",
  clientes: "Clientes Cadastrados",
  cupons: "Cupons & Promoções",
  sistema: "Backup & Sistema"
};

window.mudarAba = function (tabName) {
  document.querySelectorAll(".nav-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.tab === tabName);
  });
  document.querySelectorAll(".tab-section").forEach((sec) => {
    sec.classList.toggle("active", sec.id === `tab-${tabName}`);
  });
  $("pageTitle").textContent = TITULOS_ABAS[tabName] || "Painel Administrativo";
  $("sidebar").classList.remove("open");
};

document.querySelectorAll(".nav-btn").forEach((btn) => {
  btn.addEventListener("click", () => mudarAba(btn.dataset.tab));
});

$("menuToggle").addEventListener("click", () => $("sidebar").classList.add("open"));
$("closeSidebar").addEventListener("click", () => $("sidebar").classList.remove("open"));

/* ==========================================================
   RENDERIZAÇÃO: DASHBOARD & CONTADORES
========================================================== */
function atualizarTudo() {
  $("navCountProdutos").textContent = listaProdutos.length;
  $("navCountPedidos").textContent = listaPedidos.length;
  $("navCountClientes").textContent = listaUsuarios.length;
  $("navCountCupons").textContent = listaCupons.length;

  renderDashboard();
  renderProdutos();
  renderPedidos();
  renderClientes();
  renderCupons();
}

function renderDashboard() {
  const pedidosValidos = listaPedidos.filter((p) => p.status !== "Cancelado");
  const receitaTotal = pedidosValidos.reduce((acc, p) => acc + Number(p.total || 0), 0);
  const ticketMedio = pedidosValidos.length ? receitaTotal / pedidosValidos.length : 0;

  const ativos = listaProdutos.filter((p) => p.disponivel !== false).length;
  const inativos = listaProdutos.length - ativos;

  $("kpiReceita").textContent = formatarMoeda(receitaTotal);
  $("kpiPedidosPagos").textContent = `${pedidosValidos.length} pedidos válidos`;
  $("kpiPedidos").textContent = listaPedidos.length;
  $("kpiTicketMedio").textContent = `Ticket médio: ${formatarMoeda(ticketMedio)}`;
  $("kpiAtivos").textContent = ativos;
  $("kpiInativos").textContent = `${inativos} indisponíveis`;
  $("kpiClientes").textContent = listaUsuarios.length;

  const recentTbody = $("dashRecentOrders");
  recentTbody.innerHTML = "";
  const recentes = [...listaPedidos].reverse().slice(0, 5);

  if (!recentes.length) {
    recentTbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:var(--muted);">Nenhum pedido registado ainda.</td></tr>`;
  } else {
    recentes.forEach((ped) => {
      const clienteNome = ped.cliente?.nome || ped.nome || "Cliente";
      const badgeClass = getStatusBadgeClass(ped.status || "Pendente");
      recentTbody.innerHTML += `
        <tr>
          <td><strong>#${esc(ped.id || ped.numero || "---")}</strong></td>
          <td>${esc(clienteNome)}</td>
          <td><strong style="color:var(--cyan);">${formatarMoeda(ped.total)}</strong></td>
          <td><span class="badge ${badgeClass}">${esc(ped.status || "Pendente")}</span></td>
        </tr>
      `;
    });
  }

  const chartBox = $("categoryChart");
  chartBox.innerHTML = "";
  const contagem = {};
  listaProdutos.forEach((p) => {
    const cat = p.categoria || "Outros";
    contagem[cat] = (contagem[cat] || 0) + 1;
  });

  const categorias = Object.entries(contagem).sort((a, b) => b[1] - a[1]);
  const maxQtd = categorias.length ? categorias[0][1] : 1;

  if (!categorias.length) {
    chartBox.innerHTML = `<p style="color:var(--muted); font-size:13px;">Sem produtos cadastrados.</p>`;
  } else {
    categorias.forEach(([cat, qtd]) => {
      const pct = Math.round((qtd / maxQtd) * 100);
      chartBox.innerHTML += `
        <div class="chart-row">
          <div class="chart-meta">
            <span>${esc(cat)}</span>
            <span style="color:var(--cyan);">${qtd} produto(s)</span>
          </div>
          <div class="chart-track">
            <div class="chart-fill" style="width:${pct}%"></div>
          </div>
        </div>
      `;
    });
  }
}

/* ==========================================================
   RENDERIZAÇÃO E AÇÕES: PRODUTOS (COM ID ÚNICO)
========================================================== */
function renderProdutos() {
  const tbody = $("productsTableBody");
  const busca = $("filterProdSearch").value.trim().toLowerCase();
  const catFiltro = $("filterProdCat").value;
  const statusFiltro = $("filterProdStatus").value;

  const filtrados = listaProdutos
    .map((p, index) => ({ ...p, __idx: index }))
    .filter((p) => {
      const matchBusca =
        !busca ||
        String(p.nome || "").toLowerCase().includes(busca) ||
        String(p.descricao || "").toLowerCase().includes(busca) ||
        String(p.id).includes(busca);
      const matchCat = !catFiltro || p.categoria === catFiltro;
      const matchStatus =
        !statusFiltro ||
        (statusFiltro === "disponivel" && p.disponivel !== false) ||
        (statusFiltro === "indisponivel" && p.disponivel === false) ||
        (statusFiltro === "destaque" && p.destaque);

      return matchBusca && matchCat && matchStatus;
    });

  tbody.innerHTML = "";
  if (!filtrados.length) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:28px; color:var(--muted);">Nenhum produto encontrado com esses filtros.</td></tr>`;
    return;
  }

  filtrados.forEach((p) => {
    const ativo = p.disponivel !== false;
    const precoAntigoHtml =
      Number(p.precoAntigo) > Number(p.preco)
        ? `<div style="font-size:11px; color:var(--muted); text-decoration:line-through;">${formatarMoeda(p.precoAntigo)}</div>`
        : "";

    tbody.innerHTML += `
      <tr>
        <td><img class="prod-thumb" src="${esc(p.imagem || "images/logo-clts.png")}" onerror="this.src='images/logo-clts.png'" alt=""></td>
        <td>
          <strong>${esc(p.nome)}</strong>
          ${p.destaque ? `<span class="badge badge-cyan" style="margin-left:6px;">DESTAQUE</span>` : ""}
          <div style="font-size:11px; color:var(--muted); margin-top:3px;">ID #${esc(p.id)} · Tam: ${esc(p.tamanhos || "Único")}</div>
        </td>
        <td>${esc(p.categoria)}</td>
        <td>
          ${precoAntigoHtml}
          <strong style="color:var(--cyan);">${formatarMoeda(p.preco)}</strong>
        </td>
        <td><strong>${p.estoque}</strong> un.</td>
        <td>
          <span class="badge ${ativo ? "badge-green" : "badge-red"}">
            ${ativo ? "Disponível" : "Indisponível"}
          </span>
        </td>
        <td>
          <div class="actions-cell">
            <button class="btn btn-outline btn-sm" onclick="abrirModalEditarProduto(${p.__idx})">Editar</button>
            <button class="btn btn-outline btn-sm" onclick="alternarDisponibilidade(${p.__idx})" title="Alternar status">
              ${ativo ? "Pausar" : "Ativar"}
            </button>
            <button class="btn btn-outline btn-sm" onclick="duplicarProduto(${p.__idx})" title="Duplicar">Duplicar</button>
            <button class="btn btn-danger btn-sm" onclick="excluirProduto(${p.__idx})">Excluir</button>
          </div>
        </td>
      </tr>
    `;
  });
}

$("filterProdSearch").addEventListener("input", renderProdutos);
$("filterProdCat").addEventListener("change", renderProdutos);
$("filterProdStatus").addEventListener("change", renderProdutos);

function abrirModalNovoProduto() {
  $("modalProductTitle").textContent = "Cadastrar Novo Produto";
  $("productForm").reset();
  $("prodEditId").value = "";
  $("prodOriginalCat").value = "";
  $("prodStock").value = 15;
  $("prodAvailable").checked = true;
  $("prodFeatured").checked = false;
  $("prodImgPreview").src = "images/logo-clts.png";
  $("productModal").classList.add("open");
}

window.abrirModalEditarProduto = function (idx) {
  const p = listaProdutos[idx];
  if (!p) return;
  $("modalProductTitle").textContent = `Editar: ${p.nome}`;
  $("prodEditId").value = p.id;
  $("prodOriginalCat").value = p.categoria;
  $("prodName").value = p.nome || "";
  $("prodCategory").value = p.categoria || "Jiu-Jitsu";
  $("prodPrice").value = p.preco || "";
  $("prodOldPrice").value = p.precoAntigo || "";
  $("prodStock").value = p.estoque ?? 15;
  $("prodSizes").value = p.tamanhos || "";
  $("prodImage").value = p.imagem || "";
  $("prodImgPreview").src = p.imagem || "images/logo-clts.png";
  $("prodDesc").value = p.descricao || "";
  $("prodAvailable").checked = p.disponivel !== false;
  $("prodFeatured").checked = Boolean(p.destaque);
  $("productModal").classList.add("open");
};

function fecharModalProduto() {
  $("productModal").classList.remove("open");
}

$("btnNovoProduto").addEventListener("click", abrirModalNovoProduto);
$("btnNovoProdutoTop").addEventListener("click", abrirModalNovoProduto);
$("closeProductModal").addEventListener("click", fecharModalProduto);
$("cancelProductModal").addEventListener("click", fecharModalProduto);

$("prodImage").addEventListener("input", (e) => {
  $("prodImgPreview").src = e.target.value.trim() || "images/logo-clts.png";
});

$("prodImageFile").addEventListener("change", (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    $("prodImage").value = reader.result;
    $("prodImgPreview").src = reader.result;
    toast("Imagem carregada com sucesso!");
  };
  reader.readAsDataURL(file);
});

$("productForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const editId = $("prodEditId").value;
  const origCat = $("prodOriginalCat").value;
  const categoria = $("prodCategory").value;

  const novoObj = {
    id: editId ? Number(editId) : Date.now(),
    categoria,
    nome: $("prodName").value.trim(),
    preco: Number($("prodPrice").value),
    precoAntigo: $("prodOldPrice").value ? Number($("prodOldPrice").value) : null,
    estoque: Number($("prodStock").value || 0),
    tamanhos: $("prodSizes").value.trim() || "P, M, G, GG",
    imagem: $("prodImage").value.trim() || "images/logo-clts.png",
    descricao: $("prodDesc").value.trim(),
    disponivel: $("prodAvailable").checked,
    destaque: $("prodFeatured").checked
  };

  if (editId) {
    const idx = listaProdutos.findIndex(
      (x) => String(x.id) === String(editId) && String(x.categoria) === String(origCat)
    );
    if (idx >= 0) {
      listaProdutos[idx] = novoObj;
    } else {
      listaProdutos.push(novoObj);
    }
    toast("Produto atualizado!");
  } else {
    listaProdutos.push(novoObj);
    toast("Novo produto cadastrado!");
  }

  salvarProdutos();
  atualizarTudo();
  fecharModalProduto();
});

window.alternarDisponibilidade = function (idx) {
  const p = listaProdutos[idx];
  if (!p) return;
  p.disponivel = p.disponivel === false;
  salvarProdutos();
  atualizarTudo();
  toast(p.disponivel ? "Produto ativado na loja." : "Produto marcado como indisponível.");
};

window.duplicarProduto = function (idx) {
  const orig = listaProdutos[idx];
  if (!orig) return;
  listaProdutos.push({
    ...orig,
    id: Date.now(),
    nome: `${orig.nome} (Cópia)`
  });
  salvarProdutos();
  atualizarTudo();
  toast("Produto duplicado!");
};

window.excluirProduto = function (idx) {
  const p = listaProdutos[idx];
  if (!p) return;
  if (!confirm(`Tem certeza que deseja excluir "${p.nome}"?`)) return;
  listaProdutos.splice(idx, 1);
  salvarProdutos();
  atualizarTudo();
  toast("Produto removido.");
};

$("btnSyncBase").addEventListener("click", () => {
  const base = obterProdutosBase();
  if (!base.length) {
    toast("Arquivo produtos.js não encontrado ou vazio.");
    return;
  }
  let adicionados = 0;
  base.forEach((b) => {
    const existe = listaProdutos.some(
      (p) => String(p.id) === String(b.id) && p.categoria === b.categoria
    );
    if (!existe) {
      listaProdutos.push({
        ...b,
        disponivel: b.disponivel !== false,
        estoque: b.estoque ?? 15,
        tamanhos: b.tamanhos || "P, M, G, GG"
      });
      adicionados++;
    }
  });
  salvarProdutos();
  atualizarTudo();
  toast(`${adicionados} produto(s) importado(s) do produtos.js.`);
});

/* ==========================================================
   RENDERIZAÇÃO E AÇÕES: PEDIDOS
========================================================== */
function getStatusBadgeClass(status) {
  const s = String(status).toLowerCase();
  if (s.includes("pago") || s.includes("entregue")) return "badge-green";
  if (s.includes("cancelado")) return "badge-red";
  if (s.includes("enviado") || s.includes("separação")) return "badge-cyan";
  return "badge-amber";
}

function renderPedidos() {
  const tbody = $("ordersTableBody");
  const busca = $("filterOrderSearch").value.trim().toLowerCase();
  const statusFiltro = $("filterOrderStatus").value;

  const filtrados = listaPedidos
    .map((ped, idx) => ({ ...ped, __idx: idx }))
    .reverse()
    .filter((ped) => {
      const idStr = String(ped.id || ped.numero || "");
      const nome = String(ped.cliente?.nome || ped.nome || "").toLowerCase();
      const email = String(ped.cliente?.email || ped.email || "").toLowerCase();
      const status = ped.status || "Pendente";

      const matchBusca = !busca || idStr.toLowerCase().includes(busca) || nome.includes(busca) || email.includes(busca);
      const matchStatus = !statusFiltro || status === statusFiltro;
      return matchBusca && matchStatus;
    });

  tbody.innerHTML = "";
  if (!filtrados.length) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:28px; color:var(--muted);">Nenhum pedido encontrado.</td></tr>`;
    return;
  }

  const opcoesStatus = ["Pendente", "Pago", "Em Separação", "Enviado", "Entregue", "Cancelado"];

  filtrados.forEach((ped) => {
    const idPed = ped.id || ped.numero || "000";
    const nome = ped.cliente?.nome || ped.nome || "Cliente";
    const email = ped.cliente?.email || ped.email || "";
    const itens = ped.itens || ped.produtos || [];
    const totalQtd = itens.reduce((acc, it) => acc + Number(it.quantidade || 1), 0);
    const statusAtual = ped.status || "Pendente";

    const optionsHtml = opcoesStatus
      .map((st) => `<option value="${st}" ${st === statusAtual ? "selected" : ""}>${st}</option>`)
      .join("");

    tbody.innerHTML += `
      <tr>
        <td><strong>#${esc(idPed)}</strong></td>
        <td style="font-size:12px; color:var(--muted);">${esc(ped.data || "Hoje")}</td>
        <td>
          <strong>${esc(nome)}</strong>
          <div style="font-size:11px; color:var(--muted);">${esc(email)}</div>
        </td>
        <td>${totalQtd} item(ns)</td>
        <td><strong style="color:var(--cyan);">${formatarMoeda(ped.total)}</strong></td>
        <td>
          <select class="select-ctrl" style="height:32px; font-size:12px;" onchange="alterarStatusPedido(${ped.__idx}, this.value)">
            ${optionsHtml}
          </select>
        </td>
        <td>
          <div class="actions-cell">
            <button class="btn btn-cyan-outline btn-sm" onclick="verDetalhesPedido(${ped.__idx})">Recibo</button>
            <button class="btn btn-danger btn-sm" onclick="excluirPedido(${ped.__idx})">Excluir</button>
          </div>
        </td>
      </tr>
    `;
  });
}

$("filterOrderSearch").addEventListener("input", renderPedidos);
$("filterOrderStatus").addEventListener("change", renderPedidos);

window.alterarStatusPedido = function (idx, novoStatus) {
  if (!listaPedidos[idx]) return;
  listaPedidos[idx].status = novoStatus;
  salvarPedidos();
  renderDashboard();
  toast(`Pedido atualizado para: ${novoStatus}`);
};

window.excluirPedido = function (idx) {
  if (!confirm("Remover este pedido do histórico?")) return;
  listaPedidos.splice(idx, 1);
  salvarPedidos();
  atualizarTudo();
  toast("Pedido excluído.");
};

window.verDetalhesPedido = function (idx) {
  const ped = listaPedidos[idx];
  if (!ped) return;
  const itens = ped.itens || ped.produtos || [];
  const nome = ped.cliente?.nome || ped.nome || "Cliente";
  const email = ped.cliente?.email || ped.email || "Não informado";
  const end = ped.endereco
    ? `${ped.endereco}, ${ped.numero || "S/N"} - ${ped.cidade || ""}/${ped.estado || ""} (CEP: ${ped.cep || ""})`
    : "Retirada / Endereço padrão";

  $("orderModalTitle").textContent = `Pedido #${ped.id || ped.numero || "---"}`;
  $("orderModalBody").innerHTML = `
    <div style="background:#030f17; padding:14px; border:1px solid var(--border); margin-bottom:14px;">
      <p><strong>Cliente:</strong> ${esc(nome)} (${esc(email)})</p>
      <p><strong>Data:</strong> ${esc(ped.data || "Não registada")} · <strong>Pagamento:</strong> ${esc(ped.pagamento || "PIX / Cartão")}</p>
      <p><strong>Entrega:</strong> ${esc(end)}</p>
      <p><strong>Status Atual:</strong> <span class="badge ${getStatusBadgeClass(ped.status || "Pendente")}">${esc(ped.status || "Pendente")}</span></p>
    </div>
    <h3 style="font-size:14px; margin-bottom:8px;">Itens do Pedido</h3>
    <table style="margin-bottom:14px;">
      <thead>
        <tr>
          <th>Produto</th>
          <th>Qtd</th>
          <th>Unitário</th>
          <th>Subtotal</th>
        </tr>
      </thead>
      <tbody>
        ${itens
          .map(
            (it) => `
          <tr>
            <td>${esc(it.nome)} ${it.tamanho ? `(${esc(it.tamanho)})` : ""}</td>
            <td>${it.quantidade || 1}</td>
            <td>${formatarMoeda(it.preco)}</td>
            <td>${formatarMoeda((it.preco || 0) * (it.quantidade || 1))}</td>
          </tr>
        `
          )
          .join("")}
      </tbody>
    </table>
    <div style="text-align:right; font-size:14px;">
      ${ped.desconto ? `<p style="color:var(--green);">Desconto (${esc(ped.cupom || "Cupom")}): -${formatarMoeda(ped.desconto)}</p>` : ""}
      <p style="font-size:18px; color:var(--cyan); margin-top:6px;"><strong>Total Pago: ${formatarMoeda(ped.total)}</strong></p>
    </div>
  `;
  $("orderModal").classList.add("open");
};

$("closeOrderModal").addEventListener("click", () => $("orderModal").classList.remove("open"));
$("closeOrderModalBtn").addEventListener("click", () => $("orderModal").classList.remove("open"));

$("btnSimularPedido").addEventListener("click", () => {
  const prodExemplo = listaProdutos[0] || { nome: "Kimono Jiu-Jitsu Pro", preco: 289.9 };
  const novoPedido = {
    id: Math.floor(100000 + Math.random() * 900000),
    data: new Date().toLocaleString("pt-BR"),
    cliente: { nome: "Atleta Teste", email: "atleta@cltscombate.com.br" },
    endereco: "Av. Paulista, 1000",
    cidade: "São Paulo",
    estado: "SP",
    cep: "01310-100",
    pagamento: "PIX",
    status: "Pago",
    itens: [{ nome: prodExemplo.nome, preco: prodExemplo.preco, quantidade: 1, tamanho: "G" }],
    total: Number(prodExemplo.preco) + 19.9
  };
  listaPedidos.push(novoPedido);
  salvarPedidos();
  atualizarTudo();
  toast("Pedido de teste gerado!");
});

/* ==========================================================
   RENDERIZAÇÃO E AÇÕES: CLIENTES
========================================================== */
function renderClientes() {
  const tbody = $("usersTableBody");
  const busca = $("filterUserSearch").value.trim().toLowerCase();

  const filtrados = listaUsuarios
    .map((u, idx) => ({ ...u, __idx: idx }))
    .filter((u) => {
      return (
        !busca ||
        String(u.nome || "").toLowerCase().includes(busca) ||
        String(u.email || "").toLowerCase().includes(busca)
      );
    });

  tbody.innerHTML = "";
  if (!filtrados.length) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:28px; color:var(--muted);">Nenhum cliente cadastrado ainda.</td></tr>`;
    return;
  }

  filtrados.forEach((u) => {
    const emailLow = String(u.email || "").trim().toLowerCase();
    const isAdmin = ADMIN_EMAILS.includes(emailLow);
    const pedidosCliente = listaPedidos.filter(
      (p) => String(p.cliente?.email || p.email || "").trim().toLowerCase() === emailLow
    );
    const totalGasto = pedidosCliente.reduce((acc, p) => acc + Number(p.total || 0), 0);

    tbody.innerHTML += `
      <tr>
        <td><strong>${esc(u.nome || "Sem nome")}</strong></td>
        <td>${esc(u.email)}</td>
        <td><span class="badge ${isAdmin ? "badge-cyan" : "badge-green"}">${isAdmin ? "ADMIN" : "CLIENTE"}</span></td>
        <td>${pedidosCliente.length}</td>
        <td><strong style="color:var(--cyan);">${formatarMoeda(totalGasto)}</strong></td>
        <td>
          ${
            isAdmin
              ? `<span style="font-size:11px; color:var(--muted);">Conta Protegida</span>`
              : `<button class="btn btn-danger btn-sm" onclick="excluirUsuario(${u.__idx})">Excluir</button>`
          }
        </td>
      </tr>
    `;
  });
}

$("filterUserSearch").addEventListener("input", renderClientes);

window.excluirUsuario = function (idx) {
  const u = listaUsuarios[idx];
  if (!u) return;
  if (!confirm(`Remover o cliente ${u.email}?`)) return;
  listaUsuarios.splice(idx, 1);
  salvarUsuarios();
  atualizarTudo();
  toast("Cliente removido.");
};

/* ==========================================================
   RENDERIZAÇÃO E AÇÕES: CUPONS
========================================================== */
function renderCupons() {
  const tbody = $("couponsTableBody");
  tbody.innerHTML = "";
  if (!listaCupons.length) {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:var(--muted);">Nenhum cupom ativo.</td></tr>`;
    return;
  }

  listaCupons.forEach((c, idx) => {
    const descTexto = c.tipo === "percent" ? `${c.valor}% OFF` : `${formatarMoeda(c.valor)} OFF`;
    tbody.innerHTML += `
      <tr>
        <td><strong style="color:var(--cyan);">${esc(c.codigo)}</strong></td>
        <td>${descTexto}</td>
        <td><span class="badge ${c.ativo ? "badge-green" : "badge-red"}">${c.ativo ? "Ativo" : "Inativo"}</span></td>
        <td>
          <div class="actions-cell">
            <button class="btn btn-outline btn-sm" onclick="alternarCupom(${idx})">${c.ativo ? "Pausar" : "Ativar"}</button>
            <button class="btn btn-danger btn-sm" onclick="excluirCupom(${idx})">Excluir</button>
          </div>
        </td>
      </tr>
    `;
  });
}

$("couponForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const codigo = $("couponCode").value.trim().toUpperCase();
  const tipo = $("couponType").value;
  const valor = Number($("couponValue").value);
  if (!codigo || valor <= 0) return;

  const existente = listaCupons.findIndex((c) => c.codigo === codigo);
  if (existente >= 0) {
    listaCupons[existente] = { codigo, tipo, valor, ativo: true };
  } else {
    listaCupons.push({ codigo, tipo, valor, ativo: true });
  }

  salvarCupons();
  atualizarTudo();
  $("couponForm").reset();
  toast(`Cupom ${codigo} salvo!`);
});

window.alternarCupom = function (idx) {
  listaCupons[idx].ativo = !listaCupons[idx].ativo;
  salvarCupons();
  atualizarTudo();
  toast("Status do cupom atualizado.");
};

window.excluirCupom = function (idx) {
  listaCupons.splice(idx, 1);
  salvarCupons();
  atualizarTudo();
  toast("Cupom excluído.");
};

/* ==========================================================
   BACKUP, EXPORTAÇÃO E LOGOUT
========================================================== */
$("btnExportBackup").addEventListener("click", () => {
  const backup = {
    dataExportacao: new Date().toISOString(),
    produtos: listaProdutos,
    pedidos: listaPedidos,
    usuarios: listaUsuarios,
    cupons: listaCupons
  };
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `backup-clts-combate-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  toast("Backup exportado com sucesso!");
});

$("inputImportBackup").addEventListener("change", (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const dados = JSON.parse(reader.result);
      if (Array.isArray(dados.produtos)) {
        listaProdutos = dados.produtos;
        salvarProdutos();
      }
      if (Array.isArray(dados.pedidos)) {
        listaPedidos = dados.pedidos;
        salvarPedidos();
      }
      if (Array.isArray(dados.usuarios)) {
        listaUsuarios = dados.usuarios;
        salvarUsuarios();
      }
      if (Array.isArray(dados.cupons)) {
        listaCupons = dados.cupons;
        salvarCupons();
      }
      atualizarTudo();
      toast("Backup restaurado com sucesso!");
    } catch {
      alert("Arquivo JSON inválido.");
    }
  };
  reader.readAsText(file);
});

$("btnResetProducts").addEventListener("click", () => {
  if (!confirm("Isso vai restaurar os produtos originais do produtos.js. Continuar?")) return;
  localStorage.removeItem(KEYS.PRODUCTS);
  carregarDados();
  atualizarTudo();
  toast("Catálogo restaurado para o padrão!");
});

$("btnClearOrders").addEventListener("click", () => {
  if (!confirm("Apagar todo o histórico de pedidos?")) return;
  listaPedidos = [];
  salvarPedidos();
  atualizarTudo();
  toast("Pedidos limpos.");
});

$("logoutBtn").addEventListener("click", () => {
  localStorage.removeItem(KEYS.ADMIN);
  localStorage.removeItem(KEYS.USER);
  window.location.href = "login.html";
});

/* INICIALIZAR */
carregarDados();
atualizarTudo();
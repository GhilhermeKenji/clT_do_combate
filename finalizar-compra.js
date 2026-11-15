/* ==========================================================
   CLTS DO COMBATE — FINALIZAR-COMPRA.JS (Completo e Corrigido)
========================================================== */
"use strict";

document.addEventListener("DOMContentLoaded", () => {
  const usuario = CLTS.obterUsuario();
  if (!usuario) {
    location.href = "login.html";
    return;
  }

  const carrinho = CLTS.carregarCarrinho();
  if (carrinho.length === 0) {
    CLTS.mostrarToast("O seu carrinho está vazio.");
    setTimeout(() => { location.href = "carrinho.html"; }, 1000);
    return;
  }

  const inputNome = document.getElementById("nome");
  const inputEmail = document.getElementById("email");
  if (inputNome && usuario.nome) inputNome.value = usuario.nome;
  if (inputEmail && usuario.email) inputEmail.value = usuario.email;

  const containerItens = document.getElementById("checkout-items");
  const elSubtotal = document.getElementById("subtotal");
  const elTotal = document.getElementById("total");
  const formatoMoeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

  let subtotal = 0;
  if (containerItens) {
    containerItens.innerHTML = "";
    carrinho.forEach(item => {
      const qtd = Number(item.quantidade || 1);
      const preco = Number(item.preco || 0);
      subtotal += preco * qtd;

      const div = document.createElement("div");
      div.className = "checkout-item-summary";
      div.innerHTML = `
        <span>${item.nome} ${item.tamanho ? `(Tam: ${item.tamanho})` : ""} x${qtd}</span>
        <span>${formatoMoeda.format(preco * qtd)}</span>
      `;
      containerItens.appendChild(div);
    });
  }

  const frete = 19.90;
  let desconto = 0;
  let cupomAplicado = null;

  function atualizarTotais() {
    const total = Math.max(0, subtotal - desconto) + frete;
    if (elSubtotal) elSubtotal.textContent = formatoMoeda.format(subtotal);
    if (elTotal) elTotal.textContent = formatoMoeda.format(total);

    const linhaDesconto = document.getElementById("desconto-linha");
    const valorDesconto = document.getElementById("desconto-valor");
    if (desconto > 0) {
      if (linhaDesconto) linhaDesconto.style.display = "flex";
      if (valorDesconto) valorDesconto.textContent = `- ${formatoMoeda.format(desconto)}`;
    } else {
      if (linhaDesconto) linhaDesconto.style.display = "none";
    }
  }

  atualizarTotais();

  const btnCupom = document.getElementById("btn-cupom");
  const inputCupom = document.getElementById("cupom-input");
  const msgCupom = document.getElementById("cupom-msg");

  btnCupom?.addEventListener("click", () => {
    const codigo = inputCupom ? inputCupom.value.trim().toUpperCase() : "";
    if (!codigo) return;

    if (codigo === "COMBATE10") {
      desconto = subtotal * 0.10;
      cupomAplicado = "COMBATE10 (10% OFF)";
      if (msgCupom) {
        msgCupom.style.color = "#00ffb3";
        msgCupom.textContent = "Cupom aplicado com sucesso (-10%)!";
      }
    } else if (codigo === "COMBATE20") {
      desconto = 20.00;
      cupomAplicado = "COMBATE20 (R$ 20 OFF)";
      if (msgCupom) {
        msgCupom.style.color = "#00ffb3";
        msgCupom.textContent = "Cupom aplicado com sucesso (-R$ 20,00)!";
      }
    } else {
      desconto = 0;
      cupomAplicado = null;
      if (msgCupom) {
        msgCupom.style.color = "#ff9d9d";
        msgCupom.textContent = "Cupom inválido ou expirado.";
      }
    }
    atualizarTotais();
  });

  const form = document.getElementById("checkout-form");
  form?.addEventListener("submit", (e) => {
    e.preventDefault();

    const totalFinal = Math.max(0, subtotal - desconto) + frete;
    const novoPedido = {
      id: Math.floor(100000 + Math.random() * 900000),
      emailUsuario: usuario.email,
      nomeCliente: inputNome ? inputNome.value : usuario.nome,
      itens: carrinho,
      subtotal,
      desconto,
      cupom: cupomAplicado,
      frete,
      total: totalFinal,
      pagamento: document.getElementById("pagamento")?.value || "Pix",
      endereco: {
        cep: document.getElementById("cep")?.value || "",
        rua: document.getElementById("endereco")?.value || "",
        numero: document.getElementById("numero")?.value || "",
        cidade: document.getElementById("cidade")?.value || "",
        estado: document.getElementById("estado")?.value || ""
      },
      data: new Date().toISOString(),
      status: "Aprovado / Processando"
    };

    try {
      const pedidosSalvos = JSON.parse(localStorage.getItem("clts-pedidos") || "[]");
      pedidosSalvos.push(novoPedido);
      localStorage.setItem("clts-pedidos", JSON.stringify(pedidosSalvos));

      localStorage.removeItem(CLTS.obterChaveCarrinho());
      CLTS.atualizarContadorCarrinho();

      CLTS.mostrarToast("Pedido realizado com sucesso!");
      setTimeout(() => {
        location.href = "perfil.html";
      }, 1200);
    } catch (err) {
      CLTS.mostrarToast("Erro ao processar o pedido. Tente novamente.");
    }
  });

  CLTS.atualizarContadorCarrinho();
});
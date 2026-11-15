/* ==========================================================
   CLTS DO COMBATE — PERFIL.JS
========================================================== */
"use strict";

document.addEventListener("DOMContentLoaded", () => {
  const usuario = CLTS.obterUsuario();
  if (!usuario) {
    location.href = "login.html";
    return;
  }

  const elNome = document.getElementById("user-name");
  const elEmail = document.getElementById("user-email");
  if (elNome) elNome.textContent = usuario.nome || "Cliente";
  if (elEmail) elEmail.textContent = usuario.email || "";

  // Renderizar Histórico de Pedidos
  const containerPedidos = document.getElementById("orders-container");
  if (containerPedidos) {
    try {
      const todosPedidos = JSON.parse(localStorage.getItem("clts-pedidos") || "[]");
      const meusPedidos = todosPedidos.filter(p => p.emailUsuario === usuario.email);

      if (meusPedidos.length === 0) {
        containerPedidos.innerHTML = `<div class="empty-orders">Ainda não realizaste nenhum pedido. Os teus pedidos aparecerão aqui assim que finalizares uma compra.</div>`;
      } else {
        containerPedidos.innerHTML = "";
        const formatoMoeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

        meusPedidos.reverse().forEach(pedido => {
          const div = document.createElement("div");
          div.className = "order-item";
          
          let itensHtml = "";
          pedido.itens.forEach(item => {
            const qtd = Number(item.quantidade || 1);
            const preco = Number(item.preco || 0);
            itensHtml += `<p>• ${item.nome} ${item.tamanho ? `(Tam: ${item.tamanho})` : ""} x${qtd} — ${formatoMoeda.format(preco * qtd)}</p>`;
          });

          div.innerHTML = `
            <div class="order-header">
              <strong>Pedido #${pedido.id}</strong>
              <span>${new Date(pedido.data).toLocaleDateString("pt-BR")} às ${new Date(pedido.data).toLocaleTimeString("pt-BR", {hour: '2-digit', minute:'2-digit'})}</span>
            </div>
            <div class="order-body">
              <p><strong>Status:</strong> <span style="color:#00ffb3">${pedido.status}</span></p>
              <p><strong>Forma de Pagamento:</strong> ${pedido.pagamento}</p>
              <p style="margin-top:8px;"><strong>Itens:</strong></p>
              ${itensHtml}
              ${pedido.cupom ? `<p style="color:#00e8ff; margin-top:6px;"><strong>Cupom aplicado:</strong> ${pedido.cupom} (-${formatoMoeda.format(pedido.desconto || 0)})</p>` : ""}
            </div>
            <div class="order-footer">
              <span style="color:#8799a4; font-size:12px;">Total com Frete (${formatoMoeda.format(pedido.frete || 19.90)}):</span>
              <span style="color:#fff; font-size:15px;">${formatoMoeda.format(pedido.total)}</span>
            </div>
          `;
          containerPedidos.appendChild(div);
        });
      }
    } catch (err) {
      containerPedidos.innerHTML = `<div class="empty-orders">Erro ao carregar os pedidos.</div>`;
    }
  }

  // Logout
  const btnLogout = document.getElementById("logout-btn");
  btnLogout?.addEventListener("click", () => {
    CLTS.terminarSessao();
    location.href = "login.html";
  });

  CLTS.atualizarContadorCarrinho();
});
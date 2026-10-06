"use strict";
const usuario=CLTS.obterUsuario();
if(!usuario){location.href="login.html";}
else{
 document.getElementById("profile-name").textContent=usuario.nome||"Cliente";
 document.getElementById("profile-email").textContent=usuario.email||"";
 document.getElementById("profile-phone").textContent=usuario.telefone||"Não informado";
 document.getElementById("avatar").textContent=(usuario.nome||"C").trim().charAt(0).toUpperCase();
 const chave=`clts-pedidos-${encodeURIComponent(String(usuario.id||usuario.email))}`;
 let pedidos=[];try{pedidos=JSON.parse(localStorage.getItem(chave)||"[]");if(!Array.isArray(pedidos))pedidos=[];}catch{}
 const box=document.getElementById("orders");
 box.innerHTML=pedidos.length?pedidos.slice().reverse().map(p=>`<div class="order"><strong>${p.numero}</strong> · ${p.status}<br>${new Date(p.data).toLocaleString("pt-BR")} · ${Number(p.total).toLocaleString("pt-BR",{style:"currency",currency:"BRL"})}</div>`).join(""):"<p style='color:#8799a4;margin-top:12px'>Você ainda não possui pedidos.</p>";
 document.getElementById("logout").addEventListener("click",()=>{localStorage.removeItem("clts-usuario-logado");localStorage.removeItem("clts-admin-logado");location.href="Index.html";});
}

// ==========================================================
// CLTS DO COMBATE
// CADASTRO DE USUÁRIO
// ==========================================================

"use strict";


// ==========================================================
// CONFIGURAÇÕES
// ==========================================================

const USERS_KEY =
  "clts-usuarios";

const LOGGED_USER_KEY =
  "clts-usuario-logado";

const ADMIN_KEY =
  "clts-admin-logado";


// ==========================================================
// ELEMENTOS
// ==========================================================

const registerForm =
  document.getElementById(
    "registerForm"
  );

const registerButton =
  document.getElementById(
    "registerButton"
  );

const successMessage =
  document.getElementById(
    "successMessage"
  );

const nameInput =
  document.getElementById(
    "name"
  );

const emailInput =
  document.getElementById(
    "email"
  );

const phoneInput =
  document.getElementById(
    "phone"
  );

const passwordInput =
  document.getElementById(
    "password"
  );

const confirmPasswordInput =
  document.getElementById(
    "confirmPassword"
  );

const termsInput =
  document.getElementById(
    "terms"
  );


// ==========================================================
// OBTER USUÁRIOS
// ==========================================================

function obterUsuarios() {

  const salvo =
    localStorage.getItem(
      USERS_KEY
    );

  if (!salvo) {
    return [];
  }

  try {

    const usuarios =
      JSON.parse(
        salvo
      );

    if (
      Array.isArray(
        usuarios
      )
    ) {

      return usuarios;

    }

  } catch (erro) {

    console.error(
      "Erro ao carregar usuários:",
      erro
    );

  }

  return [];

}


// ==========================================================
// SALVAR USUÁRIOS
// ==========================================================

function salvarUsuarios(
  usuarios
) {

  localStorage.setItem(
    USERS_KEY,
    JSON.stringify(
      Array.isArray(usuarios)
        ? usuarios
        : []
    )
  );

}


// ==========================================================
// NORMALIZAR E-MAIL
// ==========================================================

function normalizarEmail(
  email
) {

  return String(
    email || ""
  )
    .trim()
    .toLowerCase();

}


// ==========================================================
// VALIDAR E-MAIL
// ==========================================================

function emailValido(
  email
) {

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    .test(
      email
    );

}


// ==========================================================
// LIMPAR TELEFONE
// ==========================================================

function limparTelefone(
  telefone
) {

  return String(
    telefone || ""
  )
    .replace(
      /\D/g,
      ""
    );

}


// ==========================================================
// FORMATAR TELEFONE
// ==========================================================

function formatarTelefone(
  valor
) {

  let telefone =
    limparTelefone(
      valor
    )
      .slice(
        0,
        11
      );


  if (
    telefone.length <= 2
  ) {

    return telefone;

  }


  if (
    telefone.length <= 7
  ) {

    return (
      "(" +
      telefone.slice(
        0,
        2
      ) +
      ") " +
      telefone.slice(
        2
      )
    );

  }


  if (
    telefone.length <= 10
  ) {

    return (
      "(" +
      telefone.slice(
        0,
        2
      ) +
      ") " +
      telefone.slice(
        2,
        6
      ) +
      "-" +
      telefone.slice(
        6
      )
    );

  }


  return (
    "(" +
    telefone.slice(
      0,
      2
    ) +
    ") " +
    telefone.slice(
      2,
      7
    ) +
    "-" +
    telefone.slice(
      7
    )
  );

}


// ==========================================================
// MOSTRAR ERRO
// ==========================================================

function mostrarErro(
  input,
  errorId,
  mensagem
) {

  if (input) {

    input.classList.add(
      "invalid"
    );

  }


  const elemento =
    document.getElementById(
      errorId
    );


  if (elemento) {

    elemento.textContent =
      mensagem;

    elemento.classList.add(
      "show"
    );

  }

}


// ==========================================================
// LIMPAR ERRO
// ==========================================================

function limparErro(
  input,
  errorId
) {

  if (input) {

    input.classList.remove(
      "invalid"
    );

  }


  const elemento =
    document.getElementById(
      errorId
    );


  if (elemento) {

    elemento.textContent =
      "";

    elemento.classList.remove(
      "show"
    );

  }

}


// ==========================================================
// LIMPAR TODOS OS ERROS
// ==========================================================

function limparTodosErros() {

  limparErro(
    nameInput,
    "nameError"
  );

  limparErro(
    emailInput,
    "emailError"
  );

  limparErro(
    phoneInput,
    "phoneError"
  );

  limparErro(
    passwordInput,
    "passwordError"
  );

  limparErro(
    confirmPasswordInput,
    "confirmPasswordError"
  );

}


// ==========================================================
// MÁSCARA DO TELEFONE
// ==========================================================

if (phoneInput) {

  phoneInput.addEventListener(
    "input",
    () => {

      phoneInput.value =
        formatarTelefone(
          phoneInput.value
        );

      limparErro(
        phoneInput,
        "phoneError"
      );

    }
  );

}


// ==========================================================
// LIMPAR ERROS AO DIGITAR
// ==========================================================

if (nameInput) {

  nameInput.addEventListener(
    "input",
    () => {

      limparErro(
        nameInput,
        "nameError"
      );

    }
  );

}


if (emailInput) {

  emailInput.addEventListener(
    "input",
    () => {

      limparErro(
        emailInput,
        "emailError"
      );

    }
  );

}


if (passwordInput) {

  passwordInput.addEventListener(
    "input",
    () => {

      limparErro(
        passwordInput,
        "passwordError"
      );

    }
  );

}


if (confirmPasswordInput) {

  confirmPasswordInput.addEventListener(
    "input",
    () => {

      limparErro(
        confirmPasswordInput,
        "confirmPasswordError"
      );

    }
  );

}


// ==========================================================
// CADASTRO
// ==========================================================

if (registerForm) {

  registerForm.addEventListener(
    "submit",
    function(event) {

      event.preventDefault();


      limparTodosErros();


      // ====================================================
      // PEGAR DADOS
      // ====================================================

      const nome =
        nameInput
          ?.value
          .trim() ||
        "";

      const email =
        normalizarEmail(
          emailInput
            ?.value ||
          ""
        );

      const telefone =
        formatarTelefone(
          phoneInput
            ?.value ||
          ""
        );

      const senha =
        passwordInput
          ?.value ||
        "";

      const confirmarSenha =
        confirmPasswordInput
          ?.value ||
        "";

      const aceitouTermos =
        termsInput
          ?.checked ||
        false;


      let valido =
        true;


      // ====================================================
      // VALIDAR NOME
      // ====================================================

      if (
        nome.length < 3
      ) {

        mostrarErro(
          nameInput,
          "nameError",
          "Digite seu nome completo."
        );

        valido =
          false;

      }


      // ====================================================
      // VALIDAR E-MAIL
      // ====================================================

      if (!email) {

        mostrarErro(
          emailInput,
          "emailError",
          "Digite seu e-mail."
        );

        valido =
          false;

      } else if (
        !emailValido(
          email
        )
      ) {

        mostrarErro(
          emailInput,
          "emailError",
          "Digite um e-mail válido."
        );

        valido =
          false;

      }


      // ====================================================
      // VALIDAR TELEFONE
      // ====================================================

      const telefoneNumeros =
        limparTelefone(
          telefone
        );


      if (
        telefoneNumeros.length < 10
      ) {

        mostrarErro(
          phoneInput,
          "phoneError",
          "Digite um telefone válido."
        );

        valido =
          false;

      }


      // ====================================================
      // VALIDAR SENHA
      // ====================================================

      if (
        senha.length < 6
      ) {

        mostrarErro(
          passwordInput,
          "passwordError",
          "A senha deve ter pelo menos 6 caracteres."
        );

        valido =
          false;

      }


      // ====================================================
      // CONFIRMAR SENHA
      // ====================================================

      if (
        confirmarSenha !== senha
      ) {

        mostrarErro(
          confirmPasswordInput,
          "confirmPasswordError",
          "As senhas não são iguais."
        );

        valido =
          false;

      }


      // ====================================================
      // TERMOS
      // ====================================================

      if (
        !aceitouTermos
      ) {

        alert(
          "Você precisa aceitar os termos e condições."
        );

        valido =
          false;

      }


      if (!valido) {

        return;

      }


      // ====================================================
      // CARREGAR USUÁRIOS
      // ====================================================

      const usuarios =
        obterUsuarios();


      // ====================================================
      // VERIFICAR E-MAIL DUPLICADO
      // ====================================================

      const emailExiste =
        usuarios.some(
          usuario => {

            return (
              normalizarEmail(
                usuario.email
              ) ===
              email
            );

          }
        );


      if (
        emailExiste
      ) {

        mostrarErro(
          emailInput,
          "emailError",
          "Este e-mail já está cadastrado."
        );

        emailInput.focus();

        return;

      }


      // ====================================================
      // CRIAR USUÁRIO
      // ====================================================

      const novoUsuario = {

        id:
          Date.now().toString(),

        nome:
          nome,

        email:
          email,

        telefone:
          telefone,

        senha:
          senha,

        criadoEm:
          new Date().toISOString()

      };


      // ====================================================
      // ADICIONAR À LISTA
      // ====================================================

      usuarios.push(
        novoUsuario
      );


      salvarUsuarios(
        usuarios
      );


      // ====================================================
      // GARANTIR QUE NÃO É ADMIN
      // ====================================================

      localStorage.removeItem(
        ADMIN_KEY
      );


      // ====================================================
      // LOGAR AUTOMATICAMENTE
      // ====================================================

      localStorage.setItem(
        LOGGED_USER_KEY,
        JSON.stringify(
          novoUsuario
        )
      );


      // ====================================================
      // MENSAGEM
      // ====================================================

      if (successMessage) {

        successMessage.classList.add(
          "show"
        );

      }


      if (registerButton) {

        registerButton.disabled =
          true;

        registerButton.textContent =
          "Conta criada!";

      }


      // ====================================================
      // IR PARA A LOJA
      // ====================================================

      setTimeout(
        () => {

          window.location.href =
            "Index.html";

        },
        900
      );

    }
  );

}
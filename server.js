const express = require("express");
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const app = express();

app.use(express.json({ limit: "5mb" }));

const PORT = process.env.PORT || 3000;

// Pasta onde as imagens serão armazenadas
const OUTPUT_DIR = path.join(__dirname, "public", "renders");

// Cria a pasta caso ainda não exista
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// Disponibiliza os arquivos publicamente
app.use("/renders", express.static(OUTPUT_DIR));


// ======================================================
// HEALTH CHECK
// ======================================================

app.get("/", (req, res) => {
  res.json({
    status: "ok",
    service: "LawTask Social Renderer",
    version: "1.1.0"
  });
});


// ======================================================
// TEMPLATE DA ARTE
// ======================================================

function criarHTML({
  categoria = "",
  assunto = "",
  resumo = "",
  texto_arte = ""
}) {

  const textoPrincipal = texto_arte || assunto;

  return `
<!DOCTYPE html>
<html lang="pt-BR">

<head>

<meta charset="UTF-8">

<style>

* {
  box-sizing: border-box;
}

html,
body {
  margin: 0;
  padding: 0;
  width: 1080px;
  height: 1350px;
}

body {
  font-family: Arial, Helvetica, sans-serif;
  background:
    radial-gradient(
      circle at 80% 10%,
      rgba(212, 175, 55, 0.10),
      transparent 30%
    ),
    linear-gradient(
      145deg,
      #08111f,
      #0d1b2a
    );

  color: #ffffff;
}

.arte {
  width: 1080px;
  height: 1350px;

  padding: 90px;

  display: flex;
  flex-direction: column;

  position: relative;
  overflow: hidden;
}


/* detalhe decorativo */

.arte::before {
  content: "";
  position: absolute;

  width: 400px;
  height: 400px;

  border: 1px solid rgba(212, 175, 55, 0.18);
  border-radius: 50%;

  right: -180px;
  top: -100px;
}


/* MARCA */

.marca {
  display: flex;
  align-items: center;
  gap: 18px;

  font-size: 34px;
  font-weight: 700;
  letter-spacing: 1px;
}

.simbolo {
  width: 16px;
  height: 48px;

  background: #d4af37;
  border-radius: 8px;
}

.law {
  color: #ffffff;
}

.task {
  color: #d4af37;
}


/* CATEGORIA */

.categoria {
  margin-top: 150px;

  font-size: 24px;
  font-weight: 600;

  text-transform: uppercase;
  letter-spacing: 4px;

  color: #d4af37;
}


/* TEXTO PRINCIPAL */

.titulo {
  margin-top: 35px;

  max-width: 850px;

  font-size: 72px;
  line-height: 1.08;

  font-weight: 700;

  letter-spacing: -2px;
}


/* LINHA */

.linha {
  width: 110px;
  height: 6px;

  margin-top: 45px;

  background: #d4af37;

  border-radius: 5px;
}


/* RESUMO */

.resumo {
  margin-top: 45px;

  max-width: 800px;

  font-size: 32px;
  line-height: 1.45;

  color: #cbd5e1;
}


/* RODAPÉ */

.rodape {
  margin-top: auto;

  display: flex;
  justify-content: space-between;
  align-items: center;

  padding-top: 35px;

  border-top: 1px solid rgba(255,255,255,0.15);

  font-size: 22px;

  color: #94a3b8;
}

.site {
  color: #d4af37;
  font-weight: 600;
}

</style>

</head>

<body>

<div class="arte">

  <div class="marca">

    <div class="simbolo"></div>

    <div>
      <span class="law">Law</span><span class="task">Task</span>
    </div>

  </div>


  <div class="categoria">
    ${escapeHTML(categoria)}
  </div>


  <div class="titulo">
    ${escapeHTML(textoPrincipal)}
  </div>


  <div class="linha"></div>


  <div class="resumo">
    ${escapeHTML(resumo)}
  </div>


  <div class="rodape">

    <div>
      Apoio jurídico para advogados e escritórios
    </div>

    <div class="site">
      lawtask.com.br
    </div>

  </div>

</div>

</body>

</html>
`;
}


// ======================================================
// SEGURANÇA BÁSICA PARA TEXTO
// ======================================================

function escapeHTML(texto = "") {

  return String(texto)

    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


// ======================================================
// RENDER
// ======================================================

app.post("/render", async (req, res) => {

  let browser;

  try {

    const {
      categoria = "",
      assunto = "",
      resumo = "",
      formato = "unico",
      texto_arte = "",
      legenda = ""
    } = req.body;


    if (!assunto) {

      return res.status(400).json({
        success: false,
        error: "O campo 'assunto' é obrigatório."
      });

    }


    // Nome único para a imagem

    const nomeArquivo =
      `lawtask-${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 8)}.png`;


    const caminhoArquivo =
      path.join(OUTPUT_DIR, nomeArquivo);


    // Inicia Chromium

    browser = await chromium.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox"
      ]
    });


    const page = await browser.newPage({
      viewport: {
        width: 1080,
        height: 1350
      },
      deviceScaleFactor: 1
    });


    // Monta o HTML

    const html = criarHTML({
      categoria,
      assunto,
      resumo,
      texto_arte
    });


    await page.setContent(html, {
      waitUntil: "networkidle"
    });


    // Gera PNG

    await page.screenshot({
      path: caminhoArquivo,
      type: "png",
      fullPage: false
    });


    await browser.close();
    browser = null;


    // URL pública

    const protocolo =
      req.headers["x-forwarded-proto"] || req.protocol;

    const host =
      req.headers["x-forwarded-host"] || req.get("host");

    const imageUrl =
      `${protocolo}://${host}/renders/${nomeArquivo}`;


    return res.json({

      success: true,

      formato,

      image_url: imageUrl,

      legenda,

      arquivo: nomeArquivo

    });


  } catch (error) {

    console.error("Erro no renderer:", error);


    if (browser) {

      try {
        await browser.close();
      } catch (_) {}

    }


    return res.status(500).json({

      success: false,

      error: error.message

    });

  }

});


// ======================================================
// START
// ======================================================

app.listen(PORT, "0.0.0.0", () => {

  console.log(
    `LawTask Social Renderer rodando na porta ${PORT}`
  );

});

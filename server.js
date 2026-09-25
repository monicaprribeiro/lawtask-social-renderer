const express = require("express");
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const app = express();

app.use(express.json({ limit: "10mb" }));

const PORT = process.env.PORT || 3000;
const OUTPUT_DIR = path.join(__dirname, "public", "renders");

fs.mkdirSync(OUTPUT_DIR, { recursive: true });

app.use("/renders", express.static(OUTPUT_DIR));


// =====================================================
// HEALTH CHECK
// =====================================================

app.get("/", (req, res) => {
  res.json({
    status: "ok",
    service: "LawTask Social Renderer",
    version: "2.0.0"
  });
});


// =====================================================
// UTILITÁRIOS
// =====================================================

function escapeHTML(text = "") {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


function slug() {
  return `${Date.now()}-${Math.random()
    .toString(36)
    .substring(2, 8)}`;
}


// =====================================================
// TEMPLATE LAWTASK
// =====================================================

function criarHTML({
  categoria = "",
  assunto = "",
  resumo = "",
  texto_arte = "",
  formato = "unico",
  pagina = null,
  totalPaginas = null
}) {

  const isCarrossel = formato === "carrossel";

  const largura = 1080;
  const altura = isCarrossel ? 1350 : 1080;

  const titulo = texto_arte || assunto;

  const contador =
    pagina && totalPaginas
      ? `${pagina}/${totalPaginas}`
      : "";

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

  width: ${largura}px;
  height: ${altura}px;

  overflow: hidden;
}

body {
  font-family:
    Inter,
    Arial,
    Helvetica,
    sans-serif;

  background: #F5F0E7;

  color: #173D35;
}


/* =====================================================
   CONTAINER
===================================================== */

.post {

  width: ${largura}px;
  height: ${altura}px;

  position: relative;

  overflow: hidden;

  background: #F5F0E7;

  display: flex;
  flex-direction: column;
}


/* =====================================================
   FORMA ORGÂNICA SUPERIOR
===================================================== */

.curva-superior {

  position: absolute;

  width: 720px;
  height: 570px;

  top: -310px;
  right: -190px;

  border-radius:
    40% 60% 55% 45%
    / 55% 45% 55% 45%;

  background: #214F43;

  transform: rotate(-10deg);

  border: 4px solid #D5A62E;
}


/* =====================================================
   FORMA ORGÂNICA INFERIOR
===================================================== */

.curva-inferior {

  position: absolute;

  width: 600px;
  height: 500px;

  bottom: -350px;
  left: -220px;

  border-radius:
    60% 40% 55% 45%
    / 45% 55% 45% 55%;

  background: #214F43;

  border: 4px solid #D5A62E;

  transform: rotate(18deg);
}


/* =====================================================
   CABEÇALHO
===================================================== */

.header {

  position: relative;
  z-index: 5;

  padding:
    ${isCarrossel ? "62px" : "52px"}
    70px 0;

  display: flex;
  align-items: center;
  justify-content: space-between;
}


.logo {

  display: flex;
  align-items: center;

  gap: 13px;

  color: #173D35;

  font-size: 31px;

  font-weight: 800;

  letter-spacing: -1px;
}


.logo-icon {

  width: 42px;
  height: 42px;

  border-radius: 50%;

  background: #D5A62E;

  display: flex;
  align-items: center;
  justify-content: center;

  color: #173D35;

  font-size: 23px;

  font-weight: 900;
}


.logo .task {
  color: #D5A62E;
}


.contador {

  font-size: 21px;

  font-weight: 700;

  color: #F5F0E7;

  min-width: 60px;

  text-align: right;
}


/* =====================================================
   CONTEÚDO
===================================================== */

.content {

  position: relative;

  z-index: 4;

  flex: 1;

  padding:
    ${isCarrossel ? "135px" : "105px"}
    82px 80px;

  display: flex;

  flex-direction: column;

  justify-content: center;

  max-width: 970px;
}


/* =====================================================
   CATEGORIA
===================================================== */

.categoria {

  display: inline-flex;

  align-self: flex-start;

  background: #D5A62E;

  color: #173D35;

  padding: 12px 23px;

  border-radius: 30px;

  font-size: 19px;

  font-weight: 800;

  text-transform: uppercase;

  letter-spacing: 1.8px;

  margin-bottom: 32px;
}


/* =====================================================
   TÍTULO
===================================================== */

.titulo {

  color: #173D35;

  font-size:
    ${isCarrossel ? "69px" : "62px"};

  line-height: 1.04;

  font-weight: 800;

  letter-spacing: -2.5px;

  max-width: 850px;
}


/* destaque */

.titulo strong {
  color: #D5A62E;
}


/* =====================================================
   LINHA DECORATIVA
===================================================== */

.linha {

  margin-top: 38px;

  width: 110px;

  height: 7px;

  border-radius: 8px;

  background: #D5A62E;
}


/* =====================================================
   RESUMO
===================================================== */

.resumo {

  margin-top: 35px;

  color: #4C625C;

  font-size:
    ${isCarrossel ? "30px" : "27px"};

  line-height: 1.42;

  font-weight: 400;

  max-width: 790px;
}


/* =====================================================
   ELEMENTO GRÁFICO
===================================================== */

.elemento {

  position: absolute;

  right: 65px;

  bottom: ${isCarrossel ? "190px" : "150px"};

  width: 155px;
  height: 155px;

  border: 3px solid #D5A62E;

  border-radius: 32px;

  transform: rotate(10deg);

  opacity: .65;
}


.elemento::after {

  content: "";

  position: absolute;

  width: 75px;
  height: 75px;

  border-radius: 50%;

  background: #214F43;

  right: -25px;
  bottom: -25px;
}


/* =====================================================
   RODAPÉ
===================================================== */

.footer {

  position: relative;

  z-index: 6;

  height: 105px;

  background: #173D35;

  padding: 0 70px;

  display: flex;

  align-items: center;

  justify-content: space-between;

  color: #F5F0E7;
}


.footer-text {

  font-size: 20px;

  font-weight: 500;
}


.footer-site {

  color: #D5A62E;

  font-size: 21px;

  font-weight: 800;
}


/* =====================================================
   SETA DO CARROSSEL
===================================================== */

.arraste {

  position: absolute;

  right: 70px;

  bottom: 135px;

  z-index: 8;

  color: #173D35;

  font-size: 17px;

  font-weight: 700;

  display: ${isCarrossel ? "block" : "none"};
}

</style>

</head>


<body>

<div class="post">

  <div class="curva-superior"></div>

  <div class="curva-inferior"></div>


  <header class="header">

    <div class="logo">

      <div class="logo-icon">L</div>

      <div>
        Law<span class="task">Task</span>
      </div>

    </div>

    <div class="contador">
      ${escapeHTML(contador)}
    </div>

  </header>


  <main class="content">

    ${
      categoria
        ? `
        <div class="categoria">
          ${escapeHTML(categoria)}
        </div>
        `
        : ""
    }


    <div class="titulo">
      ${escapeHTML(titulo)}
    </div>


    <div class="linha"></div>


    ${
      resumo
        ? `
        <div class="resumo">
          ${escapeHTML(resumo)}
        </div>
        `
        : ""
    }

  </main>


  <div class="elemento"></div>


  ${
    isCarrossel
      ? `
      <div class="arraste">
        DESLIZE →
      </div>
      `
      : ""
  }


  <footer class="footer">

    <div class="footer-text">
      Apoio jurídico para advogados e escritórios
    </div>

    <div class="footer-site">
      lawtask.com.br
    </div>

  </footer>

</div>

</body>

</html>
`;
}


// =====================================================
// GERAR IMAGEM
// =====================================================

async function gerarImagem(browser, dados) {

  const isCarrossel =
    dados.formato === "carrossel";

  const width = 1080;

  const height =
    isCarrossel ? 1350 : 1080;


  const page = await browser.newPage({
    viewport: {
      width,
      height
    },

    deviceScaleFactor: 1
  });


  await page.setContent(
    criarHTML(dados),
    {
      waitUntil: "networkidle"
    }
  );


  const nomeArquivo =
    `lawtask-${slug()}.png`;


  const caminho =
    path.join(
      OUTPUT_DIR,
      nomeArquivo
    );


  await page.screenshot({
    path: caminho,
    type: "png",
    fullPage: false
  });


  await page.close();


  return nomeArquivo;
}


// =====================================================
// RENDER
// =====================================================

app.post("/render", async (req, res) => {

  let browser;

  try {

    const {

      categoria = "",

      assunto = "",

      resumo = "",

      formato = "unico",

      texto_arte = "",

      legenda = "",

      slides = []

    } = req.body;


    if (!assunto) {

      return res
        .status(400)
        .json({

          success: false,

          error:
            "O campo 'assunto' é obrigatório."

        });

    }


    browser = await chromium.launch({

      headless: true,

      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox"
      ]

    });


    const protocolo =
      req.headers["x-forwarded-proto"]
      || req.protocol;


    const host =
      req.headers["x-forwarded-host"]
      || req.get("host");


    // ===============================================
    // CARROSSEL COM SLIDES
    // ===============================================

    if (
      formato === "carrossel" &&
      Array.isArray(slides) &&
      slides.length > 0
    ) {

      const imagens = [];


      for (
        let i = 0;
        i < slides.length;
        i++
      ) {

        const slide = slides[i];


        const arquivo =
          await gerarImagem(
            browser,
            {

              categoria,

              assunto,

              resumo:
                slide.resumo || "",

              texto_arte:
                slide.titulo ||
                slide.texto ||
                assunto,

              formato: "carrossel",

              pagina: i + 1,

              totalPaginas:
                slides.length

            }
          );


        imagens.push({

          pagina: i + 1,

          arquivo,

          image_url:
            `${protocolo}://${host}/renders/${arquivo}`

        });

      }


      await browser.close();

      browser = null;


      return res.json({

        success: true,

        formato: "carrossel",

        quantidade:
          imagens.length,

        images: imagens,

        legenda

      });

    }


    // ===============================================
    // POST ÚNICO OU CARROSSEL AINDA SEM SLIDES
    // ===============================================

    const arquivo =
      await gerarImagem(
        browser,
        {

          categoria,

          assunto,

          resumo,

          texto_arte,

          formato

        }
      );


    await browser.close();

    browser = null;


    return res.json({

      success: true,

      formato,

      image_url:
        `${protocolo}://${host}/renders/${arquivo}`,

      arquivo,

      legenda

    });


  } catch (error) {

    console.error(
      "Erro no renderer:",
      error
    );


    if (browser) {

      try {
        await browser.close();
      } catch (_) {}

    }


    return res
      .status(500)
      .json({

        success: false,

        error:
          error.message

      });

  }

});


// =====================================================
// START
// =====================================================

app.listen(
  PORT,
  "0.0.0.0",
  () => {

    console.log(
      `LawTask Social Renderer rodando na porta ${PORT}`
    );

  }
);

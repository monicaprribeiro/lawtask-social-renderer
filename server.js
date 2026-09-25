const express = require("express");
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const app = express();

app.use(express.json({ limit: "10mb" }));
app.use(express.static("public"));

const PORT = process.env.PORT || 3000;
const PUBLIC_URL =
  process.env.PUBLIC_URL || "https://renderer.monica.dev.br";

const PUBLIC_DIR = path.join(__dirname, "public");
const RENDERS_DIR = path.join(PUBLIC_DIR, "renders");

if (!fs.existsSync(RENDERS_DIR)) {
  fs.mkdirSync(RENDERS_DIR, { recursive: true });
}

const UPLOADS_DIR = path.join(PUBLIC_DIR, "uploads");

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

/* =========================================================
   UPLOAD DE IMAGENS GERADAS PELO N8N
========================================================= */

app.post(
  "/upload",
  express.raw({
    type: ["image/png", "image/jpeg", "image/webp"],
    limit: "10mb"
  }),
  (req, res) => {
    try {
      if (!req.body || !Buffer.isBuffer(req.body) || req.body.length === 0) {
        return res.status(400).json({
          success: false,
          error: "Nenhuma imagem foi recebida."
        });
      }

      const contentType = req.headers["content-type"] || "image/png";

      const extensions = {
        "image/png": "png",
        "image/jpeg": "jpg",
        "image/webp": "webp"
      };

      const extension = extensions[contentType];

      if (!extension) {
        return res.status(415).json({
          success: false,
          error: "Formato de imagem não suportado."
        });
      }

      const filename =
        `lawtask-upload-${Date.now()}-${randomId()}.${extension}`;

      const filePath = path.join(UPLOADS_DIR, filename);

      fs.writeFileSync(filePath, req.body);

      const imageUrl =
        `${PUBLIC_URL}/uploads/${filename}`;

      console.log(
        "IMAGEM RECEBIDA DO N8N:",
        imageUrl
      );

      return res.json({
        success: true,
        arquivo: filename,
        image_url: imageUrl
      });

    } catch (error) {
      console.error("ERRO NO UPLOAD:", error);

      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
);

/* =========================================================
   UTILITÁRIOS
========================================================= */

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function randomId() {
  return crypto.randomBytes(4).toString("hex");
}

/*
  TIPOS RECEBIDOS DO N8N:

  capa
  conteudo
  fechamento

  TIPOS INTERNOS DO RENDERER:

  hero
  lista
  cards
  destaque
  final
*/

function normalizeTipo(tipo = "", slide = {}) {
  const valor = String(tipo).toLowerCase().trim();

  if (valor === "capa") {
    return "hero";
  }

  if (valor === "fechamento") {
    return "final";
  }

  if (valor === "conteudo") {
    const quantidadeItens = Array.isArray(slide.itens)
      ? slide.itens.length
      : 0;

    /*
      Alternamos o layout conforme a estrutura
      do conteúdo para evitar slides repetitivos.
    */

    if (quantidadeItens >= 4) {
      return "lista";
    }

    if (quantidadeItens >= 2) {
      return "cards";
    }

    return "destaque";
  }

  const permitidos = [
    "hero",
    "lista",
    "cards",
    "destaque",
    "final"
  ];

  return permitidos.includes(valor)
    ? valor
    : "destaque";
}

function normalizarSlide(slide = {}, fallback = {}) {
  return {
    tipo: normalizeTipo(
      slide.tipo || fallback.tipo || "destaque",
      slide
    ),

    numero:
      slide.numero ??
      fallback.numero ??
      "",

    categoria:
      slide.categoria ??
      fallback.categoria ??
      "",

    titulo:
      slide.titulo ||
      slide.texto_arte ||
      fallback.titulo ||
      fallback.texto_arte ||
      fallback.assunto ||
      "",

    subtitulo:
      slide.subtitulo ??
      fallback.subtitulo ??
      "",

    destaque:
      slide.destaque ??
      fallback.destaque ??
      "",

    texto:
      slide.texto ||
      slide.resumo ||
      fallback.texto ||
      fallback.resumo ||
      "",

    itens: Array.isArray(slide.itens)
      ? slide.itens
      : Array.isArray(fallback.itens)
        ? fallback.itens
        : [],

    imagem_url:
      slide.imagem_url ||
      fallback.imagem_url ||
      "",

    imagem_tema:
      slide.imagem_tema ||
      fallback.imagem_tema ||
      ""
  };
}

/* =========================================================
   CSS BASE
========================================================= */

function baseCss() {
  return `
    * {
      box-sizing: border-box;
    }

    html,
    body {
      margin: 0;
      padding: 0;
      width: 1080px;
      height: 1350px;
      overflow: hidden;
    }

    body {
      font-family: Arial, Helvetica, sans-serif;
      background: #f7f2e8;
      color: #073f38;
    }

    :root {
      --verde: #00483f;
      --verde2: #006052;
      --verdeEscuro: #003b34;
      --amarelo: #f2aa00;
      --creme: #f7f2e8;
      --creme2: #eee8dc;
      --branco: #ffffff;
      --texto: #073f38;
      --cinza: #536a66;
    }

    .page {
      position: relative;
      width: 1080px;
      height: 1350px;
      overflow: hidden;
      background: var(--creme);
    }

    .logo {
      position: absolute;
      top: 58px;
      left: 65px;
      width: 395px;
      max-height: 145px;
      object-fit: contain;
      object-position: left center;
      z-index: 30;
    }

    .brand-line {
      position: absolute;
      top: 190px;
      left: 68px;
      width: 95px;
      height: 7px;
      border-radius: 10px;
      background: var(--amarelo);
      z-index: 25;
    }

    .footer {
      position: absolute;
      bottom: 0;
      left: 0;
      width: 100%;
      min-height: 82px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 66px;
      background: var(--verdeEscuro);
      color: white;
      z-index: 40;
      font-size: 18px;
    }

    .footer strong {
      color: var(--amarelo);
    }

    .blob-top {
      position: absolute;
      width: 560px;
      height: 500px;
      right: -155px;
      top: -235px;
      border-radius: 42% 0 58% 60%;
      background: var(--verde);
      z-index: 2;
    }

    .number {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 132px;
      height: 132px;
      border-radius: 28px;
      background: rgba(255,255,255,.58);
      color: var(--verdeEscuro);
      font-size: 66px;
      line-height: 1;
      font-weight: 800;
    }

    .title {
      margin: 0;
      color: var(--verdeEscuro);
      font-size: 66px;
      line-height: .98;
      font-weight: 800;
      letter-spacing: -2px;
    }

    .eyebrow {
      display: inline-block;
      padding: 11px 22px;
      border-radius: 50px;
      background: var(--amarelo);
      color: var(--verdeEscuro);
      text-transform: uppercase;
      font-size: 17px;
      font-weight: 800;
      letter-spacing: 1.8px;
    }

    .photo {
      object-fit: cover;
      display: block;
    }

    .photo-placeholder {
      background:
        linear-gradient(
          135deg,
          #e9e2d4,
          #d9d0c0
        );
    }

    .list-card {
      background: rgba(255,255,255,.70);
      border-radius: 32px;
      padding: 28px 32px;
    }

    .list-item {
      display: flex;
      align-items: center;
      gap: 20px;
      margin: 17px 0;
      color: var(--texto);
      font-size: 26px;
      line-height: 1.17;
    }

    .bullet {
      flex: 0 0 54px;
      width: 54px;
      height: 54px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--amarelo);
      color: var(--verdeEscuro);
      font-weight: 900;
      font-size: 24px;
    }

    .small-label {
      color: var(--verdeEscuro);
      text-transform: uppercase;
      font-weight: 800;
      letter-spacing: 2px;
      font-size: 17px;
    }
  `;
}

/* =========================================================
   COMPONENTES
========================================================= */

function logo() {
  return `
    <img
      class="logo"
      src="/assets/logo-lawtask.png"
      alt="LawTask"
    >
    <div class="brand-line"></div>
  `;
}

function footer() {
  return `
    <div class="footer">
      <span>Apoio jurídico para advogados e escritórios</span>
      <strong>lawtask.com.br</strong>
    </div>
  `;
}

function imagem(slide, className = "photo") {
  if (!slide.imagem_url) {
    return `
      <div class="${className} photo-placeholder"></div>
    `;
  }

  return `
    <img
      class="${className}"
      src="${escapeHtml(slide.imagem_url)}"
      alt=""
    >
  `;
}

/* =========================================================
   HERO / CAPA
========================================================= */

function renderHero(slide) {
  return `
    <div class="page hero">

      ${logo()}

      <div class="hero-photo">
        ${imagem(slide, "photo hero-image")}
      </div>

      <div class="hero-curve"></div>

      <div class="hero-content">

        ${
          slide.categoria
            ? `<div class="eyebrow">${escapeHtml(slide.categoria)}</div>`
            : ""
        }

        <h1 class="hero-title">
          ${escapeHtml(slide.titulo)}
        </h1>

        ${
          slide.subtitulo
            ? `
              <div class="hero-subtitle">
                ${escapeHtml(slide.subtitulo)}
              </div>
            `
            : ""
        }

        ${
          slide.texto
            ? `
              <p class="hero-text">
                ${escapeHtml(slide.texto)}
              </p>
            `
            : ""
        }

      </div>

      <div class="hero-decoration"></div>

      ${footer()}

    </div>
  `;
}

/* =========================================================
   LISTA
========================================================= */

function renderLista(slide) {
  const itens = slide.itens
    .slice(0, 7)
    .map(
      (item, index) => `
        <div class="list-item">
          <div class="bullet">
            ${index + 1}
          </div>

          <div>
            ${escapeHtml(item)}
          </div>
        </div>
      `
    )
    .join("");

  return `
    <div class="page lista">

      ${logo()}

      <div class="lista-photo">
        ${imagem(slide, "photo lista-image")}
      </div>

      <div class="lista-shape"></div>

      <div class="lista-content">

        <div class="lista-heading">

          ${
            slide.numero
              ? `
                <div class="number">
                  ${escapeHtml(slide.numero)}
                </div>
              `
              : ""
          }

          <h1 class="title">
            ${escapeHtml(slide.titulo)}
          </h1>

        </div>

        ${
          slide.destaque
            ? `
              <div class="lista-destaque">
                ${escapeHtml(slide.destaque)}
              </div>
            `
            : ""
        }

        ${
          slide.texto
            ? `
              <div class="lista-texto">
                ${escapeHtml(slide.texto)}
              </div>
            `
            : ""
        }

        ${
          itens
            ? `
              <div class="list-card">
                ${itens}
              </div>
            `
            : ""
        }

      </div>

      ${footer()}

    </div>
  `;
}

/* =========================================================
   CARDS
========================================================= */

function renderCards(slide) {
  const cards = slide.itens
    .slice(0, 6)
    .map(
      (item, index) => `
        <div class="info-card">

          <div class="card-number">
            ${String(index + 1).padStart(2, "0")}
          </div>

          <div class="card-text">
            ${escapeHtml(item)}
          </div>

        </div>
      `
    )
    .join("");

  return `
    <div class="page cards">

      ${logo()}

      <div class="blob-top"></div>

      <div class="cards-content">

        ${
          slide.numero
            ? `
              <div class="small-label">
                ETAPA ${escapeHtml(slide.numero)}
              </div>
            `
            : ""
        }

        <h1 class="cards-title">
          ${escapeHtml(slide.titulo)}
        </h1>

        ${
          slide.destaque
            ? `
              <div class="cards-destaque">
                ${escapeHtml(slide.destaque)}
              </div>
            `
            : ""
        }

        <div class="cards-grid">
          ${cards}
        </div>

      </div>

      <div class="cards-photo">
        ${imagem(slide, "photo cards-image")}
      </div>

      ${footer()}

    </div>
  `;
}

/* =========================================================
   DESTAQUE
========================================================= */

function renderDestaque(slide) {
  return `
    <div class="page destaque">

      <div class="destaque-photo">
        ${imagem(slide, "photo destaque-image")}
      </div>

      <div class="destaque-overlay"></div>

      ${logo()}

      <div class="destaque-content">

        ${
          slide.numero
            ? `
              <div class="small-label">
                ETAPA ${escapeHtml(slide.numero)}
              </div>
            `
            : ""
        }

        <h1 class="destaque-title">
          ${escapeHtml(slide.titulo)}
        </h1>

        ${
          slide.destaque
            ? `
              <div class="destaque-highlight">
                ${escapeHtml(slide.destaque)}
              </div>
            `
            : ""
        }

        ${
          slide.texto
            ? `
              <div class="destaque-text">
                ${escapeHtml(slide.texto)}
              </div>
            `
            : ""
        }

      </div>

      ${footer()}

    </div>
  `;
}

/* =========================================================
   FINAL
========================================================= */

function renderFinal(slide) {
  return `
    <div class="page final">

      ${logo()}

      <div class="final-photo">
        ${imagem(slide, "photo final-image")}
      </div>

      <div class="final-shape"></div>

      <div class="final-content">

        ${
          slide.numero
            ? `
              <div class="number">
                ${escapeHtml(slide.numero)}
              </div>
            `
            : ""
        }

        <h1 class="final-title">
          ${escapeHtml(slide.titulo)}
        </h1>

        ${
          slide.texto
            ? `
              <div class="final-text">
                ${escapeHtml(slide.texto)}
              </div>
            `
            : ""
        }

        ${
          slide.destaque
            ? `
              <div class="final-box">

                <div class="final-check">
                  ✓
                </div>

                <div>
                  ${escapeHtml(slide.destaque)}
                </div>

              </div>
            `
            : ""
        }

      </div>

      ${footer()}

    </div>
  `;
}

/* =========================================================
   CSS DOS TEMPLATES
========================================================= */

function templateCss() {
  return `

    /* ================= HERO ================= */

    .hero-photo {
      position: absolute;
      right: 0;
      top: 0;
      width: 560px;
      height: 1268px;
      background: #ddd3c3;
      z-index: 1;
    }

    .hero-image {
      width: 100%;
      height: 100%;
    }

    .hero-curve {
      position: absolute;
      left: -170px;
      top: -90px;
      width: 930px;
      height: 1230px;
      background: var(--creme);
      border-radius: 0 50% 48% 0;
      z-index: 8;
    }

    .hero-content {
      position: absolute;
      z-index: 15;
      left: 70px;
      top: 300px;
      width: 650px;
    }

    .hero-title {
      margin: 25px 0 0;
      color: var(--verdeEscuro);
      font-size: 78px;
      line-height: .96;
      letter-spacing: -4px;
      font-weight: 900;
    }

    .hero-subtitle {
      margin-top: 30px;
      width: 590px;
      color: var(--verdeEscuro);
      font-size: 39px;
      line-height: 1.1;
    }

    .hero-text {
      width: 580px;
      margin-top: 30px;
      color: var(--texto);
      font-size: 28px;
      line-height: 1.3;
    }

    .hero-decoration {
      position: absolute;
      z-index: 12;
      left: -160px;
      bottom: 15px;
      width: 450px;
      height: 290px;
      background: var(--verde);
      border-radius: 50%;
      transform: rotate(12deg);
    }

    /* ================= LISTA ================= */

    .lista-photo {
      position: absolute;
      right: 0;
      top: 0;
      width: 440px;
      height: 1268px;
      z-index: 1;
      background: #ded6c8;
    }

    .lista-image {
      width: 100%;
      height: 100%;
    }

    .lista-shape {
      position: absolute;
      z-index: 5;
      left: -120px;
      top: -80px;
      width: 840px;
      height: 1390px;
      background: var(--creme);
      border-radius: 0 47% 43% 0;
    }

    .lista-content {
      position: absolute;
      z-index: 15;
      left: 68px;
      top: 245px;
      width: 650px;
    }

    .lista-heading {
      display: flex;
      align-items: flex-start;
      gap: 34px;
    }

    .lista-heading .title {
      width: 480px;
    }

    .lista-destaque {
      margin-top: 35px;
      width: 620px;
      font-size: 34px;
      line-height: 1.12;
      font-weight: 800;
      color: var(--verdeEscuro);
    }

    .lista-texto {
      margin-top: 20px;
      width: 620px;
      font-size: 26px;
      line-height: 1.25;
      color: var(--texto);
    }

    .lista .list-card {
      width: 620px;
      margin-top: 28px;
    }

    /* ================= CARDS ================= */

    .cards-content {
      position: absolute;
      left: 65px;
      top: 250px;
      width: 690px;
      z-index: 15;
    }

    .cards-title {
      width: 660px;
      margin: 15px 0 0;
      font-size: 65px;
      line-height: 1;
      letter-spacing: -2px;
      color: var(--verdeEscuro);
    }

    .cards-destaque {
      width: 650px;
      margin-top: 22px;
      font-size: 28px;
      line-height: 1.25;
    }

    .cards-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-top: 35px;
      width: 650px;
    }

    .info-card {
      min-height: 150px;
      padding: 23px;
      border-radius: 26px;
      background: rgba(255,255,255,.78);
    }

    .card-number {
      color: var(--amarelo);
      font-size: 28px;
      font-weight: 900;
    }

    .card-text {
      margin-top: 8px;
      color: var(--verdeEscuro);
      font-size: 23px;
      line-height: 1.15;
    }

    .cards-photo {
      position: absolute;
      z-index: 5;
      right: -80px;
      bottom: 82px;
      width: 470px;
      height: 480px;
      border-radius: 52% 0 0 0;
      overflow: hidden;
    }

    .cards-image {
      width: 100%;
      height: 100%;
    }

    /* ================= DESTAQUE ================= */

    .destaque-photo {
      position: absolute;
      inset: 0;
      z-index: 1;
      background: #d9d0c1;
    }

    .destaque-image {
      width: 100%;
      height: 100%;
    }

    .destaque-overlay {
      position: absolute;
      z-index: 3;
      inset: 0;
      background:
        linear-gradient(
          90deg,
          rgba(247,242,232,.98) 0%,
          rgba(247,242,232,.96) 47%,
          rgba(247,242,232,.45) 70%,
          rgba(247,242,232,.06) 100%
        );
    }

    .destaque-content {
      position: absolute;
      z-index: 15;
      left: 70px;
      top: 325px;
      width: 650px;
    }

    .destaque-title {
      margin: 20px 0 0;
      color: var(--verdeEscuro);
      font-size: 76px;
      line-height: .98;
      letter-spacing: -3px;
    }

    .destaque-highlight {
      margin-top: 28px;
      width: 590px;
      font-size: 34px;
      line-height: 1.15;
      font-weight: 800;
      color: var(--verdeEscuro);
    }

    .destaque-text {
      width: 600px;
      margin-top: 25px;
      font-size: 31px;
      line-height: 1.25;
    }

    /* ================= FINAL ================= */

    .final-photo {
      position: absolute;
      right: 0;
      top: 0;
      width: 510px;
      height: 1268px;
      z-index: 1;
      background: #d8d0c2;
    }

    .final-image {
      width: 100%;
      height: 100%;
    }

    .final-shape {
      position: absolute;
      left: -120px;
      top: -40px;
      width: 850px;
      height: 1370px;
      z-index: 5;
      background: var(--creme);
      border-radius: 0 50% 46% 0;
    }

    .final-content {
      position: absolute;
      left: 70px;
      top: 290px;
      width: 640px;
      z-index: 15;
    }

    .final-title {
      margin: 28px 0 0;
      color: var(--verdeEscuro);
      font-size: 67px;
      line-height: 1;
      letter-spacing: -2px;
    }

    .final-text {
      width: 590px;
      margin-top: 32px;
      font-size: 30px;
      line-height: 1.3;
    }

    .final-box {
      width: 560px;
      min-height: 135px;
      margin-top: 45px;
      padding: 25px 30px;
      display: flex;
      align-items: center;
      gap: 25px;
      border-radius: 28px;
      background: rgba(255,255,255,.78);
      font-size: 27px;
      line-height: 1.2;
    }

    .final-check {
      flex: 0 0 68px;
      width: 68px;
      height: 68px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--amarelo);
      color: white;
      font-size: 38px;
      font-weight: 900;
    }
  `;
}

/* =========================================================
   SELEÇÃO DO TEMPLATE
========================================================= */

function renderSlide(slide) {
  switch (slide.tipo) {
    case "hero":
      return renderHero(slide);

    case "lista":
      return renderLista(slide);

    case "cards":
      return renderCards(slide);

    case "final":
      return renderFinal(slide);

    case "destaque":
    default:
      return renderDestaque(slide);
  }
}

/* =========================================================
   DOCUMENTO HTML
========================================================= */

function criarDocumento(slide) {
  return `
    <!DOCTYPE html>
    <html lang="pt-BR">

      <head>
        <meta charset="UTF-8">

        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0"
        >

        <style>
          ${baseCss()}
          ${templateCss()}
        </style>
      </head>

      <body>
        ${renderSlide(slide)}
      </body>

    </html>
  `;
}

/* =========================================================
   PLAYWRIGHT
========================================================= */

async function gerarImagem(browser, slide, index = 0) {
  const page = await browser.newPage({
    viewport: {
      width: 1080,
      height: 1350
    },
    deviceScaleFactor: 1
  });

  try {
    const html = criarDocumento(slide);

    await page.setContent(html, {
      waitUntil: "networkidle",
      timeout: 30000
    });

    /*
      Converte caminhos locais das imagens para
      URLs públicas do Renderer.
    */

    await page.evaluate((publicUrl) => {
      document
        .querySelectorAll('img[src^="/"]')
        .forEach((img) => {
          img.src =
            publicUrl +
            img.getAttribute("src");
        });
    }, PUBLIC_URL);

    /*
      Aguarda logo e fotografias.
    */

    try {
      await page.waitForFunction(
        () => {
          return Array
            .from(document.images)
            .every(
              (img) =>
                img.complete &&
                img.naturalWidth > 0
            );
        },
        {
          timeout: 15000
        }
      );
    } catch {
      console.log(
        `Aviso: alguma imagem do slide ${
          index + 1
        } não terminou de carregar.`
      );
    }

    await page.waitForTimeout(500);

    const timestamp = Date.now();
    const id = randomId();

    const filename =
      `lawtask-${timestamp}-${index + 1}-${id}.png`;

    const outputPath =
      path.join(
        RENDERS_DIR,
        filename
      );

    await page.screenshot({
      path: outputPath,
      type: "png",
      fullPage: false
    });

    return {
      arquivo: filename,
      image_url:
        `${PUBLIC_URL}/renders/${filename}`
    };

  } finally {
    await page.close();
  }
}

/* =========================================================
   HEALTH CHECK
========================================================= */

app.get("/", (req, res) => {
  res.json({
    status: "ok",
    service: "LawTask Social Renderer",
    version: "2.2.0"
  });
});

/* =========================================================
   RENDER
========================================================= */

app.post("/render", async (req, res) => {
  let browser;

  try {
    const body = req.body || {};

    /*
      LOG TEMPORÁRIO.

      Isso mostrará no Coolify exatamente o que
      cada item do n8n enviou ao Renderer.
    */

    console.log(
      "BODY RECEBIDO DO N8N:",
      JSON.stringify(body, null, 2)
    );

    let slides = [];

    /*
      CASO 1:
      O n8n envia o carrossel inteiro.
    */

    if (
      Array.isArray(body.slides) &&
      body.slides.length > 0
    ) {

      slides = body.slides.map(
        (slide) =>
          normalizarSlide(
            slide,
            body
          )
      );

    } else {

      /*
        CASO 2:
        O n8n envia UM SLIDE por item.

        Não tentamos descobrir se é capa,
        conteúdo ou fechamento.

        Utilizamos exatamente body.tipo.
      */

      const slideRecebido = {
        tipo:
          body.tipo,

        numero:
          body.numero,

        categoria:
          body.categoria,

        titulo:
          body.titulo,

        subtitulo:
          body.subtitulo,

        destaque:
          body.destaque,

        texto:
          body.texto,

        itens:
          Array.isArray(body.itens)
            ? body.itens
            : [],

        imagem_url:
          body.imagem_url || "",

        imagem_tema:
          body.imagem_tema || ""
      };

      slides = [
        normalizarSlide(
          slideRecebido,
          body
        )
      ];
    }

    /*
      VALIDAÇÃO
    */

    if (!slides[0]?.titulo) {
      return res.status(400).json({
        success: false,
        error:
          "É necessário informar um título."
      });
    }

    if (slides.length > 10) {
      return res.status(400).json({
        success: false,
        error:
          "O carrossel pode possuir no máximo 10 slides."
      });
    }

    /*
      DEBUG DA NORMALIZAÇÃO
    */

    console.log(
      "SLIDES NORMALIZADOS:",
      JSON.stringify(slides, null, 2)
    );

    browser = await chromium.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage"
      ]
    });

    const resultados = [];

    for (
      let i = 0;
      i < slides.length;
      i++
    ) {
      const resultado =
        await gerarImagem(
          browser,
          slides[i],
          i
        );

      resultados.push({
        numero: i + 1,
        tipo: slides[i].tipo,
        titulo: slides[i].titulo,
        imagem_tema:
          slides[i].imagem_tema,
        ...resultado
      });
    }

    await browser.close();
    browser = null;

    /*
      RESPOSTA PARA UM SLIDE
    */

    if (resultados.length === 1) {

      const indiceSlide =
        Number(body.indice_slide);

      const totalSlides =
        Number(body.total_slides);

      return res.json({
        success: true,

        formato:
          body.formato || "unico",

        indice_slide:
          Number.isFinite(indiceSlide)
            ? indiceSlide
            : null,

        total_slides:
          Number.isFinite(totalSlides)
            ? totalSlides
            : null,

        tipo:
          resultados[0].tipo,

        image_url:
          resultados[0].image_url,

        arquivo:
          resultados[0].arquivo,

        imagem_tema:
          resultados[0].imagem_tema,

        legenda:
          body.legenda || "",

        slides:
          resultados
      });
    }

    /*
      RESPOSTA PARA CARROSSEL INTEIRO
    */

    return res.json({
      success: true,
      formato: "carrossel",
      quantidade: resultados.length,
      legenda: body.legenda || "",
      slides: resultados
    });

  } catch (error) {

    console.error(
      "Erro no LawTask Social Renderer:",
      error
    );

    if (browser) {
      try {
        await browser.close();
      } catch {}
    }

    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/* =========================================================
   START
========================================================= */

app.listen(
  PORT,
  "0.0.0.0",
  () => {
    console.log(
      `LawTask Social Renderer v2.2.0 rodando na porta ${PORT}`
    );
  }
);

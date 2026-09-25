const express = require("express");
const { chromium } = require("playwright");

const app = express();

app.use(express.json({ limit: "5mb" }));
app.use(express.static("public"));

const PORT = process.env.PORT || 3000;

// Teste simples para sabermos se o serviço está funcionando
app.get("/", (req, res) => {
  res.json({
    status: "ok",
    service: "LawTask Social Renderer",
    version: "1.0.0"
  });
});

// Receberá os dados enviados pelo n8n
app.post("/render", async (req, res) => {
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

    // Nesta primeira etapa apenas confirmamos
    // que os dados chegaram corretamente.
    // No próximo passo entra o renderizador das imagens.
    return res.json({
      success: true,
      recebido: {
        categoria,
        assunto,
        resumo,
        formato,
        texto_arte,
        legenda
      }
    });

  } catch (error) {
    console.error("Erro no renderer:", error);

    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`LawTask Social Renderer rodando na porta ${PORT}`);
});

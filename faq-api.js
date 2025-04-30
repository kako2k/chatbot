// faq-api.js (versão segura sem IA — apenas correspondência no JSON)

const express = require('express');
const cors = require('cors');
const fs = require('fs');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

let faq = [];
try {
  faq = JSON.parse(fs.readFileSync('./faq.json', 'utf8'));
} catch (err) {
  console.error('Erro ao carregar FAQ:', err);
}

function buscarResposta(perguntaUsuario) {
  const texto = perguntaUsuario.toLowerCase().trim();

  for (const item of faq) {
    if (texto.includes(item.pergunta.toLowerCase())) {
      return item.resposta;
    }
    if (item.variacoes?.some(v => texto.includes(v.toLowerCase()))) {
      return item.resposta;
    }
  }

  return null;
}

app.post('/responder', (req, res) => {
  const { pergunta } = req.body;
  const resposta = buscarResposta(pergunta);

  if (resposta) {
    res.json({ resposta });
  } else {
    res.json({
      resposta: "Essa pergunta ainda não está cadastrada no nosso sistema automático. Um de nossos atendentes irá te ajudar com isso agora mesmo."
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor FAQ sem IA ativo na porta ${PORT}`);
});

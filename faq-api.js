// faq-ai.js (IA só classifica a intenção — resposta sempre do JSON)

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const { OpenAI } = require('openai');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Carrega o conteúdo da FAQ
let faq = [];
try {
  faq = JSON.parse(fs.readFileSync('./faq.json', 'utf8'));
} catch (err) {
  console.error('Erro ao carregar FAQ:', err);
}

// Prompt apenas para identificar a pergunta base da FAQ
function construirPromptIdentificador(perguntaUsuario) {
  const perguntasListadas = faq.map((item, i) => `(${i + 1}) ${item.pergunta}`).join('\n');
  return `Você é um classificador de intenção. Receberá uma pergunta de cliente e deve identificar qual pergunta da lista abaixo mais se aproxima.

Se nenhuma pergunta corresponder, diga "0".

Perguntas disponíveis:\n${perguntasListadas}

Pergunta recebida: ${perguntaUsuario}

Responda apenas com o número correspondente.`;
}

app.post('/responder', async (req, res) => {
  const { pergunta } = req.body;
  if (!pergunta) return res.status(400).json({ erro: 'Pergunta ausente.' });

  try {
    const prompt = construirPromptIdentificador(pergunta);

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'user', content: prompt }
      ],
      temperature: 0
    });

    const index = parseInt(completion.choices[0].message.content.trim());

    if (!isNaN(index) && index > 0 && index <= faq.length) {
      return res.json({ resposta: faq[index - 1].resposta });
    } else {
      return res.json({
        resposta: "Essa pergunta ainda não está cadastrada no nosso sistema automático. Um de nossos atendentes irá te ajudar com isso agora mesmo."
      });
    }
  } catch (err) {
    console.error('Erro ao classificar:', err);
    return res.status(500).json({ erro: 'Erro ao processar sua pergunta.' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor IA classificador iniciado na porta ${PORT}`);
});

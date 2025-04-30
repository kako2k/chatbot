// faq-ai.js (corrigido com prompt seguro e interpretação semântica restrita)

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const { OpenAI } = require('openai');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

let faq = [];
try {
  faq = JSON.parse(fs.readFileSync('./faq.json', 'utf8'));
} catch (err) {
  console.error('Erro ao carregar FAQ:', err);
}

function construirPrompt(perguntaUsuario) {
  const introducao = `
Você é um atendente virtual da Glamour Limousines.
Você deve responder APENAS com base nas perguntas e respostas listadas abaixo.
Se a pergunta do cliente for uma saudação, responda educadamente.
Se a pergunta não estiver na lista, diga:
"Essa pergunta ainda não está cadastrada no nosso sistema automático. Um de nossos atendentes irá te ajudar com isso agora mesmo."

Aqui está a base de conhecimento oficial:
`;

  const corpo = faq.map((item) => {
    return `PERGUNTA: ${item.pergunta}\nVARIAÇÕES: ${(item.variacoes || []).join(' | ')}\nRESPOSTA: ${item.resposta}`;
  }).join("\n\n");

  const final = `\n\nPergunta do cliente: ${perguntaUsuario}`;

  return `${introducao}${corpo}${final}`;
}

app.post('/responder', async (req, res) => {
  const { pergunta } = req.body;
  if (!pergunta) return res.status(400).json({ erro: 'Pergunta ausente.' });

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'user',
          content: construirPrompt(pergunta)
        }
      ],
      temperature: 0.2
    });

    const resposta = completion.choices[0].message.content.trim();

    if (resposta.toLowerCase().includes('atendente')) {
      return res.json({
        resposta: "Essa pergunta ainda não está cadastrada no nosso sistema automático. Um de nossos atendentes irá te ajudar com isso agora mesmo."
      });
    }

    res.json({ resposta });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao gerar resposta com a IA.' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor com IA ativo na porta ${PORT}`);
});

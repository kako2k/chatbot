// faq-ai.js (API com OpenAI para interpretação semântica)

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const { OpenAI } = require('openai');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Carrega o conteúdo do FAQ
let faq = [];
try {
  faq = JSON.parse(fs.readFileSync('./faq.json', 'utf8'));
} catch (err) {
  console.error('Erro ao carregar FAQ:', err);
}

// Constrói o prompt com base na FAQ
function construirPrompt(perguntaUsuario) {
  const introducao = `Você é um atendente da Glamour Limousines. Use APENAS as respostas abaixo para responder perguntas dos clientes. Se não encontrar uma correspondência clara, diga que um atendente irá ajudar.`;
  const baseFaq = faq.map((item, i) => `Q${i + 1}: ${item.pergunta}\nA${i + 1}: ${item.resposta}`).join('\n\n');
  return `${introducao}\n\n${baseFaq}\n\nPergunta: ${perguntaUsuario}`;
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

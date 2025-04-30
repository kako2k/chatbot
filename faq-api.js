// faq-ai.js (versão segura com IA apenas para classificação de intenção)

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

// Constrói prompt para IA classificar a pergunta e retornar a mais próxima da FAQ
function construirPromptClassificador(perguntaUsuario) {
  const listaPerguntas = faq.map((item, i) => `(${i + 1}) ${item.pergunta}`).join('\n');
  return `Você é um classificador de perguntas para atendimento da Glamour Limousines.
Seu trabalho é receber uma pergunta de um cliente e retornar o número da pergunta mais próxima entre as listadas abaixo.
Se nenhuma pergunta for compatível, responda apenas "0".

Lista de perguntas disponíveis:
${listaPerguntas}

Pergunta do cliente: ${perguntaUsuario}

Responda apenas com o número correspondente.`;
}

app.post('/responder', async (req, res) => {
  const { pergunta } = req.body;
  if (!pergunta) return res.status(400).json({ erro: 'Pergunta ausente.' });

  try {
    const prompt = construirPromptClassificador(pergunta);

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'user', content: prompt }
      ],
      temperature: 0
    });

    const numero = parseInt(completion.choices[0].message.content.trim());

    if (!isNaN(numero) && numero > 0 && numero <= faq.length) {
      return res.json({ resposta: faq[numero - 1].resposta });
    } else {
      return res.json({
        resposta: "Essa pergunta ainda não está cadastrada no nosso sistema automático. Um de nossos atendentes irá te ajudar com isso agora mesmo."
      });
    }
  } catch (err) {
    console.error('Erro com IA:', err);
    res.status(500).json({ erro: 'Erro ao classificar pergunta.' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor com classificador de FAQ ativo na porta ${PORT}`);
});

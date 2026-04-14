export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { country, horizon } = req.body;
  if (!country || !horizon) return res.status(400).json({ error: 'Missing fields' });

  const SYSTEM_PROMPT = `Você é o ATLAS — sistema de inteligência preditiva geopolítica, climática e econômica. Analisa países com base em dados históricos reais e tendências estruturais.

Responda APENAS com JSON válido, sem markdown, sem texto fora do JSON.

Formato:
{
  "titulo": "frase curta impactante (max 8 palavras)",
  "resumo": "2-3 frases sobre o cenário geral do país nesse horizonte",
  "categorias": {
    "geopolitica": { "score": 0-100, "previsao": "2-3 frases específicas" },
    "clima": { "score": 0-100, "previsao": "2-3 frases específicas" },
    "economia": { "score": 0-100, "previsao": "2-3 frases específicas" },
    "social": { "score": 0-100, "previsao": "2-3 frases específicas" },
    "tecnologia": { "score": 0-100, "previsao": "2-3 frases específicas" }
  },
  "alertas": ["alerta 1", "alerta 2", "alerta 3"],
  "oportunidades": ["oportunidade 1", "oportunidade 2"],
  "probabilidade_instabilidade": 0-100
}

Score = risco nessa categoria (0=estável, 100=crise). Seja específico e cite fatos reais.`;

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'HTTP-Referer': process.env.SITE_URL || 'https://atlas-project.vercel.app',
        'X-Title': 'ATLAS Predictive Intelligence',
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-3.3-70b-instruct:free',
        max_tokens: 1000,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: `Análise preditiva para ${country} no horizonte de ${horizon} a partir de 2025.` }
        ],
      }),
    });

    const data = await response.json();
    if (data.error) return res.status(500).json({ error: data.error.message });

    const text = data.choices?.[0]?.message?.content || '';
    const clean = text.replace(/```json|```/g, '').trim();
    const jsonMatch = clean.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Formato de resposta inválido');
    const parsed = JSON.parse(jsonMatch[0]);
    return res.status(200).json(parsed);

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

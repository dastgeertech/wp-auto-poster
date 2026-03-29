const AI_PROVIDERS = {
  anthropic: {
    baseUrl: 'https://api.anthropic.com/v1',
    authHeader: 'x-api-key',
  },
  google: {
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    authHeader: 'X-Gemini-Key',
  },
  openai: {
    baseUrl: 'https://api.openai.com/v1',
    authHeader: 'Authorization',
  },
  groq: {
    baseUrl: 'https://api.groq.com/openai/v1',
    authHeader: 'Authorization',
  },
  mistral: {
    baseUrl: 'https://api.mistral.ai/v1',
    authHeader: 'Authorization',
  },
  xai: {
    baseUrl: 'https://api.x.ai/v1',
    authHeader: 'Authorization',
  },
};

const MODEL_DEFAULTS = {
  anthropic: 'claude-sonnet-4-5-20251120',
  google: 'gemini-2.5-flash',
  openai: 'gpt-4o',
  xai: 'grok-3',
  groq: 'llama-3.3-70b-versatile',
  mistral: 'mistral-large-latest',
};

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  const { provider, model, messages, max_tokens, temperature, contents } = req.body;

  if (!provider) {
    return res.status(400).json({ error: 'Provider is required' });
  }

  const providerConfig = AI_PROVIDERS[provider];
  if (!providerConfig) {
    return res.status(400).json({ error: `Unknown provider: ${provider}` });
  }

  const envKey = `${provider.toUpperCase()}_API_KEY`;
  const apiKey = process.env[envKey];
  if (!apiKey) {
    return res.status(500).json({ error: `${provider} API key not configured` });
  }

  try {
    let endpoint = providerConfig.baseUrl;
    let requestBody;
    const headers = {
      'Content-Type': 'application/json',
    };

    if (provider === 'anthropic') {
      endpoint += '/messages';
      requestBody = {
        model: model || MODEL_DEFAULTS[provider],
        max_tokens: max_tokens || 8192,
        temperature: temperature || 0.7,
        messages,
      };
      headers[providerConfig.authHeader] = apiKey;
      headers['anthropic-version'] = '2023-06-01';
    } else if (provider === 'google') {
      const modelName = model || MODEL_DEFAULTS[provider];
      endpoint = `${endpoint}/models/${modelName}:generateContent?key=${apiKey}`;
      requestBody = {
        contents: contents || [{ parts: messages?.map((m) => ({ text: m.content })) }],
        generationConfig: {
          temperature: temperature || 0.7,
          maxOutputTokens: max_tokens || 8192,
        },
      };
    } else {
      endpoint += '/chat/completions';
      requestBody = {
        model: model || MODEL_DEFAULTS[provider],
        messages,
        temperature: temperature || 0.7,
        max_tokens: max_tokens || 8192,
      };
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

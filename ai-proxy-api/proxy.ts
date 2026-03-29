import type { VercelRequest, VercelResponse } from '@vercel/node';

const AI_PROVIDERS: Record<string, { baseUrl: string; authHeader: string }> = {
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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  const { provider, model, messages, max_tokens, temperature, contents, generationConfig } =
    req.body;

  if (!provider) {
    return res
      .status(400)
      .json({
        error: 'Provider is required. Options: anthropic, google, openai, groq, mistral, xai',
      });
  }

  const providerConfig = AI_PROVIDERS[provider];
  if (!providerConfig) {
    return res.status(400).json({ error: `Unknown provider: ${provider}` });
  }

  const apiKey = process.env[`${provider.toUpperCase()}_API_KEY`];
  if (!apiKey) {
    return res.status(500).json({ error: `${provider} API key not configured on server` });
  }

  try {
    let endpoint = providerConfig.baseUrl;
    let requestBody: any;

    if (provider === 'anthropic') {
      endpoint += '/messages';
      requestBody = {
        model: model || 'claude-sonnet-4-5-20251120',
        max_tokens: max_tokens || 8192,
        temperature: temperature || 0.7,
        messages,
      };
    } else if (provider === 'google') {
      const modelName = model || 'gemini-2.5-flash';
      endpoint = `${endpoint}/models/${modelName}:generateContent?key=${apiKey}`;
      requestBody = {
        contents: contents || [{ parts: messages?.map((m: any) => ({ text: m.content })) }],
        generationConfig: {
          temperature: temperature || 0.7,
          maxOutputTokens: max_tokens || 8192,
          ...generationConfig,
        },
      };
    } else {
      endpoint += '/chat/completions';
      const modelDefaults: Record<string, string> = {
        openai: 'gpt-4o',
        xai: 'grok-3',
        groq: 'llama-3.3-70b-versatile',
        mistral: 'mistral-large-latest',
      };
      requestBody = {
        model: model || modelDefaults[provider] || 'gpt-4o',
        messages,
        temperature: temperature || 0.7,
        max_tokens: max_tokens || 8192,
      };
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (providerConfig.authHeader === 'Authorization') {
      headers['Authorization'] = `Bearer ${apiKey}`;
    } else if (providerConfig.authHeader === 'X-Gemini-Key') {
      headers['X-Gemini-Key'] = apiKey;
    } else {
      headers[providerConfig.authHeader] = apiKey;
    }

    if (provider === 'anthropic') {
      headers['anthropic-version'] = '2023-06-01';
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error(`${provider} API error:`, data);
      return res.status(response.status).json(data);
    }

    return res.status(200).json(data);
  } catch (error: any) {
    console.error('Proxy error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

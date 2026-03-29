# Serverless AI Proxy API

A secure Vercel Serverless API that proxies requests to multiple AI providers. This solves CORS issues and keeps API keys secure on the server.

## Supported Providers

- **Anthropic Claude** - `provider: 'anthropic'`
- **Google Gemini** - `provider: 'google'`
- **OpenAI GPT** - `provider: 'openai'`
- **Groq** - `provider: 'groq'`
- **Mistral** - `provider: 'mistral'`
- **xAI Grok** - `provider: 'xai'`

## Quick Deploy

```bash
# 1. Navigate to api folder
cd api

# 2. Deploy to Vercel
vercel --prod
```

## Environment Variables

In Vercel Dashboard → Settings → Environment Variables, add:

| Variable            | Description                 |
| ------------------- | --------------------------- |
| `ANTHROPIC_API_KEY` | Claude API key (sk-ant-...) |
| `GOOGLE_API_KEY`    | Gemini API key (AIza...)    |
| `OPENAI_API_KEY`    | OpenAI API key (sk-...)     |
| `GROQ_API_KEY`      | Groq API key (gsk\_...)     |
| `MISTRAL_API_KEY`   | Mistral API key             |
| `XAI_API_KEY`       | xAI Grok API key            |

## API Usage

### Single Unified Endpoint

```bash
POST /api/proxy
```

### Request Format

```json
{
  "provider": "anthropic",
  "model": "claude-sonnet-4-5-20251120",
  "messages": [{ "role": "user", "content": "Hello" }],
  "max_tokens": 8192,
  "temperature": 0.7
}
```

### Response Format

```json
{
  "content": [{ "text": "Hello! How can I help you?" }]
}
```

## Provider-Specific Formats

### Claude (Anthropic)

```json
{
  "provider": "anthropic",
  "model": "claude-sonnet-4-5-20251120",
  "messages": [{ "role": "user", "content": "..." }],
  "max_tokens": 8192
}
```

### Gemini (Google)

```json
{
  "provider": "google",
  "model": "gemini-2.5-flash",
  "contents": [{ "parts": [{ "text": "..." }] }],
  "temperature": 0.7
}
```

### OpenAI / Groq / Mistral / Grok

```json
{
  "provider": "openai",
  "model": "gpt-4o",
  "messages": [{ "role": "user", "content": "..." }]
}
```

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Browser    │────▶│   Vercel      │────▶│  AI Provider│
│  (Angular)  │     │  Serverless   │     │   API       │
└─────────────┘     └──────────────┘     └─────────────┘
   No API Key        Has API Keys         Response
```

## Security Features

- ✅ API keys stored ONLY on Vercel server
- ✅ Keys NEVER sent to browser
- ✅ CORS handled automatically
- ✅ HTTPS enforced
- ✅ No cold starts with Edge Runtime

## Cost

- **Vercel Hobby**: Free, 100GB bandwidth/month
- **Vercel Pro**: $20/month, 1TB bandwidth

## Troubleshooting

### CORS Errors

Make sure to deploy the API to Vercel. Local testing requires Vercel CLI.

### 500 Internal Server Error

Check that environment variables are set correctly in Vercel dashboard.

### Rate Limiting

Add rate limiting in vercel.json or use Vercel's built-in rate limiting.

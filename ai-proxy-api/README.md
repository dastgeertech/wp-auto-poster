# AI Proxy API

Deploy this API to Vercel to bypass CORS and keep API keys secure.

## Quick Deploy

```bash
cd D:\dastgeerwebsite-autopost-pro\opencode\wp-auto-poster\ai-proxy-api

npm install

vercel login
vercel --prod
```

## Environment Variables

After deployment, add these in Vercel Dashboard → Settings → Environment Variables:

| Variable            | Example Value  |
| ------------------- | -------------- |
| `ANTHROPIC_API_KEY` | `sk-ant-xxxxx` |
| `GOOGLE_API_KEY`    | `AIzaSyxxxxx`  |
| `OPENAI_API_KEY`    | `sk-xxxxx`     |
| `GROQ_API_KEY`      | `gsk_xxxxx`    |
| `MISTRAL_API_KEY`   | `xxxxx`        |
| `XAI_API_KEY`       | `xai-xxxxx`    |

## Test Your API

After adding environment variables and redeploying:

```
POST https://your-api.vercel.app/api/proxy
```

### Example Request (Claude):

```json
{
  "provider": "anthropic",
  "messages": [{ "role": "user", "content": "Hello" }]
}
```

### Example Request (OpenAI):

```json
{
  "provider": "openai",
  "messages": [{ "role": "user", "content": "Hello" }]
}
```

### Example Request (Gemini):

```json
{
  "provider": "google",
  "contents": [{ "parts": [{ "text": "Hello" }] }]
}
```

## Supported Providers

- `anthropic` - Claude
- `google` - Gemini
- `openai` - GPT-4
- `groq` - Llama
- `mistral` - Mistral
- `xai` - Grok

# AI Proxy API

A serverless API proxy for AI providers. Deploys to Vercel with zero configuration.

## Deploy

```bash
cd ai-proxy
vercel --prod
```

## Environment Variables

After deploying, add these in Vercel Dashboard → Settings → Environment Variables:

| Variable            | Description      |
| ------------------- | ---------------- |
| `ANTHROPIC_API_KEY` | Claude API key   |
| `GOOGLE_API_KEY`    | Gemini API key   |
| `OPENAI_API_KEY`    | OpenAI API key   |
| `GROQ_API_KEY`      | Groq API key     |
| `MISTRAL_API_KEY`   | Mistral API key  |
| `XAI_API_KEY`       | xAI Grok API key |

## API Usage

```
POST https://your-project.vercel.app/api/proxy
```

### Claude

```json
{
  "provider": "anthropic",
  "messages": [{ "role": "user", "content": "Hello" }]
}
```

### OpenAI

```json
{
  "provider": "openai",
  "messages": [{ "role": "user", "content": "Hello" }]
}
```

### Gemini

```json
{
  "provider": "google",
  "contents": [{ "parts": [{ "text": "Hello" }] }]
}
```

### Groq

```json
{
  "provider": "groq",
  "messages": [{ "role": "user", "content": "Hello" }]
}
```

### Mistral

```json
{
  "provider": "mistral",
  "messages": [{ "role": "user", "content": "Hello" }]
}
```

### Grok

```json
{
  "provider": "xai",
  "messages": [{ "role": "user", "content": "Hello" }]
}
```

## Supported Providers

- `anthropic` - Claude ( Sonnet 4.5, Haiku 4.5, Opus 4.6 )
- `google` - Gemini ( 2.5 Flash, 2.5 Pro )
- `openai` - GPT-4o, GPT-4 Turbo
- `groq` - Llama 3.3 70B, Mixtral
- `mistral` - Mistral Large, Codestral
- `xai` - Grok 3, Grok 2

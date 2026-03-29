# AI Proxy API

## Deploy to Vercel

### 1. Download this folder (final-api)

### 2. Create new project on Vercel

- Go to vercel.com/new
- Import this folder

### 3. Add Environment Variables

In Vercel Dashboard → Settings → Environment Variables:

| Name              | Value            |
| ----------------- | ---------------- |
| ANTHROPIC_API_KEY | your-claude-key  |
| GOOGLE_API_KEY    | your-gemini-key  |
| OPENAI_API_KEY    | your-openai-key  |
| GROQ_API_KEY      | your-groq-key    |
| MISTRAL_API_KEY   | your-mistral-key |
| XAI_API_KEY       | your-grok-key    |

### 4. Deploy

Click **Deploy**

### 5. Test

```
https://your-project.vercel.app/api/proxy
```

## API Usage

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

# Auto Deploy Setup Guide

## Project Structure

```
wp-auto-poster/
├── ai-proxy/          # AI Proxy API (deploys separately)
│   ├── api/
│   │   └── proxy.js
│   ├── package.json
│   └── README.md
├── src/               # Angular App
├── .github/workflows/ # Auto-deploy configs
└── vercel.json
```

## Step 1: Deploy AI Proxy

```bash
cd ai-proxy
vercel --prod
```

After deploying, add Environment Variables in Vercel Dashboard:

- `ANTHROPIC_API_KEY`
- `GOOGLE_API_KEY`
- `OPENAI_API_KEY`
- `GROQ_API_KEY`
- `MISTRAL_API_KEY`
- `XAI_API_KEY`

## Step 2: Update Angular App

Edit `src/app/core/services/serverless.service.ts`:

```typescript
private baseUrl: string = 'https://your-ai-proxy-url.vercel.app';
```

## Step 3: Setup GitHub Secrets

Go to GitHub repo → Settings → Secrets:

| Secret                       | Description            |
| ---------------------------- | ---------------------- |
| `VERCEL_TOKEN`               | Vercel account token   |
| `VERCEL_ORG_ID`              | Vercel organization ID |
| `VERCEL_AI_PROXY_PROJECT_ID` | AI Proxy project ID    |
| `VERCEL_APP_PROJECT_ID`      | Angular app project ID |

## Auto-Deploy Flow

- Push to `ai-proxy/**` → Deploys AI Proxy API
- Push to any other file → Deploys Angular App

## Manual Deploy

```bash
# AI Proxy
cd ai-proxy && vercel --prod

# Angular App
cd .. && vercel --prod
```

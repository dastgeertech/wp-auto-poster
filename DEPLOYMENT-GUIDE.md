# Auto Deploy Setup Guide

## Prerequisites

1. GitHub account
2. Vercel account linked to GitHub

## Step 1: Get Vercel Tokens

### 1.1 Get Vercel Token

1. Go to [vercel.com/account/tokens](https://vercel.com/account/tokens)
2. Create new token with name "GitHub-Actions"
3. Copy the token

### 1.2 Get Organization ID

```bash
npm i -g vercel
vercel link
# This will show your org ID
```

### 1.3 Get Project IDs

1. Go to Vercel Dashboard
2. Create two projects:
   - `wp-auto-poster` (for Angular app)
   - `ai-proxy` (for AI Proxy API)
3. Copy Project IDs from project settings

## Step 2: Add GitHub Secrets

Go to GitHub repo → Settings → Secrets and add:

| Secret Name                  | Value                  |
| ---------------------------- | ---------------------- |
| `VERCEL_TOKEN`               | Your Vercel token      |
| `VERCEL_ORG_ID`              | Your organization ID   |
| `VERCEL_AI_PROXY_PROJECT_ID` | AI Proxy project ID    |
| `VERCEL_APP_PROJECT_ID`      | Angular app project ID |

## Step 3: Add Environment Variables to Vercel AI Proxy

Go to Vercel → AI Proxy project → Settings → Environment Variables:

```
ANTHROPIC_API_KEY = your-claude-key
GOOGLE_API_KEY = your-gemini-key
OPENAI_API_KEY = your-openai-key
GROQ_API_KEY = your-groq-key
MISTRAL_API_KEY = your-mistral-key
XAI_API_KEY = your-grok-key
```

## Step 4: Update Serverless Service

Edit `src/app/core/services/serverless.service.ts`:

```typescript
private baseUrl: string = 'https://ai-proxy-xxxxx.vercel.app';
```

Replace with your actual AI Proxy URL.

## Step 5: Push to GitHub

```bash
git add .
git commit -m "Setup auto-deploy"
git push origin main
```

## Auto-Deploy Flow

### AI Proxy API Deploys:

- Triggered when you push changes to `final-api/**`
- Automatically deploys to Vercel

### Angular App Deploys:

- Triggered when you push changes to any file except `final-api/**`
- Automatically deploys to Vercel

## Manual Deploy (Alternative)

If you prefer manual deploys, run:

```bash
# Deploy AI Proxy
cd final-api
vercel --prod

# Deploy Angular App
cd ..
vercel --prod
```

## Troubleshooting

### Vercel Token Error

Make sure the token has proper permissions.

### Project Not Found

Verify the Project IDs are correct in GitHub secrets.

### API Keys Not Working

Make sure environment variables are set in Vercel dashboard for AI Proxy project.

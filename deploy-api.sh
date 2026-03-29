#!/bin/bash

echo "==================================="
echo "Deploying AI Proxy API..."
echo "==================================="

cd final-api
vercel --prod --yes

echo ""
echo "==================================="
echo "AI Proxy deployed!"
echo "==================================="
echo ""
echo "Next steps:"
echo "1. Go to Vercel Dashboard → ai-proxy project"
echo "2. Add Environment Variables:"
echo "   - ANTHROPIC_API_KEY"
echo "   - GOOGLE_API_KEY"
echo "   - OPENAI_API_KEY"
echo "   - GROQ_API_KEY"
echo "   - MISTRAL_API_KEY"
echo "   - XAI_API_KEY"
echo "3. Redeploy the project"
echo "4. Copy the URL (e.g., https://ai-proxy-xxxx.vercel.app)"
echo "5. Update serverless.service.ts with the URL"
echo "6. Deploy the Angular app"

#!/bin/bash

# Deploy to GitHub Pages Script
# Usage: ./deploy.sh <github-username> <repository-name>

set -e

echo "=========================================="
echo "  Deploying to GitHub Pages"
echo "=========================================="

# Get inputs
GITHUB_USERNAME=${1:-}
REPO_NAME=${2:-}

if [ -z "$GITHUB_USERNAME" ] || [ -z "$REPO_NAME" ]; then
    echo "Usage: ./deploy.sh <github-username> <repository-name>"
    echo "Example: ./deploy.sh myusername wp-auto-poster"
    exit 1
fi

# Build for GitHub Pages
echo "Building for GitHub Pages..."
npm run build:github

# Deploy using angular-cli-ghpages
echo "Deploying to GitHub Pages..."
npx angular-cli-ghpages --dir=dist/wp-auto-poster/browser --no-silent --branch=gh-pages

echo ""
echo "=========================================="
echo "  Deployment Complete!"
echo "=========================================="
echo "Your app is now live at:"
echo "https://$GITHUB_USERNAME.github.io/$REPO_NAME/"

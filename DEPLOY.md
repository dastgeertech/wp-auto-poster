# WP Auto Poster - Deployment Guide

## Local Deployment (Manual)

### Prerequisites

- Node.js 18+
- npm

### Build and Deploy

```bash
# Install dependencies
npm install

# Build for production
npm run build:prod

# Deploy to GitHub Pages
npm run deploy
```

### Using the Deploy Script

```bash
# Make the script executable
chmod +x deploy.sh

# Deploy (replace with your GitHub username and repo name)
./deploy.sh yourusername wp-auto-poster
```

## GitHub Pages Deployment (Automatic)

### Setup GitHub Pages

1. Go to your repository on GitHub
2. Navigate to **Settings** > **Pages**
3. Under "Build and deployment":
   - Source: **GitHub Actions**
4. Commit and push the changes
5. The workflow will automatically deploy on every push to `main`

### Manual Trigger

Go to **Actions** tab > **Deploy to GitHub Pages** > **Run workflow**

## Alternative: Deploy to Subdirectory

If deploying to `https://username.github.io/repo-name/`:

```bash
npm run build:github
npx angular-cli-ghpages --dir=dist/wp-auto-poster/browser --no-silent
```

## Files Created

- `.github/workflows/deploy.yml` - GitHub Actions workflow
- `deploy.sh` - Shell script for manual deployment

## Notes

- The app will be available at: `https://[username].github.io/[repo-name]/`
- GitHub Pages must be enabled in repository settings
- For private repos, GitHub Pro+ is required for Pages

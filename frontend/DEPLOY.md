# Deployment Guide

## Quick Deploy Options

### Option 1: Vercel (Recommended - Easiest)

1. **Push your code to GitHub** (if not already):
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push
   ```

2. **Deploy to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Sign in with GitHub
   - Click "Add New Project"
   - Import your repository
   - **Important**: Set "Root Directory" to `frontend`
   - Click "Deploy"

3. **Configure Environment Variables** (if needed):
   - In Vercel project settings, add `VITE_CROSSMINT_API_KEY` if you have one

4. **Update your manifest**:
   - After deployment, update `frontend/public/.well-known/farcaster.json` with your actual domain
   - Update `frontend/index.html` meta tags with your domain
   - Commit and push - Vercel will auto-deploy

### Option 2: Netlify

1. **Push your code to GitHub**

2. **Deploy to Netlify**:
   - Go to [netlify.com](https://netlify.com)
   - Sign in with GitHub
   - Click "Add new site" → "Import an existing project"
   - Select your repository
   - **Build settings**:
     - Base directory: `frontend`
     - Build command: `npm run build`
     - Publish directory: `frontend/dist`
   - Click "Deploy site"

3. **Configure Environment Variables**:
   - Site settings → Environment variables
   - Add `VITE_CROSSMINT_API_KEY` if needed

### Option 3: Cloudflare Pages

1. **Push your code to GitHub**

2. **Deploy to Cloudflare Pages**:
   - Go to [dash.cloudflare.com](https://dash.cloudflare.com)
   - Pages → Create a project
   - Connect your Git repository
   - **Build settings**:
     - Framework preset: Vite
     - Build command: `npm run build`
     - Build output directory: `dist`
     - Root directory: `frontend`

### Option 4: Surge.sh (Command Line - Fastest for Testing)

1. **Install Surge**:
   ```bash
   npm install -g surge
   ```

2. **Build and deploy**:
   ```bash
   cd frontend
   npm run build
   cd dist
   surge
   ```
   - Follow the prompts to create an account and deploy
   - You'll get a URL like `your-app-name.surge.sh`

## After Deployment

1. **Update manifest file** (`frontend/public/.well-known/farcaster.json`):
   - Replace `https://your-domain.com` with your actual deployment URL
   - Add your Base account address to `baseBuilder.ownerAddress`
   - Update `accountAssociation.payload` with your verification payload

2. **Update HTML meta tags** (`frontend/index.html`):
   - Replace `https://your-domain.com` with your actual deployment URL

3. **Redeploy** after making these changes

## Testing Locally

Before deploying, test the production build locally:
```bash
cd frontend
npm run build
npm run preview
```

This will serve the built app at `http://localhost:4173`


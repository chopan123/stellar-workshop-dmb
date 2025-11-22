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

### Option 2: Netlify (✅ Fully Configured)

1. **Push your code to GitHub**

2. **Deploy to Netlify**:
   - Go to [netlify.com](https://netlify.com)
   - Sign in with GitHub
   - Click "Add new site" → "Import an existing project"
   - Select your repository
   - **Netlify will auto-detect the `netlify.toml` config!**
   - If manual setup needed:
     - Base directory: `frontend` (or leave empty if using root `netlify.toml`)
     - Build command: `npm run build`
     - Publish directory: `frontend/dist`
   - Click "Deploy site"

3. **Configure Environment Variables**:
   - Site settings → Environment variables
   - Add `VITE_CROSSMINT_API_KEY` if needed
   - **Important**: Add `SECRETS_SCAN_OMIT_KEYS` with value `VITE_CROSSMINT_API_KEY`
     - This tells Netlify to ignore this key in secrets scanning
     - `VITE_CROSSMINT_API_KEY` is a public client-side API key (expected in build output)
     - Without this, builds will fail due to secrets scanning detecting it in the bundle

**Note**: Two `netlify.toml` files are provided:
- Root level (`/netlify.toml`) - for deploying from repository root
- Frontend level (`/frontend/netlify.toml`) - for deploying from frontend directory

Both include:
- ✅ SPA routing support (all routes → index.html)
- ✅ `.well-known` directory headers for Farcaster manifest
- ✅ Static asset caching
- ✅ Security headers

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


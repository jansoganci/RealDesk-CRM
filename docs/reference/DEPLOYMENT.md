# Deployment Guide

This guide covers deploying the Real Estate CRM application to various platforms.

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Build Preparation](#build-preparation)
- [Environment Variables](#environment-variables)
- [Deployment Platforms](#deployment-platforms)
  - [Vercel](#vercel)
  - [Netlify](#netlify)
  - [Supabase Hosting](#supabase-hosting)
  - [GitHub Pages](#github-pages)
  - [AWS S3 + CloudFront](#aws-s3--cloudfront)
  - [Docker](#docker)
- [Post-Deployment](#post-deployment)
- [Troubleshooting](#troubleshooting)

## Prerequisites

Before deploying, ensure you have:

1. **Supabase Project** set up with:
   - Database migrations applied
   - Storage buckets configured
   - RLS policies enabled
   - Authentication enabled

2. **Environment Variables** ready:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

3. **Build Dependencies**:
   - Node.js 18.x or higher
   - npm 9.x or higher

## Build Preparation

### 1. Update Version

Update version in `package.json` if needed:

```json
{
  "version": "1.0.0"
}
```

### 2. Test Build Locally

```bash
# Install dependencies
npm install

# Run type checking
npm run typecheck

# Run linting
npm run lint

# Build for production
npm run build

# Test production build locally
npm run preview
```

### 3. Verify Build Output

The build creates a `dist/` folder with:
- `index.html` - Entry point
- `assets/` - JavaScript and CSS bundles
- `manifest.json` - PWA manifest
- Static files from `public/`

## Environment Variables

### Production Environment Variables

Create a `.env.production` file or set in your deployment platform:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

**Important**: 
- Never commit `.env.production` to version control
- Use your production Supabase project credentials
- The `VITE_` prefix is required for Vite to expose these variables

### Getting Supabase Credentials

1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **API**
3. Copy:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon/public key** → `VITE_SUPABASE_ANON_KEY`

## Deployment Platforms

### Vercel

Vercel provides zero-config deployment for React applications.

#### Steps

1. **Install Vercel CLI** (optional):
   ```bash
   npm i -g vercel
   ```

2. **Deploy via CLI**:
   ```bash
   vercel
   ```

3. **Deploy via Dashboard**:
   - Connect your GitHub repository
   - Import project
   - Configure build settings:
     - **Build Command**: `npm run build`
     - **Output Directory**: `dist`
     - **Install Command**: `npm install`

4. **Set Environment Variables**:
   - Go to Project Settings → Environment Variables
   - Add `VITE_SUPABASE_URL`
   - Add `VITE_SUPABASE_ANON_KEY`

5. **Deploy**

#### Vercel Configuration

Create `vercel.json` (optional):

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "devCommand": "npm run dev",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### Netlify

Netlify offers continuous deployment from Git.

#### Steps

1. **Connect Repository**:
   - Sign in to Netlify
   - Click "New site from Git"
   - Connect your repository

2. **Configure Build Settings**:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
   - **Base directory**: `.` (root)

3. **Set Environment Variables**:
   - Go to Site Settings → Environment Variables
   - Add `VITE_SUPABASE_URL`
   - Add `VITE_SUPABASE_ANON_KEY`

4. **Deploy**

#### Netlify Configuration

Create `netlify.toml`:

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[build.environment]
  NODE_VERSION = "18"
```

### Supabase Hosting

Supabase provides hosting for static sites.

#### Steps

1. **Install Supabase CLI**:
   ```bash
   npm install -g supabase
   ```

2. **Build the application**:
   ```bash
   npm run build
   ```

3. **Deploy**:
   ```bash
   supabase hosting deploy dist
   ```

4. **Set Environment Variables**:
   - Use Supabase dashboard or CLI
   - Variables are automatically available from Supabase project

### GitHub Pages

GitHub Pages offers free hosting for public repositories.

#### Steps

1. **Install gh-pages**:
   ```bash
   npm install --save-dev gh-pages
   ```

2. **Add deploy script** to `package.json`:
   ```json
   {
     "scripts": {
       "deploy": "npm run build && gh-pages -d dist"
     }
   }
   ```

3. **Configure base path** in `vite.config.ts`:
   ```typescript
   export default defineConfig({
     base: '/repository-name/', // Your repo name
     // ... other config
   });
   ```

4. **Deploy**:
   ```bash
   npm run deploy
   ```

5. **Enable GitHub Pages**:
   - Go to repository Settings → Pages
   - Select `gh-pages` branch
   - Select `/root` folder

**Note**: Environment variables need to be hardcoded or use a different approach for GitHub Pages.

### AWS S3 + CloudFront

For scalable, production-grade hosting.

#### Steps

1. **Create S3 Bucket**:
   - Create bucket in AWS S3
   - Disable public access (CloudFront will handle access)
   - Enable static website hosting

2. **Upload Build**:
   ```bash
   aws s3 sync dist/ s3://your-bucket-name --delete
   ```

3. **Create CloudFront Distribution**:
   - Origin: S3 bucket
   - Default root object: `index.html`
   - Error pages: Redirect 404 to `/index.html` (for SPA routing)

4. **Set Environment Variables**:
   - Use CloudFront environment variables or build-time injection

#### Script Example

Create `deploy.sh`:

```bash
#!/bin/bash
npm run build
aws s3 sync dist/ s3://your-bucket-name --delete
aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths "/*"
```

### Docker

Containerize the application for deployment to any container platform.

#### Dockerfile

Create `Dockerfile`:

```dockerfile
# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

#### nginx.conf

Create `nginx.conf`:

```nginx
server {
  listen 80;
  server_name _;
  root /usr/share/nginx/html;
  index index.html;

  location / {
    try_files $uri $uri/ /index.html;
  }

  location /assets {
    expires 1y;
    add_header Cache-Control "public, immutable";
  }
}
```

#### Build and Run

```bash
# Build image
docker build -t emlak-crm .

# Run container
docker run -p 80:80 emlak-crm
```

## Post-Deployment

### 1. Verify Deployment

- [ ] Application loads correctly
- [ ] Authentication works
- [ ] Database operations work
- [ ] File uploads work (photos, PDFs)
- [ ] Mobile responsive design works
- [ ] PWA features work (if applicable)

### 2. Configure CORS (if needed)

If using a custom domain, update Supabase CORS settings:

1. Go to Supabase Dashboard → Settings → API
2. Add your domain to allowed origins

### 3. Set Up Custom Domain (Optional)

Most platforms support custom domains:

- **Vercel**: Project Settings → Domains
- **Netlify**: Site Settings → Domain Management
- **CloudFront**: Distribution → Domain Names

### 4. Enable HTTPS

All modern platforms provide free SSL certificates. Ensure HTTPS is enabled.

### 5. Monitor Performance

- Use browser DevTools to check performance
- Monitor Supabase dashboard for API usage
- Set up error tracking (e.g., Sentry)

## Troubleshooting

### Build Fails

**Issue**: Build command fails

**Solutions**:
- Check Node.js version (18.x required)
- Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Check for TypeScript errors: `npm run typecheck`
- Check for linting errors: `npm run lint`

### Environment Variables Not Working

**Issue**: Environment variables not accessible in production

**Solutions**:
- Ensure `VITE_` prefix is used
- Restart build after adding environment variables
- Check deployment platform's environment variable documentation
- Verify variables are set in production environment (not just preview)

### Routing Issues (404 on Refresh)

**Issue**: Direct URL access or refresh returns 404

**Solutions**:
- Ensure SPA routing is configured (redirect all routes to `index.html`)
- Check platform's redirect/rewrite rules
- Verify `base` path in `vite.config.ts` if using subdirectory

### CORS Errors

**Issue**: CORS errors when accessing Supabase

**Solutions**:
- Add your domain to Supabase allowed origins
- Check Supabase project settings
- Verify environment variables are correct

### Database Connection Issues

**Issue**: Cannot connect to database

**Solutions**:
- Verify `VITE_SUPABASE_URL` is correct
- Verify `VITE_SUPABASE_ANON_KEY` is correct
- Check Supabase project is active
- Verify RLS policies allow access

### File Upload Issues

**Issue**: Photos or PDFs not uploading

**Solutions**:
- Verify storage buckets exist in Supabase
- Check storage bucket policies
- Verify file size limits (5MB default)
- Check file type restrictions

## Continuous Deployment

### GitHub Actions Example

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

## Performance Optimization

### Build Optimization

- Code splitting is automatic with Vite
- Tree shaking removes unused code
- Minification is enabled in production

### Runtime Optimization

- Enable browser caching for static assets
- Use CDN for faster global delivery
- Implement lazy loading for routes

### Monitoring

- Set up error tracking
- Monitor API usage in Supabase
- Track Core Web Vitals

---

For more information, see:
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)
- [Supabase Documentation](https://supabase.com/docs)
- [React Deployment](https://react.dev/learn/start-a-new-react-project#production-deployment)


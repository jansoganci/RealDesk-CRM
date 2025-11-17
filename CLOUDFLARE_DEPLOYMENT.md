# 🚀 Cloudflare Pages Deployment Guide

This guide will help you deploy your Real Estate CRM application to Cloudflare Pages.

## 📋 Prerequisites

1. **Cloudflare Account** - Sign up at [cloudflare.com](https://cloudflare.com) if you don't have one
2. **Node.js 18+** - Already installed on your system
3. **Git Repository** - Your project should be in a Git repository (optional but recommended)

## 🔧 Step 1: Install Wrangler CLI

Wrangler is Cloudflare's CLI tool for deploying to Cloudflare Pages and Workers.

```bash
npm install -g wrangler
```

Or install it locally as a dev dependency (already added to package.json):
```bash
npm install
```

## 🔐 Step 2: Login to Cloudflare

Authenticate with Cloudflare using Wrangler:

```bash
wrangler login
```

This will:
- Open your browser
- Ask you to log in to Cloudflare
- Authorize Wrangler to access your account

## 🌍 Step 3: Set Environment Variables

Your app needs Supabase credentials. You have two options:

### Option A: Set via Wrangler (Recommended for Production)

```bash
# Set environment variables for your Pages project
wrangler pages secret put VITE_SUPABASE_URL
# When prompted, paste your Supabase URL: https://your-project.supabase.co

wrangler pages secret put VITE_SUPABASE_ANON_KEY
# When prompted, paste your Supabase anon key
```

**Important**: These secrets are encrypted and only available at build time in Cloudflare Pages.

### Option B: Use Cloudflare Dashboard

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navigate to **Workers & Pages** → **Pages** → **emlak-crm-app**
3. Go to **Settings** → **Environment Variables**
4. Add:
   - `VITE_SUPABASE_URL` = `https://your-project.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = `your-anon-key`

## 🏗️ Step 4: Build Your Project

Before deploying, make sure your project builds successfully:

```bash
npm run build
```

This creates the `dist/` folder with your production build.

## 🚀 Step 5: Deploy to Cloudflare Pages

### First-Time Deployment

If this is your first deployment, create the Pages project:

```bash
npm run deploy
```

Or manually:
```bash
npm run build
wrangler pages deploy dist --project-name=emlak-crm-app
```

### Subsequent Deployments

For future deployments, simply run:

```bash
npm run deploy
```

This will:
1. Build your project (`npm run build`)
2. Deploy the `dist/` folder to Cloudflare Pages

## 📝 Step 6: Verify Deployment

After deployment, Wrangler will show you:
- Your deployment URL (e.g., `https://emlak-crm-app.pages.dev`)
- Deployment status

Visit the URL to verify everything works!

## 🔄 Continuous Deployment (Recommended)

For automatic deployments on every push to your repository:

### Via Cloudflare Dashboard

1. Go to **Workers & Pages** → **Pages** → **emlak-crm-app**
2. Click **Connect to Git**
3. Connect your GitHub/GitLab repository
4. Configure build settings:
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Root directory**: `/` (root)
5. Add environment variables in the dashboard
6. Save and deploy

Now every push to your main branch will automatically deploy!

## 🛠️ Troubleshooting

### Build Fails

**Error**: Build command fails

**Solution**:
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Check for TypeScript errors
npm run typecheck

# Try building again
npm run build
```

### Environment Variables Not Working

**Error**: Supabase connection fails in production

**Solution**:
1. Verify environment variables are set:
   ```bash
   wrangler pages secret list
   ```
2. Make sure variables start with `VITE_` prefix
3. Redeploy after setting variables:
   ```bash
   npm run deploy
   ```

### Authentication Issues

**Error**: `wrangler login` fails

**Solution**:
1. Make sure you're logged into Cloudflare in your browser
2. Try logging out and back in:
   ```bash
   wrangler logout
   wrangler login
   ```

### Wrong Project Name

**Error**: Deployment goes to wrong project

**Solution**:
- Check `wrangler.toml` has the correct `name = "emlak-crm-app"`
- Or specify project name explicitly:
  ```bash
  wrangler pages deploy dist --project-name=emlak-crm-app
  ```

## 📚 Additional Resources

- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)
- [Wrangler CLI Docs](https://developers.cloudflare.com/workers/wrangler/)
- [Environment Variables Guide](https://developers.cloudflare.com/pages/platform/build-configuration/#environment-variables)

## ✅ Quick Deploy Checklist

- [ ] Installed Wrangler CLI (`npm install -g wrangler`)
- [ ] Logged in to Cloudflare (`wrangler login`)
- [ ] Set environment variables (`VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`)
- [ ] Project builds successfully (`npm run build`)
- [ ] Deployed to Cloudflare Pages (`npm run deploy`)
- [ ] Verified deployment at `https://emlak-crm-app.pages.dev`

---

**Your app is now live! 🎉**


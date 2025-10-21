# 🚀 Vercel Deployment Guide

## Quick Deploy to Vercel

### Option 1: Deploy via Vercel CLI (Recommended)

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Navigate to backend folder:**
   ```bash
   cd backend
   ```

3. **Login to Vercel:**
   ```bash
   vercel login
   ```

4. **Deploy:**
   ```bash
   vercel
   ```
   - Follow the prompts
   - Choose your project name
   - Select "Yes" for production deployment

5. **Set Environment Variables:**
   ```bash
   vercel env add SUPABASE_URL
   vercel env add SUPABASE_ANON_KEY
   vercel env add SUPABASE_SERVICE_ROLE_KEY
   vercel env add VAPID_PUBLIC_KEY
   vercel env add VAPID_PRIVATE_KEY
   vercel env add VAPID_EMAIL
   vercel env add CORS_ORIGIN
   ```

### Option 2: Deploy via GitHub

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Add backend API"
   git push origin main
   ```

2. **Connect to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Set Root Directory to `backend`
   - Add environment variables in dashboard

## 🔧 Environment Variables Setup

You'll need these values in Vercel:

### Supabase (Required)
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_ANON_KEY` - Your Supabase anonymous key  
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key

### VAPID Keys (For Push Notifications)
- `VAPID_PUBLIC_KEY` - Generate with: `npx web-push generate-vapid-keys`
- `VAPID_PRIVATE_KEY` - Generate with: `npx web-push generate-vapid-keys`
- `VAPID_EMAIL` - Your email (e.g., `mailto:your-email@example.com`)

### CORS
- `CORS_ORIGIN` - Your frontend URL (e.g., `https://your-domain.vercel.app`)

## 📋 Pre-Deployment Checklist

- [ ] Supabase project created
- [ ] Database schema imported
- [ ] VAPID keys generated
- [ ] Environment variables ready
- [ ] Backend code tested locally

## 🎯 After Deployment

1. **Test your API:**
   ```
   https://your-backend.vercel.app/health
   ```

2. **Update frontend API calls:**
   - Change API base URL to your Vercel URL
   - Update CORS_ORIGIN to your frontend domain

3. **Set up database:**
   - Run the SQL schema in Supabase
   - Test API endpoints

## 🔍 Troubleshooting

### Common Issues:

1. **Build Fails:**
   - Check Node.js version (needs 18+)
   - Verify all dependencies in package.json

2. **Environment Variables:**
   - Double-check all required variables are set
   - Ensure no typos in variable names

3. **Database Connection:**
   - Verify Supabase URL and keys
   - Check if database schema is imported

4. **CORS Errors:**
   - Update CORS_ORIGIN to your frontend domain
   - Check if frontend is making requests to correct backend URL

### Getting Help:
- Check Vercel logs in dashboard
- Test API endpoints with Postman/curl
- Verify Supabase connection in dashboard

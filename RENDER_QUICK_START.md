# Render Quick Start Guide

## 🚀 5-Minute Deploy

### Step 1: Push to GitHub
```bash
git add .
git commit -m "Add Render deployment configuration"
git push origin master
```

### Step 2: Deploy on Render

1. Go to https://dashboard.render.com
2. Click **"New +"** → **"Blueprint"**
3. Connect GitHub (if first time)
4. Select your repository
5. Click **"Apply"** (Render will create 3 services automatically)

### Step 3: Wait for Build

- Services will build automatically (5-10 minutes)
- Watch the build logs in Render dashboard
- All services should show "Live" when ready

### Step 4: Configure URLs

After deployment, you'll get URLs like:
- Backend: `https://snake-game-backend-xxxx.onrender.com`
- Frontend: `https://snake-game-frontend-xxxx.onrender.com`

**Update Environment Variables:**

**Backend Service:**
1. Go to backend service → "Environment"
2. Update `CORS_ORIGINS` to your frontend URL

**Frontend Service:**
1. Go to frontend service → "Environment"  
2. Update `VITE_API_URL` to: `https://your-backend-url.onrender.com/api/v1`

**Then redeploy both services** (Render will auto-redeploy when you save env vars)

### Step 5: Bootstrap Database

1. Go to backend service → "Shell" tab
2. Run: `python bootstrap_db.py`
3. Check logs to verify success

### Step 6: Test!

Visit your frontend URL and test:
- ✅ Sign up
- ✅ Login
- ✅ Play game
- ✅ Leaderboard

## 🎉 Done!

Your app is now live on Render!

## Need Help?

- See [RENDER_DEPLOYMENT.md](RENDER_DEPLOYMENT.md) for detailed guide
- See [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md) for step-by-step checklist


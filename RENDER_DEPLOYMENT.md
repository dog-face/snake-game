# Render Deployment Guide

This guide will walk you through deploying the Snake Game application to Render.

## Prerequisites

1. A GitHub account with this repository pushed
2. A Render account (sign up at https://render.com)
3. Git access to this repository

## Quick Deploy (Using Blueprint)

The easiest way to deploy is using Render's Blueprint feature with the `render.yaml` file.

### Step 1: Connect Repository to Render

1. Go to https://dashboard.render.com
2. Click "New +" → "Blueprint"
3. Connect your GitHub account if you haven't already
4. Select this repository
5. Render will automatically detect `render.yaml` and show you the services it will create
6. Click "Apply" to create all services

This will create:
- PostgreSQL database
- Backend web service
- Frontend web service

### Step 2: Configure Environment Variables

After the services are created, you need to set environment variables:

#### Backend Service Environment Variables

1. Go to your backend service in Render dashboard
2. Navigate to "Environment" tab
3. Set the following variables:

   - `CORS_ORIGINS`: Set this to your frontend URL (e.g., `https://snake-game-frontend.onrender.com`)
   - `SECRET_KEY`: Generate a strong random key (you can use: `openssl rand -hex 32`)
   - `DATABASE_URL`: This should already be set automatically by Render
   - `ACCESS_TOKEN_EXPIRE_MINUTES`: `1440` (24 hours)
   - `SESSION_TIMEOUT`: `300` (5 minutes)

#### Frontend Service Environment Variables

1. Go to your frontend service in Render dashboard
2. Navigate to "Environment" tab
3. Set the following variable:

   - `VITE_API_URL`: Set this to your backend URL + `/api/v1` (e.g., `https://snake-game-backend.onrender.com/api/v1`)

### Step 3: Bootstrap the Database

After the backend service is deployed:

1. Go to your backend service in Render dashboard
2. Click on "Shell" tab (or use the "Manual Deploy" option)
3. Run the database bootstrap command:
   ```bash
   python bootstrap_db.py
   ```

Alternatively, you can SSH into the service and run:
```bash
cd /app
python bootstrap_db.py
```

### Step 4: Verify Deployment

1. Check that all services are "Live" (green status)
2. Visit your frontend URL
3. Test the application:
   - Sign up a new user
   - Play the game
   - Check the leaderboard
   - Test watch mode

## Manual Deploy (Alternative Method)

If you prefer to set up services manually:

### Step 1: Create PostgreSQL Database

1. Go to Render dashboard → "New +" → "PostgreSQL"
2. Name it `snake-game-db`
3. Select a plan (Starter is free)
4. Note the connection string (you'll need this)

### Step 2: Create Backend Service

1. Go to Render dashboard → "New +" → "Web Service"
2. Connect your GitHub repository
3. Configure:
   - **Name**: `snake-game-backend`
   - **Environment**: `Docker`
   - **Dockerfile Path**: `snake-game-be/Dockerfile.prod`
   - **Docker Context**: `snake-game-be`
   - **Region**: Choose closest to you
   - **Branch**: `master` (or your main branch)
   - **Plan**: Starter (free) or Standard for production

4. Add Environment Variables:
   - `DATABASE_URL`: (from PostgreSQL service)
   - `SECRET_KEY`: Generate a strong key
   - `CORS_ORIGINS`: (set after frontend is deployed)
   - `ACCESS_TOKEN_EXPIRE_MINUTES`: `1440`
   - `SESSION_TIMEOUT`: `300`

5. Click "Create Web Service"

### Step 3: Create Frontend Service

1. Go to Render dashboard → "New +" → "Web Service"
2. Connect your GitHub repository
3. Configure:
   - **Name**: `snake-game-frontend`
   - **Environment**: `Docker`
   - **Dockerfile Path**: `snake-game-fe/Dockerfile.prod`
   - **Docker Context**: `snake-game-fe`
   - **Region**: Same as backend
   - **Branch**: `master` (or your main branch)
   - **Plan**: Starter (free) or Standard for production

4. Add Environment Variables:
   - `VITE_API_URL`: `https://your-backend-url.onrender.com/api/v1`

5. Click "Create Web Service"

### Step 4: Link Services

1. Go back to backend service
2. Update `CORS_ORIGINS` with your frontend URL
3. Bootstrap the database (see Step 3 in Quick Deploy)

## Environment Variables Reference

### Backend Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Auto-set by Render |
| `SECRET_KEY` | JWT secret key | Generate with `openssl rand -hex 32` |
| `CORS_ORIGINS` | Allowed frontend origins | `https://snake-game-frontend.onrender.com` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | JWT token expiration | `1440` |
| `SESSION_TIMEOUT` | Session timeout in seconds | `300` |

### Frontend Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `https://snake-game-backend.onrender.com/api/v1` |

## Troubleshooting

### Backend won't start

- Check logs in Render dashboard
- Verify `DATABASE_URL` is set correctly
- Ensure database is running and accessible
- Check that `SECRET_KEY` is set

### Frontend can't connect to backend

- Verify `VITE_API_URL` is set correctly
- Check `CORS_ORIGINS` in backend includes frontend URL
- Ensure backend service is "Live"
- Check browser console for CORS errors

### Database connection errors

- Verify `DATABASE_URL` format: `postgresql://user:password@host:port/dbname`
- Check database service is running
- Ensure database is in same region as backend
- Try regenerating database credentials

### Build failures

- Check Dockerfile paths are correct
- Verify all files are committed to Git
- Check build logs for specific errors
- Ensure `Dockerfile.prod` files exist

## Post-Deployment

### Custom Domain (Optional)

1. Go to your service in Render
2. Click "Settings" → "Custom Domains"
3. Add your domain
4. Update DNS records as instructed
5. Update `CORS_ORIGINS` to include your custom domain

### Monitoring

- Render provides basic metrics in the dashboard
- Check logs regularly for errors
- Monitor database usage (free tier has limits)

### Scaling

- Upgrade to Standard plan for better performance
- Add more workers in backend (update Dockerfile.prod)
- Consider using Redis for session storage at scale

## Cost Estimate

**Free Tier (Starter Plan):**
- Web services: Free (spins down after 15 min inactivity)
- Database: Free (limited to 90 days, 1GB storage)

**Standard Plan (Recommended for Production):**
- Web services: ~$7/month per service
- Database: ~$7/month
- **Total**: ~$21/month for full stack

## Security Checklist

- [ ] Generate strong `SECRET_KEY` (not default)
- [ ] Set `CORS_ORIGINS` to specific domain (not `*`)
- [ ] Use HTTPS (automatic with Render)
- [ ] Keep dependencies updated
- [ ] Review and restrict database access
- [ ] Enable automatic security updates

## Support

- Render Documentation: https://render.com/docs
- Render Support: https://render.com/support
- Project Issues: Create an issue in this repository


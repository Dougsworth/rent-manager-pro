# 🚀 DigitalOcean Deployment Guide

## Prerequisites
1. GitHub repository with your code
2. DigitalOcean account
3. Credit card for DigitalOcean billing

## Step 1: Push Code to GitHub

```bash
# Initialize git (if not already done)
git init
git add .
git commit -m "Initial commit"

# Add remote and push
git remote add origin https://github.com/YOUR_USERNAME/rent-manager-pro.git
git push -u origin main
```

## Step 2: Create DigitalOcean App

1. **Go to [cloud.digitalocean.com](https://cloud.digitalocean.com)**
2. **Click "Create" → "Apps"**
3. **Connect GitHub repository**
4. **Select your `rent-manager-pro` repository**
5. **Choose `main` branch**

## Step 3: Configure App Settings

### Backend Service Configuration:
- **Source Directory**: `backend`
- **Build Command**: (leave empty)
- **Run Command**: `gunicorn --worker-tmp-dir /dev/shm rentmanager.wsgi:application`
- **Environment**: `Python`
- **Plan**: `Basic ($5/month)` to start

### Environment Variables:
```
DJANGO_SETTINGS_MODULE = rentmanager.settings.production
DEBUG = False
SECRET_KEY = [Generate new secret key]
ALLOWED_HOSTS = localhost,127.0.0.1,.ondigitalocean.app
CORS_ALLOWED_ORIGINS = https://rent-manager-pro-three.vercel.app
RESEND_API_KEY = re_6AgzmEdp_iWzHsnf2kjkYsW4WH7o5XDmJ
```

### Database Configuration:
1. **Add Database**: PostgreSQL
2. **Plan**: Basic ($15/month)
3. **Version**: 15
4. **Name**: rent-manager-db

## Step 4: Deployment Process

1. **Review configuration**
2. **Click "Create Resources"**
3. **Wait for deployment** (5-10 minutes)
4. **Note your app URL** (e.g., `https://your-app-name.ondigitalocean.app`)

## Step 5: Update Frontend API URL

Update your frontend `.env` file:
```
VITE_API_URL=https://your-app-name.ondigitalocean.app/api
```

Redeploy your Vercel frontend.

## Step 6: Run Database Migrations

In DigitalOcean Console:
```bash
python manage.py migrate
python manage.py collectstatic --noinput
python manage.py createsuperuser
```

## Step 7: Test Deployment

1. **Visit your backend URL**: `https://your-app-name.ondigitalocean.app/api/`
2. **Test API endpoints**
3. **Test frontend connection**
4. **Send test email reminder**

## Costs Breakdown:
- **App Platform**: $5/month (Basic)
- **Database**: $15/month (Basic PostgreSQL)
- **Total**: $20/month for professional setup

## Next Steps:
1. **Custom domain** (optional)
2. **SSL certificate** (automatic)
3. **Monitoring setup**
4. **Backup configuration**

## Scaling:
- **More traffic**: Upgrade to Professional ($25/month)
- **More storage**: Upgrade database plan
- **High availability**: Add read replicas
# 🚀 YCD Alchemist - Render Deployment Guide

This guide will help you deploy YCD Alchemist to Render, a modern cloud platform that makes it easy to deploy and scale your applications.

## 📋 Prerequisites

Before deploying, ensure you have:

1. **Spotify Developer Account**: Register at [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. **Render Account**: Sign up at [render.com](https://render.com)
3. **GitHub Repository**: Your code should be pushed to a GitHub repository

## 🎵 Spotify API Setup

1. **Create a Spotify App**:
   - Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
   - Click "Create an App"
   - Fill in app name: "YCD Alchemist"
   - Fill in app description: "Convert YCD playlists to Spotify"
   - Accept terms and create

2. **Configure Redirect URIs**:
   - In your Spotify app settings, add redirect URI:
   - `https://your-app-name.onrender.com/api/callback`
   - Replace `your-app-name` with your actual Render service name

3. **Get API Credentials**:
   - Note down your `Client ID` and `Client Secret`
   - You'll need these for Render environment variables

## 🔧 Render Deployment Options

### Option 1: Automatic Deployment (Recommended)

1. **Fork/Clone Repository**:
   ```bash
   git clone https://github.com/bachner/YCD-Alchemist.git
   cd YCD-Alchemist
   ```
   
   **📋 Repository**: [https://github.com/bachner/YCD-Alchemist](https://github.com/bachner/YCD-Alchemist)

2. **Connect to Render**:
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select the YCD-Alchemist repository

3. **Configure Service**:
   - **Name**: `ycd-alchemist` (or your preferred name)
   - **Environment**: `Node`
   - **Build Command**: `npm run render-build`
   - **Start Command**: `npm run render-start`
   - **Plan**: Free (or paid for better performance)

### Option 2: Using render.yaml (Infrastructure as Code)

1. **Deploy with Blueprint**:
   - The repository includes a `render.yaml` file
   - Go to Render Dashboard → "New +" → "Blueprint"
   - Connect your repository
   - Render will automatically configure everything

## 🌍 Environment Variables

Set these environment variables in your Render service:

| Variable | Value | Description |
|----------|-------|-------------|
| `SPOTIFY_CLIENT_ID` | `your_client_id` | From Spotify Developer Dashboard |
| `SPOTIFY_CLIENT_SECRET` | `your_client_secret` | From Spotify Developer Dashboard |
| `SPOTIFY_REDIRECT_URI` | `https://your-app-name.onrender.com/api/callback` | Your Render app URL + `/api/callback` |
| `NODE_ENV` | `production` | Environment mode |
| `PORT` | `10000` | Render automatically sets this |

### Setting Environment Variables:

1. **Via Render Dashboard**:
   - Go to your service → "Environment"
   - Add each variable with its value
   - **Important**: Mark `SPOTIFY_CLIENT_SECRET` as secret

2. **Via render.yaml** (already configured):
   - Variables are defined in the `render.yaml` file
   - You'll need to set the secret values in Render dashboard

## 📦 Build Process

The deployment process includes:

1. **Install Dependencies**: `npm run install-all`
2. **Build Frontend**: React app is built to static files
3. **Start Backend**: Express server serves API and static files
4. **Health Checks**: Automatic monitoring at `/api/health`

## 🔍 Verification Steps

After deployment:

1. **Check Service Status**:
   - Render Dashboard → Your Service → "Events"
   - Look for successful deployment

2. **Test Health Endpoint**:
   ```bash
   curl https://your-app-name.onrender.com/api/health
   ```

3. **Test Frontend**:
   - Visit `https://your-app-name.onrender.com`
   - Should see YCD Alchemist interface

4. **Test Spotify Integration**:
   - Click "Connect to Spotify"
   - Should redirect to Spotify login
   - After authorization, should return to your app

## 🛠️ Troubleshooting

### Common Issues:

1. **Build Failures**:
   ```bash
   # Check build logs in Render Dashboard
   # Common fix: Ensure all dependencies are in package.json
   ```

2. **Spotify Authentication Errors**:
   - Verify `SPOTIFY_REDIRECT_URI` matches exactly in both:
     - Render environment variables
     - Spotify App settings
   - Check `SPOTIFY_CLIENT_ID` and `SPOTIFY_CLIENT_SECRET`

3. **Port Issues**:
   - Render uses port 10000 automatically
   - Don't override `PORT` unless necessary

4. **File Upload Issues**:
   - Render has disk space limitations on free tier
   - Files are processed in memory, then cleaned up

### Debug Commands:

```bash
# Check environment variables (in Render shell)
printenv | grep SPOTIFY

# Test API health
curl -v https://your-app-name.onrender.com/api/health

# Check logs
# Available in Render Dashboard → Logs
```

## ⚡ Performance Optimization

### Free Tier Considerations:

1. **Cold Starts**: Service sleeps after 15 minutes of inactivity
2. **Disk Space**: 1GB limit (sufficient for this app)
3. **Memory**: 512MB limit
4. **Build Time**: 15 minutes max

### Paid Tier Benefits:

1. **No Cold Starts**: Always warm
2. **More Resources**: Better performance
3. **Custom Domains**: Your own domain
4. **Priority Support**: Faster help

## 🔐 Security Features

The deployment includes:

1. **HTTPS Only**: Automatic SSL certificates
2. **Environment Variables**: Secrets are encrypted
3. **Input Validation**: All API inputs validated
4. **CORS Protection**: Cross-origin requests controlled
5. **Rate Limiting**: Built into Render platform
6. **Security Headers**: X-Frame-Options, Content-Type protection

## 📊 Monitoring

Render provides:

1. **Real-time Logs**: View application logs
2. **Metrics**: CPU, memory, request metrics
3. **Health Checks**: Automatic monitoring
4. **Alerts**: Email notifications for issues

## 🔄 Updates and Maintenance

### Automatic Deployments:

1. **GitHub Integration**: Push to main branch auto-deploys
2. **Build Notifications**: Email alerts for build status
3. **Rollback Support**: Easy rollback to previous versions

### Manual Updates:

```bash
# Update your local repository
git pull origin main

# Push changes
git push origin main

# Render automatically detects and deploys
```

## 📞 Support

- **Render Support**: [render.com/support](https://render.com/support)
- **Spotify API Docs**: [developer.spotify.com](https://developer.spotify.com)
- **Project Issues**: [GitHub Issues](https://github.com/bachner/YCD-Alchemist/issues)

## 🎉 Success!

Once deployed, your YCD Alchemist will be available at:
`https://your-app-name.onrender.com`

Users can now upload YCD files and convert them to Spotify playlists with confidence scoring and intelligent track matching! 🧪✨

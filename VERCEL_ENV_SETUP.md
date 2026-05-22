# Vercel Backend Environment Setup

## What Was Fixed
The backend had serverless deployment issues that caused 500 errors:
1. ❌ **OLD**: Calling `process.exit(1)` on DB connection failure → crashed the serverless function
2. ❌ **OLD**: Calling `app.listen()` unconditionally → incompatible with Vercel's serverless model  
3. ✅ **NEW**: Graceful error handling; exports handler via `serverless-http`

## Required Environment Variables

Set these in **Vercel Project Settings > Environment Variables**:

| Variable | Value | Required | Example |
|---|---|---|---|
| `MONGODB_URI` | MongoDB Atlas connection string | ✅ Yes | `mongodb+srv://user:pass@cluster.mongodb.net/annek?appName=...` |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary account name | ✅ Yes | `druqciott` |
| `CLOUDINARY_API_KEY` | Cloudinary API key | ✅ Yes | `982466...` |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | ✅ Yes | `impqQZW...` |
| `EMAIL_USER` | Sender email (Gmail) | ⚠️ Recommended | `annek.websitebuild.official@gmail.com` |
| `EMAIL_PASS` | Gmail App Password | ⚠️ Recommended | (16-char password) |
| `ADMIN_EMAIL` | Admin inbox email | ⚠️ Recommended | `annek.websitebuild.official@gmail.com` |
| `FRONTEND_URL` | Frontend CORS origins | ⚠️ Recommended | `https://annek.vercel.app,https://www.annek.tech` |

### Critical: MONGODB_URI
**This is the most important variable.** Without it, all API endpoints will fail with errors in logs.

## Setup Steps

1. **Go to Vercel Dashboard**
   - Select your project
   - Settings > Environment Variables

2. **Add Variables**
   - Copy values from local `.env` file (see Backend/.env)
   - Paste into Vercel environment variables
   - **DO NOT commit `.env` to Git** (already in .gitignore)

3. **Redeploy**
   - Push changes to main: `git push origin main`
   - Vercel will auto-build and deploy
   - Check Deployment logs for errors

4. **Test the Endpoints**
   ```bash
   # Health check (should return JSON)
   curl https://your-vercel-backend-url.vercel.app/api/health
   
   # Settings (requires MONGODB_URI)
   curl https://your-vercel-backend-url.vercel.app/api/settings
   ```

## Troubleshooting

### 500 Error on All Endpoints
- **Check**: MONGODB_URI is set and valid
- **Check**: MongoDB Atlas IP whitelist includes Vercel's IPs (or use 0.0.0.0/0 for all IPs)
- **View Logs**: Vercel Dashboard > Deployments > Function Logs

### Connection Timeout
- **MongoDB Atlas**: Security > Network Access — allow Vercel's region
- **Alternatively**: Add 0.0.0.0/0 (allows all IPs, less secure)

### Gmail SMTP Errors
- If you see `Gmail SMTP connection failed`, EMAIL_PASS may be wrong
- Ensure EMAIL_PASS is a **Gmail App Password** (not your login password)
- Generate at: https://myaccount.google.com/apppasswords

## Files Changed
- `Backend/config/db.js` — removed `process.exit(1)` on connection fail
- `Backend/server.js` — added serverless handler export; conditional `app.listen()`
- `Backend/package.json` — added `serverless-http` dependency

## Next Steps
1. ✅ Set all required Vercel environment variables
2. ✅ Verify MongoDB Atlas whitelist is configured
3. ✅ Push changes to deploy
4. ✅ Test API endpoints

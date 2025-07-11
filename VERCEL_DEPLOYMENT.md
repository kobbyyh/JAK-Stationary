# Vercel Deployment Guide - JAK Stationary System

## 🚀 Quick Deploy to Vercel

### Method 1: Deploy from GitHub (Recommended)

1. **Push your code to GitHub**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Sign up/Login with GitHub
   - Click "New Project"
   - Import your GitHub repository
   - Vercel will auto-detect it's a static site

3. **Configure Environment Variables**
   - In your Vercel project dashboard
   - Go to Settings > Environment Variables
   - Add each variable:
     ```
     FIREBASE_API_KEY=AIzaSyBgfjHkHWXa-J6DWHQX224XKbw3XGUVUfQ
     FIREBASE_AUTH_DOMAIN=jak-stationary.firebaseapp.com
     FIREBASE_PROJECT_ID=jak-stationary
     FIREBASE_STORAGE_BUCKET=jak-stationary.firebasestorage.app
     FIREBASE_MESSAGING_SENDER_ID=420352393801
     FIREBASE_APP_ID=1:420352393801:web:82402e02f1ec2a9e26b598
     FIREBASE_MEASUREMENT_ID=G-QX2V6TR6PH
     ```
   - Set Environment to "Production" for all
   - Click "Save"

4. **Deploy**
   - Vercel will automatically deploy
   - Or click "Redeploy" after adding environment variables

### Method 2: Deploy from Local Files

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   vercel
   ```

4. **Set Environment Variables**
   ```bash
   vercel env add FIREBASE_API_KEY
   vercel env add FIREBASE_AUTH_DOMAIN
   vercel env add FIREBASE_PROJECT_ID
   vercel env add FIREBASE_STORAGE_BUCKET
   vercel env add FIREBASE_MESSAGING_SENDER_ID
   vercel env add FIREBASE_APP_ID
   vercel env add FIREBASE_MEASUREMENT_ID
   ```

## 🔧 Configuration Files

Your project now includes:
- `vercel.json` - Vercel configuration
- `config.js` - Environment-aware Firebase config
- `.gitignore` - Excludes sensitive files

## 🌐 Custom Domain (Optional)

1. Go to your Vercel project dashboard
2. Navigate to Settings > Domains
3. Add your custom domain
4. Follow DNS configuration instructions

## 📊 Monitoring

Vercel provides:
- **Analytics** - Page views, performance
- **Functions** - Serverless functions (if needed)
- **Edge Network** - Global CDN
- **Preview Deployments** - Test changes before production

## 🔒 Security Features

- **Environment Variables** - Secure key storage
- **HTTPS** - Automatic SSL certificates
- **Security Headers** - Configured in vercel.json
- **DDoS Protection** - Built-in protection

## 🚨 Troubleshooting

### Common Issues:

1. **Environment Variables Not Loading**
   - Ensure variables are set to "Production" environment
   - Redeploy after adding variables
   - Check variable names match exactly

2. **Firebase Connection Issues**
   - Verify Firebase Auth domain includes your Vercel domain
   - Check Firestore security rules
   - Ensure users exist in Firestore

3. **Build Errors**
   - Check file paths in vercel.json
   - Ensure all required files are committed
   - Review build logs in Vercel dashboard

## 📱 Testing Your Deployment

1. **Test Admin Login**
   - Use email/password
   - Verify admin dashboard loads

2. **Test User Login**
   - Use phone/password
   - Verify user dashboard loads

3. **Test CRUD Operations**
   - Add/edit/delete items (admin)
   - Confirm/decline items (users)
   - Record sales (users)

4. **Test Data Export**
   - Verify CSV export works (admin only)

## 🎯 Vercel Advantages

- **Automatic Deployments** - Deploy on every Git push
- **Preview Deployments** - Test changes before production
- **Global CDN** - Fast loading worldwide
- **Free Tier** - Generous limits
- **Easy Environment Variables** - Secure configuration
- **Custom Domains** - Professional URLs

Your app will be live at: `https://your-project-name.vercel.app` 
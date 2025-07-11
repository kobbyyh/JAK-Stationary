# Deployment Guide - JAK Stationary System

## Security Setup for Hosting

This guide explains how to securely deploy your Firebase application without exposing API keys.

## Option 1: Environment Variables (Recommended)

### For Netlify:
1. Go to your Netlify dashboard
2. Navigate to Site settings > Environment variables
3. Add these variables:
   ```
   FIREBASE_API_KEY=AIzaSyBgfjHkHWXa-J6DWHQX224XKbw3XGUVUfQ
   FIREBASE_AUTH_DOMAIN=jak-stationary.firebaseapp.com
   FIREBASE_PROJECT_ID=jak-stationary
   FIREBASE_STORAGE_BUCKET=jak-stationary.firebasestorage.app
   FIREBASE_MESSAGING_SENDER_ID=420352393801
   FIREBASE_APP_ID=1:420352393801:web:82402e02f1ec2a9e26b598
   FIREBASE_MEASUREMENT_ID=G-QX2V6TR6PH
   ```

### For Vercel:
1. Go to your Vercel dashboard
2. Navigate to Project settings > Environment variables
3. Add these variables:
   ```
   FIREBASE_API_KEY=AIzaSyBgfjHkHWXa-J6DWHQX224XKbw3XGUVUfQ
   FIREBASE_AUTH_DOMAIN=jak-stationary.firebaseapp.com
   FIREBASE_PROJECT_ID=jak-stationary
   FIREBASE_STORAGE_BUCKET=jak-stationary.firebasestorage.app
   FIREBASE_MESSAGING_SENDER_ID=420352393801
   FIREBASE_APP_ID=1:420352393801:web:82402e02f1ec2a9e26b598
   FIREBASE_MEASUREMENT_ID=G-QX2V6TR6PH
   ```
4. Set environment to "Production" for all variables
5. Redeploy your project after adding variables

### For GitHub Pages:
Since GitHub Pages doesn't support environment variables, use Option 2 below.

## Option 2: Server-Side Configuration (For GitHub Pages)

Create a `firebaseConfig.prod.js` file (this will be ignored by Git):

```javascript
// Production Firebase config
window.firebaseConfig = {
  apiKey: "YOUR_ACTUAL_API_KEY",
  authDomain: "jak-stationary.firebaseapp.com",
  projectId: "jak-stationary",
  storageBucket: "jak-stationary.firebasestorage.app",
  messagingSenderId: "420352393801",
  appId: "1:420352393801:web:82402e02f1ec2a9e26b598",
  measurementId: "G-QX2V6TR6PH"
};
```

Then update your HTML to load this file in production:

```html
<!-- For production, load the secure config -->
<script src="firebaseConfig.prod.js"></script>
<!-- For development, load the default config -->
<script src="config.js"></script>
```

## Option 3: Firebase Security Rules (Additional Security)

Update your Firestore security rules to restrict access:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow admin users full access
    match /{document=**} {
      allow read, write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Allow users to read items and write confirmations/sales
    match /items/{itemId} {
      allow read: if request.auth != null;
    }
    
    match /itemConfirmations/{confirmationId} {
      allow read, write: if request.auth != null;
    }
    
    match /sales/{saleId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## Deployment Steps

1. **Choose your hosting platform** (Netlify, Vercel, GitHub Pages, etc.)

2. **Set up environment variables** (if supported by your platform)

3. **Deploy your files**:
   - `index.html`
   - `script.js`
   - `styles.css`
   - `config.js`
   - Any other assets

4. **Test the deployment** to ensure everything works

## Important Security Notes

- **Firebase API keys are not secret** - they're meant to be public
- **Real security comes from Firestore rules** - always set proper rules
- **Environment variables** help with organization and key rotation
- **Never commit real API keys** to public repositories

## Firebase Console Setup

1. Go to Firebase Console
2. Select your project
3. Go to Authentication > Sign-in method
4. Enable Email/Password authentication
5. Go to Firestore Database > Rules
6. Update rules as shown above

## Testing Your Deployment

1. Test admin login with email/password
2. Test user login with phone/password
3. Test all CRUD operations
4. Verify role-based access control
5. Test data export functionality

## Troubleshooting

- **CORS errors**: Check Firebase Auth domain settings
- **Permission denied**: Check Firestore security rules
- **Config not loading**: Verify environment variables are set correctly
- **Authentication fails**: Ensure users exist in Firestore with correct roles 
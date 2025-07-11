// Firebase Configuration
// This file loads configuration from environment variables for security
// For development, you can use the fallback values below
// For production, set these environment variables on your hosting platform

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || "AIzaSyBgfjHkHWXa-J6DWHQX224XKbw3XGUVUfQ",
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || "jak-stationary.firebaseapp.com",
  projectId: process.env.FIREBASE_PROJECT_ID || "jak-stationary",
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "jak-stationary.firebasestorage.app",
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "420352393801",
  appId: process.env.FIREBASE_APP_ID || "1:420352393801:web:82402e02f1ec2a9e26b598",
  measurementId: process.env.FIREBASE_MEASUREMENT_ID || "G-QX2V6TR6PH"
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { firebaseConfig };
} else {
  // For browser usage
  window.firebaseConfig = firebaseConfig;
} 
/// <reference types="vite/client" />

import { initializeApp, getApps } from 'firebase/app'
import { getAnalytics } from 'firebase/analytics'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

// Validate required environment variables
const requiredEnvVars = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
}

// Check for missing environment variables
const missingVars = Object.entries(requiredEnvVars)
  .filter(([_, value]) => !value)
  .map(([key]) => key)

if (missingVars.length > 0) {
  throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`)
}

const firebaseConfig = requiredEnvVars

// Debug Firebase configuration
console.log('Firebase Config Details:', {
  apiKey: '[PRESENT]',
  authDomain: firebaseConfig.authDomain,
  projectId: firebaseConfig.projectId,
  storageBucket: '[PRESENT]',
  messagingSenderId: '[PRESENT]',
  appId: '[PRESENT]',
  measurementId: '[PRESENT]'
})

console.log('Current Environment:', import.meta.env.MODE)
console.log('Base URL:', window.location.origin)
console.log('Full Auth Domain:', firebaseConfig.authDomain)

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]

// Initialize services
const auth = getAuth(app)
const db = getFirestore(app)
const storage = getStorage(app)

console.log('Firebase Status:', getApps().length === 0 ? 'New instance initialized' : 'Using existing instance')

// Initialize Analytics
let analytics = null
if (import.meta.env.MODE === 'production' && !window.location.href.includes('localhost')) {
  try {
    analytics = getAnalytics(app)
    console.log('Analytics initialized successfully')
  } catch (error) {
    console.error('Analytics initialization failed:', error)
  }
}

export { app, analytics, auth, db, storage }

export default app; 
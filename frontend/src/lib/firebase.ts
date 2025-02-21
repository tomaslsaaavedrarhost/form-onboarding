/// <reference types="vite/client" />

import { initializeApp, getApps } from 'firebase/app'
import { getAnalytics } from 'firebase/analytics'
import { getAuth, GoogleAuthProvider, browserLocalPersistence, setPersistence } from 'firebase/auth'
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

// Initialize Firebase (only if not already initialized)
const existingApp = getApps().length > 0
const app = existingApp ? getApps()[0] : initializeApp(firebaseConfig)

console.log('Firebase Status:', existingApp ? 'Using existing instance' : 'New instance initialized')

// Initialize Authentication with detailed logging
const auth = getAuth(app)

// Set persistence to LOCAL immediately
setPersistence(auth, browserLocalPersistence)
  .then(() => console.log('Firebase Auth persistence set to LOCAL'))
  .catch(error => console.error('Error setting persistence:', error))

console.log('Firebase Auth initialized with config:', {
  authDomain: auth.config.authDomain,
  apiKey: '[PRESENT]'
})

// Initialize provider with custom parameters
const googleProvider = new GoogleAuthProvider()
googleProvider.setCustomParameters({
  prompt: 'select_account',
  login_hint: '',  // Permite que el usuario elija la cuenta
  access_type: 'offline',  // Necesario para obtener refresh token
  // Usar el dominio de Vercel en producción
  auth_domain: process.env.NODE_ENV === 'production' 
    ? 'forms-onboarding.vercel.app'
    : firebaseConfig.authDomain
})

// Add scopes if needed
googleProvider.addScope('profile')
googleProvider.addScope('email')

// Log provider configuration
console.log('Google Provider Configuration:', {
  providerId: googleProvider.providerId,
  currentDomain: window.location.origin,
  authDomain: process.env.NODE_ENV === 'production' 
    ? 'forms-onboarding.vercel.app'
    : firebaseConfig.authDomain,
  environment: process.env.NODE_ENV
})

// Initialize Firestore
const db = getFirestore(app)
console.log('Firestore initialized with project:', firebaseConfig.projectId)

// Initialize Storage
const storage = getStorage(app)
console.log('Storage initialized with bucket:', firebaseConfig.storageBucket)

// Only initialize analytics on production
let analytics = null
if (import.meta.env.MODE === 'production' && !window.location.href.includes('localhost')) {
  try {
    analytics = getAnalytics(app)
    console.log('Analytics initialized successfully')
  } catch (error) {
    console.error('Analytics initialization failed:', error)
  }
}

export { app, analytics, auth, googleProvider, db, storage }

export default app; 
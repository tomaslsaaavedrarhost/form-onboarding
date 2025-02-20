/// <reference types="vite/client" />

import { initializeApp, getApps } from 'firebase/app'
import { getAnalytics } from 'firebase/analytics'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

// Temporal debug log
console.log('Firebase Config:', {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ? '[PRESENT]' : '[MISSING]',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ? '[PRESENT]' : '[MISSING]',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ? '[PRESENT]' : '[MISSING]',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ? '[PRESENT]' : '[MISSING]',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ? '[PRESENT]' : '[MISSING]',
  appId: import.meta.env.VITE_FIREBASE_APP_ID ? '[PRESENT]' : '[MISSING]',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID ? '[PRESENT]' : '[MISSING]',
})

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "forms-onboarding.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
}

// Initialize Firebase only if not already initialized
let firebaseApp
try {
  firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
} catch (error) {
  console.error('Error initializing Firebase:', error)
  firebaseApp = getApps()[0]
}

// Initialize Authentication
const auth = getAuth(firebaseApp)

// Initialize provider with custom parameters
const googleProvider = new GoogleAuthProvider()
googleProvider.setCustomParameters({
  prompt: 'select_account'
})

// Initialize Firestore
const db = getFirestore(firebaseApp)

// Initialize Storage
const storage = getStorage(firebaseApp)

// Only initialize analytics on the client side and if available
let analytics = null
if (typeof window !== 'undefined' && !window.location.href.includes('localhost')) {
  try {
    analytics = getAnalytics(firebaseApp)
  } catch (error) {
    console.error('Analytics initialization failed:', error)
  }
}

export { firebaseApp, analytics, auth, googleProvider, db, storage } 
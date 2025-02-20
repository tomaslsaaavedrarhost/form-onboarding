import { initializeApp, getApps } from 'firebase/app'
import { getAnalytics } from 'firebase/analytics'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
}

// Initialize Firebase
let firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
let analytics = null

// Initialize Authentication
const auth = getAuth(firebaseApp)
const googleProvider = new GoogleAuthProvider()

// Initialize Firestore
const db = getFirestore(firebaseApp)

// Initialize Storage
const storage = getStorage(firebaseApp)

// Only initialize analytics on the client side
if (typeof window !== 'undefined') {
  analytics = getAnalytics(firebaseApp)
}

export { firebaseApp, analytics, auth, googleProvider, db, storage } 
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User, signInWithPopup, signOut, GoogleAuthProvider, setPersistence, browserLocalPersistence, browserPopupRedirectResolver } from 'firebase/auth'
import { auth, googleProvider } from './firebase'

interface AuthContextType {
  user: User | null
  loading: boolean
  signInWithGoogle: () => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Set persistence when the provider mounts
    setPersistence(auth, browserLocalPersistence)
      .catch((error) => {
        console.error('Error setting persistence:', error)
      })

    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const signInWithGoogle = async () => {
    try {
      // Configure el proveedor de Google
      googleProvider.setCustomParameters({
        prompt: 'select_account',
        display: 'popup'
      })

      // Intenta el inicio de sesión con popup usando el resolver específico
      const result = await signInWithPopup(auth, googleProvider, browserPopupRedirectResolver)
      if (!result.user) {
        throw new Error('No user data received')
      }
    } catch (error: any) {
      console.error('Error signing in with Google:', error)
      if (error.code === 'auth/popup-blocked') {
        alert('Please allow popups for this website to sign in with Google')
      } else if (error.code === 'auth/cancelled-popup-request') {
        console.log('Sign-in popup was closed by the user')
      } else if (error.code === 'auth/unauthorized-domain') {
        console.error('Domain not authorized. Please check Firebase Console settings.')
      } else {
        alert('Error signing in with Google. Please try again.')
      }
      throw error
    }
  }

  const logout = async () => {
    try {
      await signOut(auth)
    } catch (error) {
      console.error('Error signing out:', error)
      alert('Error signing out. Please try again.')
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  )
} 
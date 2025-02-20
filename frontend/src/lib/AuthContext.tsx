import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { 
  User, 
  signInWithRedirect, 
  signOut, 
  GoogleAuthProvider, 
  setPersistence, 
  browserLocalPersistence,
  getRedirectResult
} from 'firebase/auth'
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
    let unsubscribe: () => void

    const initAuth = async () => {
      try {
        // Set persistence first
        await setPersistence(auth, browserLocalPersistence)
        
        // Check for redirect result
        const result = await getRedirectResult(auth)
        if (result?.user) {
          setUser(result.user)
          // Use replace state to avoid navigation issues
          window.history.replaceState({}, '', '/')
          return
        }

        // Set up auth state listener
        unsubscribe = auth.onAuthStateChanged((user) => {
          setUser(user)
          setLoading(false)
        })
      } catch (error) {
        console.error('Error during auth initialization:', error)
        setLoading(false)
        // Use replace state for error cases too
        window.history.replaceState({}, '', '/')
      }
    }

    initAuth()

    // Cleanup subscription
    return () => {
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [])

  const signInWithGoogle = async () => {
    try {
      await signInWithRedirect(auth, googleProvider)
    } catch (error: any) {
      console.error('Error signing in with Google:', error)
      if (error.code === 'auth/unauthorized-domain') {
        console.error('Domain not authorized. Please check Firebase Console settings.')
      }
      // Use replace state for error cases
      window.history.replaceState({}, '', '/')
    }
  }

  const logout = async () => {
    try {
      await signOut(auth)
      // Use replace state for logout
      window.history.replaceState({}, '', '/')
    } catch (error) {
      console.error('Error signing out:', error)
      // Use replace state for error cases
      window.history.replaceState({}, '', '/')
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  )
} 
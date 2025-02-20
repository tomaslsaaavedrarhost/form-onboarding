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
    const initAuth = async () => {
      try {
        await setPersistence(auth, browserLocalPersistence)
        
        const result = await getRedirectResult(auth)
        if (result?.user) {
          setUser(result.user)
          window.location.href = '/'
          return
        }
      } catch (error) {
        console.error('Error during auth initialization:', error)
        window.location.href = '/'
      }

      const unsubscribe = auth.onAuthStateChanged((user) => {
        setUser(user)
        setLoading(false)
      })

      return () => unsubscribe()
    }

    initAuth()
  }, [])

  const signInWithGoogle = async () => {
    try {
      googleProvider.setCustomParameters({
        prompt: 'select_account'
      })

      await signInWithRedirect(auth, googleProvider)
    } catch (error: any) {
      console.error('Error signing in with Google:', error)
      if (error.code === 'auth/unauthorized-domain') {
        console.error('Domain not authorized. Please check Firebase Console settings.')
      }
      window.location.href = '/'
    }
  }

  const logout = async () => {
    try {
      await signOut(auth)
      window.location.href = '/'
    } catch (error) {
      console.error('Error signing out:', error)
      window.location.href = '/'
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  )
} 
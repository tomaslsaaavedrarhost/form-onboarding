import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User, signInWithRedirect, getRedirectResult, signOut } from 'firebase/auth'
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
        // Check for redirect result first
        const result = await getRedirectResult(auth)
        if (result?.user) {
          setUser(result.user)
        }
      } catch (error) {
        console.error('Error getting redirect result:', error)
      } finally {
        setLoading(false)
      }
    }

    // Set up auth state listener
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user)
      setLoading(false)
    })

    initAuth()

    return () => unsubscribe()
  }, [])

  const signInWithGoogle = async () => {
    try {
      await signInWithRedirect(auth, googleProvider)
    } catch (error) {
      console.error('Error signing in with Google:', error)
    }
  }

  const logout = async () => {
    try {
      await signOut(auth)
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  )
} 
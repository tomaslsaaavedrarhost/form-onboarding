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
import { useNavigate } from 'react-router-dom'

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
  const navigate = useNavigate()

  useEffect(() => {
    // Set persistence when the provider mounts
    setPersistence(auth, browserLocalPersistence)
      .catch((error) => {
        console.error('Error setting persistence:', error)
      })

    // Check for redirect result
    getRedirectResult(auth)
      .then((result) => {
        if (result?.user) {
          setUser(result.user)
          navigate('/')
        }
      })
      .catch((error) => {
        console.error('Error getting redirect result:', error)
      })
      .finally(() => {
        setLoading(false)
      })

    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user)
      if (!loading) {
        if (!user) {
          navigate('/login')
        }
      }
    })

    return () => unsubscribe()
  }, [navigate, loading])

  const signInWithGoogle = async () => {
    try {
      // Configure el proveedor de Google
      googleProvider.setCustomParameters({
        prompt: 'select_account'
      })

      // Usar redirección
      await signInWithRedirect(auth, googleProvider)
    } catch (error: any) {
      console.error('Error signing in with Google:', error)
      if (error.code === 'auth/unauthorized-domain') {
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
      navigate('/login')
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
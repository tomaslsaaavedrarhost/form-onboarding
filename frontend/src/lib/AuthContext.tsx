import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { 
  User, 
  signInWithPopup,
  signOut, 
  GoogleAuthProvider, 
  setPersistence, 
  browserLocalPersistence,
  onAuthStateChanged
} from 'firebase/auth'
import { auth, googleProvider } from './firebase'
import { useNavigate, useLocation } from 'react-router-dom'

interface AuthContextType {
  user: User | null
  loading: boolean
  signInWithGoogle: () => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const location = useLocation()

  // Set up auth state listener
  useEffect(() => {
    console.log('Setting up auth state listener...', {
      currentPath: location.pathname,
      isLoginPage: location.pathname === '/login'
    })
    
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('Auth state changed:', {
        hasUser: user ? 'Yes' : 'No',
        userEmail: user?.email || 'N/A',
        emailVerified: user?.emailVerified || false,
        providerId: user?.providerId || 'N/A',
        currentPath: location.pathname
      })
      
      if (user) {
        try {
          await setPersistence(auth, browserLocalPersistence)
          console.log('Auth persistence set to LOCAL')
          
          // If on login page, redirect to home or intended path
          if (location.pathname === '/login') {
            const intendedPath = sessionStorage.getItem('intendedPath') || '/'
            console.log('Redirecting to:', intendedPath)
            navigate(intendedPath, { replace: true })
            sessionStorage.removeItem('intendedPath')
          }
        } catch (error: any) {
          console.error('Error setting persistence:', {
            code: error.code,
            message: error.message
          })
        }
      } else if (!user && location.pathname !== '/login') {
        // Store intended path
        console.log('Storing intended path:', location.pathname)
        sessionStorage.setItem('intendedPath', location.pathname)
        
        // Redirect to login
        console.log('Redirecting to login')
        navigate('/login', { replace: true })
      }
      
      setUser(user)
      setLoading(false)
    })

    return () => {
      console.log('Cleaning up auth state listener')
      unsubscribe()
    }
  }, [navigate, location])

  const signInWithGoogle = async () => {
    try {
      console.log('Starting Google sign in process...', {
        currentPath: location.pathname,
        currentUser: auth.currentUser?.email || 'None'
      })
      
      setLoading(true)
      const result = await signInWithPopup(auth, googleProvider)
      console.log('Sign in successful:', {
        user: result.user.email,
        providerId: result.providerId,
        operationType: result.operationType
      })

      // Handle successful sign in
      const intendedPath = sessionStorage.getItem('intendedPath') || '/'
      navigate(intendedPath, { replace: true })
      sessionStorage.removeItem('intendedPath')
      
    } catch (error: any) {
      console.error('Error in Google sign in:', {
        code: error.code,
        message: error.message,
        customData: error.customData
      })
      
      if (error.code === 'auth/unauthorized-domain') {
        console.error('Domain not authorized:', {
          currentDomain: window.location.origin,
          authDomain: auth.config.authDomain
        })
      }
      
      setLoading(false)
      throw error
    }
  }

  const logout = async () => {
    try {
      console.log('Starting logout process...')
      await signOut(auth)
      console.log('Logout successful, redirecting to login')
      navigate('/login', { replace: true })
    } catch (error: any) {
      console.error('Error during logout:', {
        code: error.code,
        message: error.message
      })
      throw error
    }
  }

  const value = {
    user,
    loading,
    signInWithGoogle,
    logout
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export { AuthProvider, useAuth } 
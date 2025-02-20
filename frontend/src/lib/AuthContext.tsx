import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { 
  User, 
  signInWithRedirect, 
  signOut, 
  GoogleAuthProvider, 
  setPersistence, 
  browserLocalPersistence,
  getRedirectResult,
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
  const [initialized, setInitialized] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  // Handle redirect result
  useEffect(() => {
    const handleRedirectResult = async () => {
      try {
        console.log('Checking redirect result...', {
          currentURL: window.location.href,
          pathname: location.pathname,
          hasCode: window.location.href.includes('code='),
          hasState: window.location.href.includes('state=')
        })
        
        const result = await getRedirectResult(auth)
        console.log('Redirect result:', {
          success: result ? 'Yes' : 'No',
          hasUser: result?.user ? 'Yes' : 'No',
          userEmail: result?.user?.email || 'N/A',
          operationType: result?.operationType || 'N/A',
          currentUser: auth.currentUser?.email || 'None'
        })
        
        if (result?.user) {
          console.log('Setting user after successful redirect:', {
            email: result.user.email,
            uid: result.user.uid,
            emailVerified: result.user.emailVerified
          })
          setUser(result.user)
          
          // Redirect to home or intended page
          const intendedPath = sessionStorage.getItem('intendedPath') || '/'
          console.log('Redirecting to:', intendedPath)
          navigate(intendedPath, { replace: true })
          sessionStorage.removeItem('intendedPath')
        }
      } catch (error: any) {
        console.error('Error handling redirect:', {
          code: error.code,
          message: error.message,
          customData: error.customData
        })
      } finally {
        console.log('Redirect handling completed')
        setInitialized(true)
      }
    }

    handleRedirectResult()
  }, [navigate])

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
      await signInWithRedirect(auth, googleProvider)
      console.log('Redirect initiated successfully')
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
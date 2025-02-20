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
import { useNavigate, useLocation } from 'react-router-dom'

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
  const location = useLocation()

  useEffect(() => {
    const init = async () => {
      try {
        // Set persistence
        await setPersistence(auth, browserLocalPersistence)
        
        // Check for redirect result
        const result = await getRedirectResult(auth)
        if (result?.user) {
          setUser(result.user)
          // Usar el state de la URL o redirigir a la página principal
          const returnTo = location.state?.from?.pathname || '/'
          navigate(returnTo, { replace: true })
        }
      } catch (error) {
        console.error('Error during initialization:', error)
      } finally {
        setLoading(false)
      }
    }

    init()

    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user)
      if (!loading) {
        if (!user) {
          // Guardar la ubicación actual antes de redirigir al login
          navigate('/login', { 
            replace: true,
            state: { from: location }
          })
        }
      }
    })

    return () => unsubscribe()
  }, [navigate, location, loading])

  const signInWithGoogle = async () => {
    try {
      // Configure el proveedor de Google
      googleProvider.setCustomParameters({
        prompt: 'select_account',
        // Guardar la URL actual como state para redirigir después del login
        state: JSON.stringify({ returnTo: location.pathname })
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
      navigate('/login', { replace: true })
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
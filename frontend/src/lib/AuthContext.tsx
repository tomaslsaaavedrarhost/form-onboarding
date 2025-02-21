import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { 
  User, 
  signOut, 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail
} from 'firebase/auth'
import { auth } from './firebase'
import { useNavigate, useLocation } from 'react-router-dom'

interface AuthContextType {
  user: User | null
  loading: boolean
  register: (email: string, password: string) => Promise<void>
  login: (email: string, password: string) => Promise<void>
  resetPassword: (email: string) => Promise<void>
  logout: () => Promise<void>
  error: string | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    console.log('Setting up auth state listener...')
    
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      console.log('Auth state changed:', {
        hasUser: user ? 'Yes' : 'No',
        userEmail: user?.email || 'N/A',
        emailVerified: user?.emailVerified || false,
      })
      
      if (user) {
        if (location.pathname === '/login') {
          const intendedPath = sessionStorage.getItem('intendedPath') || '/'
          console.log('Redirecting to:', intendedPath)
          navigate(intendedPath, { replace: true })
          sessionStorage.removeItem('intendedPath')
        }
      } else if (!user && location.pathname !== '/login') {
        console.log('Storing intended path:', location.pathname)
        sessionStorage.setItem('intendedPath', location.pathname)
        
        console.log('Redirecting to login')
        navigate('/login', { replace: true })
      }
      
      setUser(user)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [navigate, location])

  const register = async (email: string, password: string) => {
    try {
      setError(null)
      setLoading(true)
      await createUserWithEmailAndPassword(auth, email, password)
    } catch (error: any) {
      console.error('Error during registration:', error)
      let errorMessage = 'Error al registrar usuario.'
      
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'Este email ya está registrado.'
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Email inválido.'
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'La contraseña debe tener al menos 6 caracteres.'
      }
      
      setError(errorMessage)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    try {
      setError(null)
      setLoading(true)
      await signInWithEmailAndPassword(auth, email, password)
    } catch (error: any) {
      console.error('Error during login:', error)
      let errorMessage = 'Error al iniciar sesión.'
      
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'Usuario no encontrado.'
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Contraseña incorrecta.'
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Email inválido.'
      }
      
      setError(errorMessage)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const resetPassword = async (email: string) => {
    try {
      setError(null)
      setLoading(true)
      await sendPasswordResetEmail(auth, email)
    } catch (error: any) {
      console.error('Error during password reset:', error)
      let errorMessage = 'Error al enviar email de recuperación.'
      
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No existe una cuenta con este email.'
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Email inválido.'
      }
      
      setError(errorMessage)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      setError(null)
      await signOut(auth)
      navigate('/login', { replace: true })
    } catch (error: any) {
      console.error('Error during logout:', error)
      setError('Error al cerrar sesión.')
      throw error
    }
  }

  const value = {
    user,
    loading,
    register,
    login,
    resetPassword,
    logout,
    error
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export { AuthProvider } 
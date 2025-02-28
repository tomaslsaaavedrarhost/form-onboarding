import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { 
  User, 
  signOut as firebaseSignOut,
  signInWithEmailAndPassword,
  onAuthStateChanged
} from 'firebase/auth'
import { auth } from '../lib/firebase'
import { useNavigate, useLocation } from 'react-router-dom'

// List of authorized admin emails
const AUTHORIZED_EMAILS = ['tomas@host.ai', 'tomas@lopezsaavedra.com.ar']

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  error: string | null
  isAuthorized: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAuthorized, setIsAuthorized] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true)
      
      if (firebaseUser) {
        // Check if the user's email is in the authorized list
        const authorized = AUTHORIZED_EMAILS.includes(firebaseUser.email || '')
        setIsAuthorized(authorized)
        
        if (authorized) {
          setUser(firebaseUser)
          
          if (location.pathname === '/login') {
            navigate('/dashboard', { replace: true })
          }
        } else {
          // User is not authorized
          await firebaseSignOut(auth)
          setUser(null)
          setError('You are not authorized to access this admin panel')
          navigate('/login', { replace: true })
        }
      } else {
        setUser(null)
        setIsAuthorized(false)
        
        if (location.pathname !== '/login') {
          navigate('/login', { replace: true })
        }
      }
      
      setLoading(false)
    })
    
    return () => unsubscribe()
  }, [navigate, location.pathname])

  const login = async (email: string, password: string) => {
    setError(null)
    try {
      // Check if the email is authorized before attempting to sign in
      if (!AUTHORIZED_EMAILS.includes(email)) {
        setError('You are not authorized to access this admin panel')
        return
      }
      
      await signInWithEmailAndPassword(auth, email, password)
    } catch (err) {
      setError('Invalid login credentials')
      console.error('Login error:', err)
    }
  }

  const logout = async () => {
    try {
      await firebaseSignOut(auth)
      navigate('/login', { replace: true })
    } catch (err) {
      console.error('Logout error:', err)
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, error, isAuthorized }}>
      {children}
    </AuthContext.Provider>
  )
} 
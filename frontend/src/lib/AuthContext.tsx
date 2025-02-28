import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { 
  User, 
  signOut as firebaseSignOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  onAuthStateChanged
} from 'firebase/auth'
import { auth } from './firebase'
import { useNavigate, useLocation } from 'react-router-dom'

// Interfaz para el usuario de demostración
interface DemoUser {
  isDemoUser: true;
  email: string;
  displayName: string;
  uid: string;
  emailVerified: boolean;
  photoURL: string | null;
  getIdToken: () => Promise<string>;
}

interface AuthContextType {
  user: User | DemoUser | null
  loading: boolean
  register: (email: string, password: string) => Promise<void>
  login: (email: string, password: string) => Promise<void>
  resetPassword: (email: string) => Promise<void>
  logout: () => Promise<void>
  error: string | null
  signOut: () => Promise<void>
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
  const [user, setUser] = useState<User | DemoUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()
  const location = useLocation()

  // Comprobar el usuario de demostración en localStorage
  const checkDemoUser = () => {
    const isDemoUser = localStorage.getItem('demoUser') === 'true';
    if (isDemoUser) {
      return {
        isDemoUser: true as const,
        email: 'demo@example.com',
        displayName: localStorage.getItem('demoUserName') || 'Usuario Demo',
        uid: 'demo-uid',
        emailVerified: true,
        photoURL: null,
        getIdToken: async () => 'demo-token'
      };
    }
    return null;
  };

  useEffect(() => {
    console.log('Setting up auth state listener...')
    
    // Verificar primero si hay un usuario de demostración
    const demoUser = checkDemoUser();
    if (demoUser) {
      setUser(demoUser);
      setLoading(false);
      
      if (location.pathname === '/login') {
        const intendedPath = sessionStorage.getItem('intendedPath') || '/';
        navigate(intendedPath, { replace: true });
        sessionStorage.removeItem('intendedPath');
      }
      return () => {}; // No hay nada que limpiar para demo user
    }
    
    // Si no hay usuario de demostración, continuar con la autenticación normal de Firebase
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('Auth state changed:', {
        hasUser: firebaseUser ? 'Yes' : 'No',
        userEmail: firebaseUser?.email || 'N/A',
        emailVerified: firebaseUser?.emailVerified || false,
      })
      
      if (firebaseUser) {
        if (location.pathname === '/login') {
          const intendedPath = sessionStorage.getItem('intendedPath') || '/'
          console.log('Redirecting to:', intendedPath)
          navigate(intendedPath, { replace: true })
          sessionStorage.removeItem('intendedPath')
        }
      } else if (!firebaseUser && location.pathname !== '/login') {
        // Verificar nuevamente si hay un usuario de demostración (por si acaba de iniciar sesión)
        const demoUser = checkDemoUser();
        if (demoUser) {
          setUser(demoUser);
          setLoading(false);
          return;
        }
        
        console.log('Storing intended path:', location.pathname)
        sessionStorage.setItem('intendedPath', location.pathname)
        
        console.log('Redirecting to login')
        navigate('/login', { replace: true })
      }
      
      setUser(firebaseUser)
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
      
      // Si es un usuario de demostración, simplemente eliminar de localStorage
      if (user && 'isDemoUser' in user) {
        localStorage.removeItem('demoUser');
        localStorage.removeItem('demoUserName');
        setUser(null);
      } else {
        // Logout normal de Firebase
        await firebaseSignOut(auth)
      }
      
      navigate('/login', { replace: true })
    } catch (error: any) {
      console.error('Error during logout:', error)
      setError('Error al cerrar sesión.')
      throw error
    }
  }

  const signOut = async () => {
    try {
      // Si es un usuario de demostración, simplemente eliminar de localStorage
      if (user && 'isDemoUser' in user) {
        localStorage.removeItem('demoUser');
        localStorage.removeItem('demoUserName');
        setUser(null);
      } else {
        // Logout normal de Firebase
        await firebaseSignOut(auth)
      }
    } catch (error: any) {
      console.error('Error signing out:', error)
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
    error,
    signOut
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
} 
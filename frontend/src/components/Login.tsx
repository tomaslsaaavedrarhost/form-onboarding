import React, { useState, useEffect } from 'react'
import { useAuth } from '../lib/AuthContext'
import { auth, googleProvider } from '../lib/firebase'
import { signInWithPopup } from 'firebase/auth'
import { useLocation } from 'react-router-dom'

const Login = () => {
  const { loading: authLoading } = useAuth()
  const [isSigningIn, setIsSigningIn] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const location = useLocation()

  useEffect(() => {
    console.log('Login Component - Initial State:', {
      isLoading: authLoading,
      currentUser: auth.currentUser?.email || 'None',
      provider: googleProvider.providerId,
      currentPath: location.pathname,
      intendedPath: sessionStorage.getItem('intendedPath') || '/',
      state: location.state
    })
  }, [authLoading, location])

  const handleGoogleSignIn = async (e: React.MouseEvent) => {
    e.preventDefault()
    
    if (isSigningIn || authLoading) {
      console.log('Sign in already in progress', {
        isSigningIn,
        authLoading
      })
      return
    }

    console.log('Starting Google sign in process...', {
      currentUser: auth.currentUser?.email || 'None',
      authDomain: auth.config.authDomain,
      provider: googleProvider.providerId,
      intendedPath: sessionStorage.getItem('intendedPath') || '/'
    })

    setIsSigningIn(true)
    setError(null)

    try {
      const result = await signInWithPopup(auth, googleProvider)
      console.log('Sign in successful:', {
        user: result.user.email,
        providerId: result.providerId,
        operationType: result.operationType
      })
    } catch (error: any) {
      console.error('Error during sign in:', {
        code: error.code,
        message: error.message,
        domain: window.location.origin,
        currentPath: location.pathname
      })
      
      let errorMessage = 'Error al iniciar sesión. Por favor, intenta de nuevo.'
      
      if (error.code === 'auth/unauthorized-domain') {
        errorMessage = 'Este dominio no está autorizado para iniciar sesión. Por favor, contacta al administrador.'
        console.error('Unauthorized domain details:', {
          currentDomain: window.location.origin,
          authDomain: auth.config.authDomain,
          allowedDomains: ['localhost', auth.config.authDomain]
        })
      } else if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = 'El proceso de inicio de sesión fue cancelado.'
      } else if (error.code === 'auth/popup-blocked') {
        errorMessage = 'El popup fue bloqueado por el navegador. Por favor, permite ventanas emergentes para este sitio.'
      }
      
      setError(errorMessage)
    } finally {
      setIsSigningIn(false)
    }
  }

  const isLoading = isSigningIn || authLoading

  if (authLoading && !isSigningIn) {
    console.log('Showing loading spinner (initial auth check)')
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-purple"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-lg">
        <div>
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-brand bg-clip-text text-transparent">
            Welcome to Resto Host Onboarding
          </h1>
          <p className="mt-2 text-center text-sm text-gray-600">
            Please sign in to continue
          </p>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <div className="mt-8">
          <button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-brand hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-purple transition-all duration-200 ${
              isLoading ? 'opacity-75 cursor-not-allowed' : ''
            }`}
          >
            <span className="absolute left-0 inset-y-0 flex items-center pl-3">
              {isLoading ? (
                <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <svg className="h-5 w-5 text-white group-hover:text-gray-100" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"
                  />
                </svg>
              )}
            </span>
            {isLoading ? 'Iniciando sesión...' : 'Iniciar sesión con Google'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default Login 
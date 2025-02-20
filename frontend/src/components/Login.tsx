import React, { useState } from 'react'
import { useAuth } from '../lib/AuthContext'
import { Navigate, useLocation } from 'react-router-dom'

const Login = () => {
  const { user, loading, signInWithGoogle } = useAuth()
  const [isSigningIn, setIsSigningIn] = useState(false)
  const location = useLocation()

  const handleGoogleSignIn = async (e: React.MouseEvent) => {
    e.preventDefault()
    
    if (isSigningIn) return

    setIsSigningIn(true)
    try {
      await signInWithGoogle()
    } catch (error) {
      console.error('Error during sign in:', error)
      setIsSigningIn(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-purple"></div>
      </div>
    )
  }

  if (user) {
    const returnTo = location.state?.from?.pathname || '/'
    return <Navigate to={returnTo} replace />
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
        <div className="mt-8">
          <button
            onClick={handleGoogleSignIn}
            disabled={isSigningIn}
            className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-brand hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-purple transition-all duration-200 ${
              isSigningIn ? 'opacity-75 cursor-not-allowed' : ''
            }`}
          >
            <span className="absolute left-0 inset-y-0 flex items-center pl-3">
              {isSigningIn ? (
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
            {isSigningIn ? 'Signing in...' : 'Sign in with Google'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default Login 
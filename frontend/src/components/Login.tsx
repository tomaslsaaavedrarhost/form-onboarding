import React, { useState, useEffect } from 'react'
import { useAuth } from '../lib/AuthContext'

const Login = () => {
  const { user, loading, login, register, resetPassword, error: authError } = useAuth()
  const [isSigningIn, setIsSigningIn] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isRegistering, setIsRegistering] = useState(false)
  const [isResettingPassword, setIsResettingPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  useEffect(() => {
    if (user) {
      window.location.href = '/'
    }
  }, [user])

  useEffect(() => {
    setError(authError)
  }, [authError])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSigningIn) return

    setIsSigningIn(true)
    setError(null)

    try {
      if (isResettingPassword) {
        await resetPassword(email)
        setError('Se ha enviado un email para restablecer tu contraseña.')
        setIsResettingPassword(false)
      } else if (isRegistering) {
        if (password !== confirmPassword) {
          throw new Error('Las contraseñas no coinciden.')
        }
        await register(email, password)
      } else {
        await login(email, password)
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-lg">
        <div>
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-brand bg-clip-text text-transparent">
            {isRegistering ? 'Crear cuenta' : isResettingPassword ? 'Restablecer contraseña' : 'Iniciar sesión'}
          </h1>
          <p className="mt-2 text-center text-sm text-gray-600">
            {isRegistering ? 'Crea una cuenta para continuar' : isResettingPassword ? 'Ingresa tu email para restablecer tu contraseña' : 'Ingresa tus credenciales para continuar'}
          </p>
        </div>
        
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-brand-purple focus:border-brand-purple focus:z-10 sm:text-sm"
                placeholder="Email"
              />
            </div>
            {!isResettingPassword && (
              <div>
                <label htmlFor="password" className="sr-only">Contraseña</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete={isRegistering ? 'new-password' : 'current-password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-brand-purple focus:border-brand-purple focus:z-10 sm:text-sm"
                  placeholder="Contraseña"
                />
              </div>
            )}
            {isRegistering && (
              <div>
                <label htmlFor="confirmPassword" className="sr-only">Confirmar contraseña</label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-brand-purple focus:border-brand-purple focus:z-10 sm:text-sm"
                  placeholder="Confirmar contraseña"
                />
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm">
              <button
                type="button"
                onClick={() => {
                  setIsRegistering(false)
                  setIsResettingPassword(!isResettingPassword)
                  setError(null)
                }}
                className="font-medium text-brand-purple hover:text-brand-purple-dark"
              >
                {isResettingPassword ? 'Volver al inicio de sesión' : '¿Olvidaste tu contraseña?'}
              </button>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isSigningIn}
              className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-brand-purple hover:bg-brand-purple-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-purple ${
                isSigningIn ? 'opacity-75 cursor-not-allowed' : ''
              }`}
            >
              {isSigningIn ? (
                <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
              ) : isResettingPassword ? (
                'Enviar email de recuperación'
              ) : isRegistering ? (
                'Registrarse'
              ) : (
                'Iniciar sesión'
              )}
            </button>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                setIsRegistering(!isRegistering)
                setIsResettingPassword(false)
                setError(null)
              }}
              className="font-medium text-brand-purple hover:text-brand-purple-dark"
            >
              {isRegistering ? '¿Ya tienes una cuenta? Inicia sesión' : '¿No tienes una cuenta? Regístrate'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Login 
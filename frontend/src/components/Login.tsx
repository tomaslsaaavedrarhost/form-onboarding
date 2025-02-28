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
  const [rememberMe, setRememberMe] = useState(false)

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

  const handleDemoAccess = () => {
    // Almacenar un flag en localStorage para indicar que es un acceso de demostración
    localStorage.setItem('demoUser', 'true')
    localStorage.setItem('demoUserName', 'Usuario Demo')
    
    // Crear también la estructura inicial del objeto de datos del formulario
    if (!localStorage.getItem('demoFormData')) {
      localStorage.setItem('demoFormData', JSON.stringify({
        lastUpdated: new Date(),
        // Inicializar campos clave para asegurar su funcionamiento
        language: 'es',
        locationCount: 1,
        businessName: 'Negocio Demo',
        // Agregar otros campos iniciales según sea necesario
        termsAccepted: false,
        menuItems: []
      }))
    } else {
      // Si ya existe, asegurarse de que locationCount esté inicializado
      try {
        const formData = JSON.parse(localStorage.getItem('demoFormData') || '{}')
        if (!formData.locationCount) {
          formData.locationCount = 1
          localStorage.setItem('demoFormData', JSON.stringify(formData))
          console.log('Demo user: Fixed missing locationCount in existing data')
        }
      } catch (error) {
        console.error('Error al procesar los datos de formulario demo:', error)
        // Resetear los datos si hay un error de parsing
        localStorage.setItem('demoFormData', JSON.stringify({
          lastUpdated: new Date(),
          language: 'es',
          locationCount: 1,
          businessName: 'Negocio Demo',
          termsAccepted: false,
          menuItems: []
        }))
      }
    }
    
    // Forzar recarga de la página para que AuthContext detecte el usuario demo
    window.location.href = '/'
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-purple"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 md:p-0">
      <div className="flex flex-col md:flex-row w-full max-w-5xl bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Left Panel - Gradient Background */}
        <div className="w-full md:w-5/12 bg-gradient-brand-reverse flex flex-col justify-center p-12 text-white relative overflow-hidden">
          {/* Abstract Wave Shape */}
          <div className="absolute inset-0 opacity-20">
            <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
              <path fill="#FFFFFF" d="M40.8,-70.3C54.7,-62.5,69.2,-54.5,78.2,-42C87.2,-29.4,90.8,-12.5,88.5,3.3C86.3,19.2,78.2,34,67.5,45.1C56.7,56.2,43.3,63.7,29.3,70.1C15.2,76.5,0.5,81.9,-13.8,79.8C-28.1,77.7,-42,68.2,-54.8,56.9C-67.5,45.6,-79.2,32.5,-83.2,17.4C-87.1,2.3,-83.3,-14.9,-75.8,-29.2C-68.2,-43.5,-56.9,-54.9,-44,-64.6C-31.1,-74.3,-16.6,-82.4,-0.9,-81C14.8,-79.7,26.9,-78.1,40.8,-70.3Z" transform="translate(100 100)" />
            </svg>
          </div>
        </div>
        
        {/* Right Panel - Login Form */}
        <div className="w-full md:w-7/12 p-8 md:p-12 flex flex-col justify-center">
          <div className="max-w-md mx-auto w-full">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">
              {isRegistering ? 'Crear cuenta' : isResettingPassword ? 'Restablecer contraseña' : 'Iniciar sesión'}
            </h2>
            <p className="text-gray-600 mb-8">
              {isRegistering 
                ? 'Completa tus datos para comenzar' 
                : isResettingPassword 
                  ? 'Ingresa tu email para restablecer tu contraseña' 
                  : 'Ingresa tus credenciales para continuar'}
            </p>
            
            {error && (
              <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded-r-md">
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

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="appearance-none block w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-purple focus:border-transparent transition duration-200 shadow-sm"
                    placeholder="usuario@ejemplo.com"
                  />
                </div>
                
                {!isResettingPassword && (
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete={isRegistering ? 'new-password' : 'current-password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="appearance-none block w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-purple focus:border-transparent transition duration-200 shadow-sm"
                      placeholder="••••••••"
                    />
                  </div>
                )}
                
                {isRegistering && (
                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">Confirmar contraseña</label>
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      autoComplete="new-password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="appearance-none block w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-purple focus:border-transparent transition duration-200 shadow-sm"
                      placeholder="••••••••"
                    />
                  </div>
                )}
              </div>

              {!isResettingPassword && !isRegistering && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      id="remember-me"
                      name="remember-me"
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="h-4 w-4 text-brand-purple focus:ring-brand-purple border-gray-300 rounded"
                    />
                    <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                      Recordarme
                    </label>
                  </div>
                  
                  <div className="text-sm">
                    <button
                      type="button"
                      onClick={() => {
                        setIsRegistering(false)
                        setIsResettingPassword(true)
                        setError(null)
                      }}
                      className="font-medium text-brand-purple hover:underline transition-colors duration-200"
                    >
                      ¿Olvidaste tu contraseña?
                    </button>
                  </div>
                </div>
              )}

              {isResettingPassword && (
                <div className="text-sm text-right">
                  <button
                    type="button"
                    onClick={() => {
                      setIsResettingPassword(false)
                      setError(null)
                    }}
                    className="font-medium text-brand-purple hover:underline transition-colors duration-200"
                  >
                    Volver al inicio de sesión
                  </button>
                </div>
              )}

              <div>
                <button
                  type="submit"
                  disabled={isSigningIn}
                  className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-gradient-brand hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-purple shadow-md transition-all duration-200 ${
                    isSigningIn ? 'opacity-75 cursor-not-allowed' : ''
                  }`}
                >
                  {isSigningIn ? (
                    <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                  ) : isResettingPassword ? (
                    'Enviar email de recuperación'
                  ) : isRegistering ? (
                    'Crear cuenta'
                  ) : (
                    'Iniciar sesión'
                  )}
                </button>
              </div>
              
              {/* Botón de acceso de demostración */}
              <div className="mt-4">
                <button
                  type="button"
                  onClick={handleDemoAccess}
                  className="w-full flex justify-center py-3 px-4 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-orange shadow-sm transition-all duration-200"
                >
                  Acceder en modo demostración
                </button>
              </div>

              <div className="text-center mt-6">
                <p className="text-sm text-gray-600">
                  {isRegistering ? '¿Ya tienes una cuenta?' : '¿No tienes una cuenta?'}
                  <button
                    type="button"
                    onClick={() => {
                      setIsRegistering(!isRegistering)
                      setIsResettingPassword(false)
                      setError(null)
                    }}
                    className="ml-1 font-medium text-brand-purple hover:underline transition-colors duration-200"
                  >
                    {isRegistering ? 'Iniciar sesión' : 'Registrarse'}
                  </button>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login 
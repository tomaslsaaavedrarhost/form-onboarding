import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from '../lib/FormContext'
import { useAuth } from '../lib/AuthContext'

export default function LanguageSelection() {
  const navigate = useNavigate()
  const { saveField } = useForm()
  const { user } = useAuth()
  const [error, setError] = useState<string | null>(null)

  const handleLanguageSelection = async (language: string) => {
    try {
      // Guardar el idioma seleccionado
      await saveField('language', language)
      
      // Si es un usuario demo, inicializar también otros campos clave para asegurar su persistencia
      if (user && 'isDemoUser' in user) {
        // Inicializar el campo locationCount si no existe
        const demoFormData = localStorage.getItem('demoFormData')
        if (demoFormData) {
          const parsedData = JSON.parse(demoFormData)
          if (!parsedData.locationCount) {
            // Establecer un valor predeterminado para locationCount
            await saveField('locationCount', 1)
            console.log('Demo user: Initialized locationCount to default value (1)')
          }
        }
      }
      
      // Navegar a la siguiente página
      navigate('/onboarding/legal-data')
    } catch (err) {
      console.error('Error al guardar el idioma:', err)
      setError('Hubo un problema al guardar tu selección. Por favor, inténtalo de nuevo.')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-brand mb-4">
            ¡Bienvenido!
          </h1>
          <p className="text-gray-600 mb-8">
            Por favor, selecciona tu idioma preferido para continuar
          </p>
        </div>
        
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4 rounded-md">
            <p className="text-red-700">{error}</p>
          </div>
        )}
        
        <div className="mt-8 space-y-4">
          <button
            onClick={() => handleLanguageSelection('en')}
            className="group relative w-full flex justify-center py-4 px-4 border border-transparent text-lg font-medium rounded-md text-white bg-gradient-brand hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-purple"
          >
            English
          </button>
          <button
            onClick={() => handleLanguageSelection('es')}
            className="group relative w-full flex justify-center py-4 px-4 border border-transparent text-lg font-medium rounded-md text-white bg-gradient-brand-reverse hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-orange"
          >
            Español
          </button>
        </div>
      </div>
    </div>
  )
} 
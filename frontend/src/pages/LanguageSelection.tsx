import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from '../context/FormContext'

export default function LanguageSelection() {
  const navigate = useNavigate()
  const { dispatch } = useForm()

  const handleLanguageSelection = (language: string) => {
    dispatch({ type: 'SET_LANGUAGE', payload: language })
    navigate('/onboarding/legal-data')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight bg-gradient-brand bg-clip-text text-transparent">
            Welcome / Bienvenido
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Please select your preferred language / Por favor selecciona tu idioma preferido
          </p>
        </div>
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
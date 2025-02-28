import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from '../context/FormContext'
import { useFormProgress } from '../hooks/useFormProgress'
import { useTranslation } from '../hooks/useTranslation'

// Extender la interfaz Window para incluir saveCurrentFormData
declare global {
  interface Window {
    onFormStateChange?: (hasChanges: boolean) => void;
    saveCurrentFormData?: () => Promise<boolean>;
  }
}

export default function LocationDetails() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { state, dispatch } = useForm()
  const { formData, saveFormData } = useFormProgress()
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [showNotification, setShowNotification] = useState(false)
  
  // Simular cambios en el formulario
  useEffect(() => {
    // Este valor debe ser falso al principio, pero después de 5 segundos se pone en true
    // Esto es solo para demostración - en una app real, detectarías cambios reales
    const timer = setTimeout(() => {
      console.log('Simulando cambios en el formulario')
      setHasUnsavedChanges(true)
    }, 5000)
    
    return () => clearTimeout(timer)
  }, [])
  
  // Guardar los datos del formulario
  const handleSave = async () => {
    try {
      console.log('Guardando cambios...')
      
      // Realizar el guardado real aquí
      await saveFormData()
      
      // Actualizar el estado
      setHasUnsavedChanges(false)
      setShowNotification(true)
      setTimeout(() => setShowNotification(false), 3000)
      
      return true
    } catch (error) {
      console.error('Error al guardar:', error)
      return false
    }
  }
  
  // Exponer handleSave a través de window.saveCurrentFormData
  useEffect(() => {
    // Registrar la función global
    window.saveCurrentFormData = async () => {
      console.log('window.saveCurrentFormData llamado')
      try {
        const result = await handleSave()
        console.log('Resultado de handleSave:', result)
        return result
      } catch (e) {
        console.error('Error al guardar los valores del formulario:', e)
        return false
      }
    }
    
    return () => {
      // Limpiar la función global al desmontar
      window.saveCurrentFormData = undefined
    }
  }, [handleSave])
  
  // Notificar al componente padre (OnboardingLayout) sobre los cambios sin guardar
  useEffect(() => {
    if (typeof window.onFormStateChange === 'function') {
      console.log('Notificando cambios sin guardar al OnboardingLayout:', hasUnsavedChanges)
      window.onFormStateChange(hasUnsavedChanges)
    }
  }, [hasUnsavedChanges])

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Location Details - Testing Unsaved Changes</h1>
      
      <div className="bg-white p-6 rounded-lg shadow-md">
        <p>Este es un componente temporal para probar la detección de cambios sin guardar.</p>
        <p>Después de 5 segundos, simularemos que hay cambios sin guardar.</p>
        <p>Estado actual: <span className={hasUnsavedChanges ? "text-red-600 font-bold" : "text-green-600 font-bold"}>
          {hasUnsavedChanges ? "Hay cambios sin guardar" : "No hay cambios sin guardar"}
        </span></p>
        
        {showNotification && (
          <div className="mt-4 p-3 bg-green-100 text-green-800 rounded-md">
            Los cambios han sido guardados correctamente
          </div>
        )}
      </div>
      
      <div className="flex justify-between">
        <button
          onClick={handleSave}
          className={`px-4 py-2 rounded-md ${hasUnsavedChanges ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-700'}`}
          disabled={!hasUnsavedChanges}
        >
          {hasUnsavedChanges ? 'Guardar Cambios' : 'Cambios Guardados'}
        </button>
        
        <div className="flex space-x-4">
          <button
            onClick={() => navigate('/onboarding/contact-info')}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
          >
            {t('back')}
          </button>
          <button 
            onClick={() => navigate('/onboarding/ai-config')}
            className="px-4 py-2 bg-gradient-brand text-white rounded-md hover:opacity-90"
          >
            {t('continue')}
          </button>
        </div>
      </div>
    </div>
  )
}

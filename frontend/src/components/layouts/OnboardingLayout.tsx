import React, { useState, useEffect } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { CheckCircleIcon } from '@heroicons/react/24/solid'
import { useTranslation } from '../../hooks/useTranslation'
import UserProfile from '../UserProfile'
import { useFormProgress } from '../../hooks/useFormProgress'
import logo from '../../assets/unnamed.png'

// Extender la interfaz Window para incluir nuestras propiedades personalizadas
declare global {
  interface Window {
    onFormStateChange?: (hasChanges: boolean) => void;
    saveCurrentFormData?: () => Promise<boolean>; // Función para guardar los datos del formulario actual
  }
}

const getSteps = (t: (key: string) => string) => [
  { name: t('legalDataTitle'), href: '/onboarding/legal-data' },
  { name: t('contactInfoTitle'), href: '/onboarding/contact-info' },
  { name: t('locationDetailsTitle'), href: '/onboarding/location-details' },
  { name: t('aiConfigTitle'), href: '/onboarding/ai-config' },
  { name: t('menuSetupTitle'), href: '/onboarding/menu-config' },
  { name: t('tipsPolicyTitle'), href: '/onboarding/tips-policy' },
  { name: t('observationsTitle'), href: '/onboarding/observations' },
  { name: t('reviewTitle'), href: '/onboarding/review' },
]

export default function OnboardingLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { unsavedChanges, saveFormData } = useFormProgress()
  const [showSavePrompt, setShowSavePrompt] = useState(false)
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null)
  const steps = getSteps(t)
  
  // Estado para almacenar si hay cambios sin guardar en los componentes hijos
  const [childHasUnsavedChanges, setChildHasUnsavedChanges] = useState(false)
  
  // Función para que los componentes hijos puedan comunicar si tienen cambios sin guardar
  useEffect(() => {
    // Crear un método global para que los componentes hijos puedan comunicar sus cambios
    window.onFormStateChange = (hasChanges: boolean) => {
      setChildHasUnsavedChanges(hasChanges)
    }
    
    return () => {
      // Limpiar el método global al desmontar el componente
      delete window.onFormStateChange
    }
  }, [])
  
  // Verificar si hay cambios sin guardar, ya sea en el hook o en los componentes hijos
  const hasAnyUnsavedChanges = unsavedChanges || childHasUnsavedChanges

  // Añadir evento beforeunload para advertir al usuario si intenta cerrar la página con cambios sin guardar
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasAnyUnsavedChanges) {
        // Mensaje estándar que mostrará el navegador
        const message = '¿Estás seguro de que quieres salir? Tienes cambios sin guardar.';
        e.returnValue = message;
        return message;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasAnyUnsavedChanges]);

  // Función para manejar la navegación entre pasos
  const handleStepClick = (href: string) => {
    if (hasAnyUnsavedChanges) {
      // Si hay cambios sin guardar, mostrar el prompt y guardar la navegación pendiente
      setShowSavePrompt(true)
      setPendingNavigation(href)
    } else {
      // Si no hay cambios sin guardar, navegar directamente
      navigate(href)
    }
  }

  // Componente para el modal de confirmación
  const SavePrompt = () => {
    if (!showSavePrompt) return null

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Cambios sin guardar
          </h3>
          <p className="text-gray-600 mb-6">
            Tienes cambios sin guardar. ¿Qué deseas hacer?
          </p>
          <div className="flex justify-end space-x-4">
            <button
              onClick={() => {
                setShowSavePrompt(false)
                setChildHasUnsavedChanges(false)
                if (pendingNavigation) {
                  navigate(pendingNavigation)
                  setPendingNavigation(null)
                }
              }}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
            >
              Continuar sin guardar
            </button>
            <button
              onClick={async () => {
                try {
                  let success = false;
                  
                  // Intentar guardar los datos del formulario actual si existe la función
                  if (typeof window.saveCurrentFormData === 'function') {
                    try {
                      success = await window.saveCurrentFormData();
                      if (!success) {
                        console.error('Error al guardar los datos del formulario con saveCurrentFormData');
                        alert('Error al guardar los datos del formulario. Por favor intenta de nuevo.');
                      }
                    } catch (innerError) {
                      console.error('Excepción al llamar saveCurrentFormData:', innerError);
                      alert('Error al guardar los datos del formulario. Por favor intenta de nuevo.');
                      return;
                    }
                  } else {
                    // Si no existe la función, usar el método del hook
                    try {
                      success = await saveFormData();
                      if (!success) {
                        console.error('Error al guardar los datos del formulario con saveFormData');
                        alert('Error al guardar los datos del formulario. Por favor intenta de nuevo.');
                      }
                    } catch (innerError) {
                      console.error('Excepción al llamar saveFormData:', innerError);
                      alert('Error al guardar los datos del formulario. Por favor intenta de nuevo.');
                      return;
                    }
                  }
                  
                  if (success) {
                    setShowSavePrompt(false);
                    setChildHasUnsavedChanges(false);
                    if (pendingNavigation) {
                      navigate(pendingNavigation);
                      setPendingNavigation(null);
                    }
                  }
                } catch (error) {
                  console.error('Error al guardar los datos del formulario:', error);
                  alert('Error al guardar los datos del formulario. Por favor intenta de nuevo.');
                }
              }}
              className="px-4 py-2 bg-gradient-brand text-white rounded-md hover:opacity-90"
            >
              Guardar y continuar
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex min-h-screen flex-col">
          {/* Header */}
          <header className="py-10">
            <div className="mx-auto max-w-7xl flex justify-between items-center">
              <div className="flex items-center">
                <img 
                  src={logo}
                  alt="RestoHost AI" 
                  className="h-12 w-auto"
                />
              </div>
              <UserProfile />
            </div>
          </header>

          {/* Modal de confirmación */}
          <SavePrompt />

          {/* Steps */}
          <nav aria-label="Progress" className="mb-8">
            <ol role="list" className="space-y-4 md:flex md:space-x-8 md:space-y-0">
              {steps.map((step, index) => {
                const isCurrent = location.pathname === step.href
                const isCompleted = steps.findIndex(s => s.href === location.pathname) > index

                return (
                  <li key={step.name} className="md:flex-1">
                    <div
                      className={`group flex flex-col border-l-4 py-2 pl-4 ${
                        isCurrent ? 'border-brand-purple' : 
                        isCompleted ? 'border-green-500' : 
                        'border-gray-200'
                      } md:border-l-0 md:border-t-4 md:pb-0 md:pl-0 md:pt-4 cursor-pointer hover:bg-gray-50`}
                      onClick={() => handleStepClick(step.href)}
                    >
                      <span className="text-sm font-medium flex items-center">
                        {isCompleted && (
                          <CheckCircleIcon 
                            className="mr-1.5 h-5 w-5 text-green-500" 
                            aria-hidden="true" 
                          />
                        )}
                        <span className={
                          isCurrent ? 'text-brand-purple' :
                          isCompleted ? 'text-green-600' :
                          'text-gray-500'
                        }>
                          {t('step')} {index + 1}
                        </span>
                      </span>
                      <span className={`text-sm font-medium ${
                        isCurrent ? 'text-brand-purple' :
                        isCompleted ? 'text-green-600' :
                        'text-gray-500'
                      }`}>
                        {step.name}
                      </span>
                    </div>
                  </li>
                )
              })}
            </ol>
          </nav>

          {/* Main content */}
          <main className="flex-1">
            <div className="mx-auto max-w-3xl">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  )
} 
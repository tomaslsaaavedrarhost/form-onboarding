import React, { useState, useEffect } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { CheckCircleIcon } from '@heroicons/react/24/solid'
import { useTranslation } from '../../hooks/useTranslation'
import UserProfile from '../UserProfile'
import { useFormProgress } from '../../hooks/useFormProgress'

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
                      console.log('Llamando a window.saveCurrentFormData desde SavePrompt');
                      success = await window.saveCurrentFormData();
                      console.log('Resultado de window.saveCurrentFormData:', success);
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
          <header className="py-8">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <img 
                  src="/logo.png"
                  alt="RestoHost AI" 
                  className="h-12 w-auto"
                />
              </div>
              <UserProfile />
            </div>
          </header>

          {/* Modal de confirmación */}
          <SavePrompt />

          <div className="flex flex-1 mt-4">
            {/* Steps - Vertical Timeline */}
            <nav aria-label="Progress" className="w-64 pr-4 pt-4 hidden md:block sticky top-8 self-start h-full">
              {/* Línea de fondo continua */}
              <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-gray-200 h-full"></div>
              
              <ol role="list" className="relative ml-3 space-y-5">
                {steps.map((step, index) => {
                  const isCurrent = location.pathname === step.href
                  const isCompleted = steps.findIndex(s => s.href === location.pathname) > index
                  
                  // Determinar el inicio y final de cada segmento de la línea
                  // El primer segmento empieza en 0, los siguientes empiezan donde termina el anterior
                  const prevStepCompleted = index > 0 && steps.findIndex(s => s.href === location.pathname) > index-1;
                  
                  return (
                    <li key={step.name} className="relative">
                      {/* Segmento de línea con color según estado */}
                      {index > 0 && (
                        <div 
                          className={`absolute left-0 top-0 h-full w-0.5 -mt-5 ${
                            isCompleted 
                              ? 'bg-gradient-to-b from-green-500 to-green-500' 
                              : isCurrent
                                ? 'bg-gradient-to-b from-green-500 to-orange-400'
                                : prevStepCompleted
                                  ? 'bg-gradient-to-b from-green-500 to-violet-500'
                                  : 'bg-gradient-to-b from-violet-500 to-violet-500'
                          }`}
                          aria-hidden="true" 
                        />
                      )}
                      
                      {/* Circle indicator with gradient and shadow */}
                      <div 
                        className={`absolute -left-2 flex h-5 w-5 items-center justify-center rounded-full shadow-md z-10 ${
                          isCurrent 
                            ? 'bg-gradient-to-r from-orange-400 to-pink-500 shadow-orange-200' 
                            : isCompleted 
                              ? 'bg-gradient-to-r from-green-500 to-emerald-600 shadow-green-200'
                              : 'bg-gradient-to-r from-violet-500 to-indigo-500 shadow-indigo-200'
                        }`}
                        aria-hidden="true"
                      />

                      {/* Step content */}
                      <div 
                        className={`group ml-6 flex cursor-pointer flex-col py-3 pl-4 ${
                          isCurrent ? 'bg-orange-50/30' : ''
                        } rounded-lg hover:bg-gray-50/80 transition-colors duration-200`}
                        onClick={() => handleStepClick(step.href)}
                      >
                        <span className="text-sm font-medium flex items-center">
                          {isCompleted && (
                            <CheckCircleIcon 
                              className="mr-1.5 h-5 w-5 text-green-500" 
                              aria-hidden="true" 
                            />
                          )}
                          <span 
                            className={
                              isCurrent 
                                ? 'text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-pink-500 font-semibold' 
                                : isCompleted 
                                  ? 'text-transparent bg-clip-text bg-gradient-to-r from-green-500 to-emerald-600 font-semibold'
                                  : 'text-transparent bg-clip-text bg-gradient-to-r from-violet-500 to-indigo-500 font-semibold'
                            }
                          >
                            {t('step')} {index + 1}
                          </span>
                        </span>
                        <span 
                          className={`text-sm font-medium mt-1 ${
                            isCurrent 
                              ? 'text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-pink-500 font-semibold' 
                              : isCompleted 
                                ? 'text-transparent bg-clip-text bg-gradient-to-r from-green-500 to-emerald-600 font-semibold'
                                : 'text-transparent bg-clip-text bg-gradient-to-r from-violet-500 to-indigo-500 font-semibold'
                          }`}
                        >
                          {step.name}
                        </span>
                      </div>
                    </li>
                  )
                })}
              </ol>
            </nav>

            {/* Responsive Horizontal Steps for Mobile */}
            <nav aria-label="Progress" className="mb-6 md:hidden relative py-4">
              {/* Línea de fondo continua */}
              <div className="absolute left-0 right-0 h-0.5 bg-gray-200 w-full top-8 -z-10"></div>
              
              <ol role="list" className="flex overflow-x-auto py-2 px-4 hide-scrollbar relative mx-auto">
                {steps.map((step, index) => {
                  const isCurrent = location.pathname === step.href
                  const isCompleted = steps.findIndex(s => s.href === location.pathname) > index
                  
                  // Determinar si el paso anterior está completado
                  const prevCompleted = index > 0 && steps.findIndex(s => s.href === location.pathname) > index-1;
                  
                  return (
                    <li 
                      key={step.name} 
                      className="flex-shrink-0 flex flex-col items-center mx-4 relative z-10"
                      onClick={() => handleStepClick(step.href)}
                    >
                      {/* Connecting line with gradient - visible above the background line */}
                      {index < steps.length - 1 && (
                        <div 
                          className={`h-0.5 absolute left-1/2 right-0 top-4 -mr-4 ${
                            isCompleted 
                              ? 'bg-gradient-to-r from-green-500 to-green-500' 
                              : isCurrent 
                                ? 'bg-gradient-to-r from-orange-400 to-violet-500'
                                : prevCompleted
                                  ? 'bg-gradient-to-r from-green-500 to-violet-500' 
                                  : 'bg-gradient-to-r from-violet-500 to-violet-500'
                          }`}
                          style={{ width: '100%', transform: 'translateX(50%)' }}
                          aria-hidden="true"
                        />
                      )}
                      
                      {/* Step number with gradient background and shadow */}
                      <div 
                        className={`h-8 w-8 rounded-full flex items-center justify-center shadow-md ${
                          isCurrent 
                            ? 'bg-gradient-to-r from-orange-400 to-pink-500 shadow-orange-200' 
                            : isCompleted 
                              ? 'bg-gradient-to-r from-green-500 to-emerald-600 shadow-green-200'
                              : 'bg-gradient-to-r from-violet-500 to-indigo-500 shadow-indigo-200'
                        }`}
                        style={{ zIndex: 20 }}
                      >
                        {isCompleted ? (
                          <CheckCircleIcon className="h-5 w-5 text-white" aria-hidden="true" />
                        ) : (
                          <span className="text-white font-medium">{index + 1}</span>
                        )}
                      </div>
                      
                      {/* Step name (only for current and completed) */}
                      {(isCurrent || isCompleted) && (
                        <span 
                          className={`text-xs font-medium mt-2 max-w-20 text-center ${
                            isCurrent 
                              ? 'text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-pink-500 font-semibold' 
                              : isCompleted 
                                ? 'text-transparent bg-clip-text bg-gradient-to-r from-green-500 to-emerald-600 font-semibold'
                                : 'text-gray-500'
                          }`}
                        >
                          {step.name}
                        </span>
                      )}
                    </li>
                  )
                })}
              </ol>
            </nav>

            {/* Main content with proper spacing */}
            <main className="flex-1 pb-16">
              <div className="max-w-3xl mx-auto px-1 md:px-4">
                <Outlet />
              </div>
            </main>
          </div>
        </div>
      </div>
    </div>
  )
} 
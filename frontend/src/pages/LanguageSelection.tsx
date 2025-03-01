import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from '../lib/FormContext'
import { useAuth } from '../lib/AuthContext'

export default function LanguageSelection() {
  const navigate = useNavigate()
  const { saveField } = useForm()
  const { user } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null)
  const [isAnimating, setIsAnimating] = useState(false)

  const handleLanguageSelection = async (language: string) => {
    try {
      setSelectedLanguage(language)
      setIsAnimating(true)
      
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
      
      // Pequeña pausa para la animación
      setTimeout(() => {
        // Navegar a la siguiente página
        navigate('/onboarding/legal-data')
      }, 800)
    } catch (err) {
      console.error('Error al guardar el idioma:', err)
      setError('Hubo un problema al guardar tu selección. Por favor, inténtalo de nuevo.')
      setIsAnimating(false)
      setSelectedLanguage(null)
    }
  }

  // Efecto para la animación inicial
  useEffect(() => {
    const timer = setTimeout(() => {
      document.getElementById('language-container')?.classList.remove('opacity-0', 'translate-y-4')
      document.getElementById('language-container')?.classList.add('opacity-100', 'translate-y-0')
    }, 100)
    
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 overflow-hidden">
      <div 
        id="language-container"
        className="max-w-4xl w-full transition-all duration-700 ease-out opacity-0 translate-y-4"
      >
        {/* Título principal - Solo bienvenida */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-pink-500 mb-6">
            ¡Bienvenido a RestoHost AI!
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Selecciona tu idioma preferido para comenzar la configuración de tu asistente virtual
          </p>
        </div>
        
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-8 rounded-md max-w-md mx-auto">
            <p className="text-red-700">{error}</p>
          </div>
        )}
        
        {/* Tarjetas de selección de idioma */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto px-4">
          {/* Tarjeta de inglés */}
          <div 
            onClick={() => !isAnimating && handleLanguageSelection('en')}
            className={`
              relative overflow-hidden rounded-2xl bg-white shadow-xl p-8 transition-all duration-500 
              hover:shadow-2xl hover:scale-105 cursor-pointer h-full flex flex-col
              ${selectedLanguage === 'en' ? 'ring-4 ring-orange-400 scale-105' : ''}
              ${isAnimating && selectedLanguage === 'en' ? 'translate-y-4 opacity-0' : ''}
            `}
          >
            {/* Fondo decorativo */}
            <div className="absolute right-0 top-0 h-40 w-40 opacity-10 transform translate-x-8 -translate-y-8">
              <svg viewBox="0 0 200 200" className="h-full w-full text-orange-400" fill="currentColor">
                <path d="M61.4,27.7c-0.2,0.3-0.5,0.6-0.8,0.9c-10.3-1.6-12.8,3-12.8,3c-0.4,1-0.6,2-0.5,3c-2.7,3.5-1.6,6.6-1.6,6.6
                c-0.7,3.8,0.6,6.4,0.6,6.4c1.3,4.4,4.9,5.7,4.9,5.7l0.1,0c-0.4,1.4-0.7,2.6-0.7,2.6c-3.2,14.1,1.8,16,1.8,16h0c0.2,1.3,0.5,2.3,0.8,3.1
                C46.6,92.4,46.8,150,46.8,150h12.5c0,0,0-52.8,5.5-69c5.4-16.2,13.4-14.6,13.4-14.6s7.8-1.6,13.4,14.6c5.5,16.3,5.5,69,5.5,69
                h12.5c0,0,0.2-57.6-6.6-74.9c0.3-0.9,0.6-1.8,0.8-3.1h0c0,0,5-1.9,1.8-16c0,0-0.2-1.2-0.7-2.6l0.1,0c0,0,3.6-1.3,4.9-5.7
                c0,0,1.3-2.5,0.6-6.4c0,0,1.1-3.1-1.6-6.6c0.1-1-0.1-2-0.5-3c0,0-2.5-4.6-12.8-3c-0.3-0.3-0.6-0.6-0.8-0.9c0,0-8.6-1.5-18.9,7.7
                C70,26.2,61.4,27.7,61.4,27.7z M101.2,59.3H82.8v7.4H90v14.6h4.1V66.8h7.1V59.3z M70.4,74.1H61v7.2h9.4V74.1z M117.6,74.1h-9.4v7.2
                h9.4V74.1z"/>
              </svg>
            </div>
            
            <div className="relative z-10 flex flex-col flex-grow">
              {/* Icono y título */}
              <div className="flex items-center mb-6">
                <div className="p-4 rounded-full bg-gradient-to-r from-orange-400 to-pink-500 text-white mr-5 shadow-md flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-pink-500">
                  English
                </h3>
              </div>
              
              {/* Descripción - Ajustada para tener la misma altura que español */}
              <div className="flex-grow">
                <p className="text-gray-600 mb-6 text-lg">
                  Set up your virtual assistant in English.<br/>
                  All menus and interactions will be in English.<br/>
                  Perfect for English-speaking customers.
                </p>
              </div>
              
              {/* Botón - Con clase mt-auto para alinearlo al fondo */}
              <div className="mt-auto">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    !isAnimating && handleLanguageSelection('en');
                  }}
                  className="w-full py-4 px-6 bg-gradient-to-r from-orange-400 to-pink-500 text-white rounded-xl font-medium text-lg shadow-md hover:opacity-90 transition-all duration-300 flex items-center justify-center"
                  disabled={isAnimating}
                >
                  <span>Select English</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
          
          {/* Tarjeta de español */}
          <div 
            onClick={() => !isAnimating && handleLanguageSelection('es')}
            className={`
              relative overflow-hidden rounded-2xl bg-white shadow-xl p-8 transition-all duration-500 
              hover:shadow-2xl hover:scale-105 cursor-pointer h-full flex flex-col
              ${selectedLanguage === 'es' ? 'ring-4 ring-pink-500 scale-105' : ''}
              ${isAnimating && selectedLanguage === 'es' ? 'translate-y-4 opacity-0' : ''}
            `}
          >
            {/* Fondo decorativo */}
            <div className="absolute right-0 top-0 h-40 w-40 opacity-10 transform translate-x-8 -translate-y-8">
              <svg viewBox="0 0 512 512" className="h-full w-full text-pink-500" fill="currentColor">
                <path d="M256,0c-11.317,0-20.682,4.343-25.78,13.033c-2.558,4.363-4.152,9.908-4.724,16.553
                c-0.856-0.043-1.717-0.066-2.585-0.066c-12.76,0-23.035,4.469-28.745,12.538c-5.708,8.066-6.624,18.891-2.584,30.489
                c-5.417,2.535-10.164,5.877-13.886,9.864c-7.448,7.998-10.242,18.47-7.853,29.464c-9.192,4.32-16.542,10.901-21.219,18.784
                c-5.708,9.623-6.953,20.876-3.5,31.742c-10.237,5.592-18.348,13.774-22.911,23.066c-4.567,9.294-5.538,19.96-2.739,30.177
                c-11.002,6.859-19.532,16.659-23.991,27.764c-4.459,11.1-5.106,23.469-1.824,34.921c-11.409,8.133-20.115,19.546-24.279,32.37
                c-4.567,14.098-3.99,29.598,1.624,43.708c-11.273,9.413-19.739,22.419-23.424,36.892C42.812,371.566,43.54,387.331,49.5,401.5
                C37.836,413.043,30,429.312,30,447c0,17.689,7.837,33.959,19.5,45.5C88.583,504.5,196.012,512,256,512
                c61.212,0,176.5-6.5,214-19.5c11.662-11.542,19.5-27.811,19.5-45.5c0-17.688-7.838-33.957-19.5-45.5
                c5.959-14.169,6.688-29.934,2.04-44.2c-3.686-14.475-12.152-27.48-23.425-36.894c5.615-14.109,6.192-29.609,1.624-43.706
                c-4.162-12.825-12.87-24.238-24.279-32.372c3.283-11.451,2.635-23.82-1.825-34.919c-4.459-11.105-12.988-20.905-23.991-27.764
                c2.799-10.217,1.827-20.882-2.738-30.177c-4.563-9.292-12.675-17.474-22.911-23.066c3.453-10.866,2.207-22.119-3.501-31.742
                c-4.678-7.883-12.026-14.463-21.219-18.784c2.389-10.994-0.405-21.466-7.853-29.464c-3.72-3.99-8.468-7.33-13.886-9.864
                c4.041-11.598,3.125-22.422-2.583-30.489c-5.71-8.069-15.986-12.538-28.747-12.538c-0.867,0-1.729,0.022-2.585,0.066
                c-0.573-6.645-2.166-12.19-4.723-16.553C276.682,4.343,267.317,0,256,0z"/>
              </svg>
            </div>
            
            <div className="relative z-10 flex flex-col flex-grow">
              {/* Icono y título */}
              <div className="flex items-center mb-6">
                <div className="p-4 rounded-full bg-gradient-to-r from-pink-500 to-orange-400 text-white mr-5 shadow-md flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-orange-400">
                  Español
                </h3>
              </div>
              
              {/* Descripción - Con la misma altura que inglés */}
              <div className="flex-grow">
                <p className="text-gray-600 mb-6 text-lg">
                  Configura tu asistente virtual en español.<br/>
                  Todos los menús e interacciones estarán en español.<br/>
                  Ideal para clientes hispanohablantes.
                </p>
              </div>
              
              {/* Botón - Con clase mt-auto para alinearlo al fondo */}
              <div className="mt-auto">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    !isAnimating && handleLanguageSelection('es');
                  }}
                  className="w-full py-4 px-6 bg-gradient-to-r from-pink-500 to-orange-400 text-white rounded-xl font-medium text-lg shadow-md hover:opacity-90 transition-all duration-300 flex items-center justify-center"
                  disabled={isAnimating}
                >
                  <span>Seleccionar Español</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Nota de pie de página */}
        <div className="text-center mt-12 text-gray-500 text-sm">
          <p>Puedes cambiar el idioma más adelante en la configuración</p>
        </div>
      </div>
    </div>
  )
} 
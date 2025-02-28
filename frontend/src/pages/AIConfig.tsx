import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Formik, Form, Field } from 'formik'
import * as Yup from 'yup'
import { useForm } from '../context/FormContext'
import { useTranslation } from '../hooks/useTranslation'
import { useFormProgress } from '../hooks/useFormProgress'
import { Notification } from '../components/Notification'

// Extender la interfaz Window para incluir saveCurrentFormData
declare global {
  interface Window {
    onFormStateChange?: (hasChanges: boolean) => void;
    saveCurrentFormData?: () => Promise<boolean>;
  }
}

const validationSchema = Yup.object().shape({
  language: Yup.string().required('Language is required'),
  assistantName: Yup.string(),
  assistantGender: Yup.string()
    .required('Assistant gender is required')
    .oneOf(['male', 'female', 'neutral'], 'Invalid gender selection'),
  personality: Yup.array()
    .of(Yup.string())
    .min(1, 'Seleccione al menos una personalidad')
    .max(3, 'Seleccione como máximo 3 personalidades')
    .required('Personality trait is required'),
  otherPersonality: Yup.string().when('personality', {
    is: (personalities: string[]) => personalities && personalities.includes('other'),
    then: () => Yup.string().required('Please describe the personality'),
    otherwise: () => Yup.string(),
  }),
  additionalInfo: Yup.string(),
})

interface FormValues {
  language: string
  otherLanguage: string
  assistantName: string
  assistantGender: string
  personality: string[]
  otherPersonality: string
  additionalInfo: string
}

const languages = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
]

const genderOptions = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'neutral', label: 'Gender Neutral' },
]

const personalityTraits = [
  { value: 'warm', label: 'Warm' },
  { value: 'formal', label: 'Formal' },
  { value: 'friendly', label: 'Friendly' },
  { value: 'professional', label: 'Professional' },
  { value: 'casual', label: 'Casual' },
  { value: 'enthusiastic', label: 'Enthusiastic' },
  { value: 'other', label: 'Other' },
]

export default function AIConfig() {
  const navigate = useNavigate()
  const { state, dispatch } = useForm()
  const { t } = useTranslation()
  const { saveFormData } = useFormProgress()
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [showSavePrompt, setShowSavePrompt] = useState(false)
  const [showNotification, setShowNotification] = useState(false)
  const [maxPersonalitiesError, setMaxPersonalitiesError] = useState(false)

  const initialValues: FormValues = {
    language: state.aiConfig?.language || 'en',
    otherLanguage: state.aiConfig?.otherLanguage || '',
    assistantName: state.aiConfig?.assistantName || '',
    assistantGender: state.aiConfig?.assistantGender || '',
    personality: Array.isArray(state.aiConfig?.personality) 
      ? state.aiConfig.personality 
      : state.aiConfig?.personality 
        ? [state.aiConfig.personality] 
        : [],
    otherPersonality: state.aiConfig?.otherPersonality || '',
    additionalInfo: state.aiConfig?.additionalInfo || '',
  }

  const handleFieldChange = (field: string, value: any) => {
    setHasUnsavedChanges(true)
    dispatch({
      type: 'SET_AI_CONFIG',
      payload: {
        ...state.aiConfig,
        [field]: value,
        avatar: null
      }
    })
  }

  // Comunicar cambios al componente padre
  useEffect(() => {
    if (window.onFormStateChange) {
      window.onFormStateChange(hasUnsavedChanges);
    }
  }, [hasUnsavedChanges]);

  const handleSave = useCallback(async (values: FormValues) => {
    try {
      // Asegurarse que personality es un array
      const personalityArray = Array.isArray(values.personality) ? values.personality : [values.personality];
      
      dispatch({
        type: 'SET_AI_CONFIG',
        payload: {
          ...values,
          personality: personalityArray,
          avatar: null
        }
      })
      await saveFormData()
      setHasUnsavedChanges(false)
      setShowNotification(true)
      setTimeout(() => setShowNotification(false), 3000)
      return true; // Indicar que el guardado fue exitoso
    } catch (error) {
      console.error('Error al guardar:', error)
      return false;
    }
  }, [dispatch, saveFormData, setHasUnsavedChanges, setShowNotification]);

  // Exponer handleSave a través de window.saveCurrentFormData
  useEffect(() => {
    window.saveCurrentFormData = async () => {
      // Obtenemos los valores actuales del formulario
      const formikContext = document.querySelector('form')?.getAttribute('data-formik-values');
      if (formikContext) {
        try {
          const values = JSON.parse(formikContext);
          return await handleSave(values);
        } catch (e) {
          console.error('Error al parsear los valores del formulario:', e);
          return false;
        }
      }
      return false;
    };
    
    return () => {
      window.saveCurrentFormData = undefined;
    };
  }, [handleSave]);

  const handleNext = (values: FormValues) => {
    if (hasUnsavedChanges) {
      setShowSavePrompt(true)
    } else {
      // Asegurarse que personality es un array
      const personalityArray = Array.isArray(values.personality) ? values.personality : [values.personality];
      
      dispatch({
        type: 'SET_AI_CONFIG',
        payload: {
          ...values,
          personality: personalityArray,
          avatar: null
        }
      })
      navigate('/onboarding/menu-config')
    }
  }

  return (
    <div className="min-h-screen bg-white px-4 py-8 pb-24">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800 bg-gradient-to-r from-brand-orange to-brand-purple bg-clip-text text-transparent">
            Configuración del Asistente Virtual
          </h2>
          <p className="mt-3 text-gray-600">
            Configure los diferentes aspectos de su asistente virtual para su restaurante.
          </p>
        </div>

        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleNext}
        >
          {({ values, errors, touched, setFieldValue }) => (
            <Form className="space-y-6" data-formik-values={JSON.stringify(values)}>
              {showNotification && (
                <Notification
                  message="Los cambios han sido guardados correctamente"
                  onClose={() => setShowNotification(false)}
                />
              )}

              {showSavePrompt && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 shadow-xl">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      Cambios sin guardar
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Tienes cambios sin guardar. ¿Qué deseas hacer?
                    </p>
                    <div className="flex justify-end space-x-4">
                      <button
                        type="button"
                        onClick={() => {
                          setShowSavePrompt(false);
                          handleNext(values);
                        }}
                        className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Continuar sin guardar
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            const personalityArray = Array.isArray(values.personality) ? values.personality : [values.personality];
                            
                            dispatch({
                              type: 'SET_AI_CONFIG',
                              payload: {
                                ...values,
                                personality: personalityArray,
                                avatar: null
                              }
                            });
                            const success = await saveFormData();
                            if (success) {
                              setShowSavePrompt(false);
                              setHasUnsavedChanges(false);
                              navigate('/onboarding/menu-config');
                            }
                          } catch (e) {
                            console.error('Error al guardar los datos:', e);
                          }
                        }}
                        className="px-5 py-2.5 bg-gradient-to-r from-brand-orange to-brand-purple text-white rounded-lg hover:opacity-90 transition-colors"
                      >
                        Guardar y continuar
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Idioma Principal */}
              <div className="bg-white shadow rounded-lg overflow-hidden relative p-6">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-brand-orange to-brand-purple flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"></path>
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800">Idioma Principal</h3>
                </div>
                
                <div className="pl-16">
                  <p className="text-gray-600 mb-4">
                    Selecciona el idioma principal en el que el asistente se comunicará
                  </p>
                  <Field
                    as="select"
                    id="language"
                    name="language"
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-orange focus:ring-brand-orange py-3 px-4"
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                      const value = e.target.value;
                      setFieldValue('language', value);
                      handleFieldChange('language', value);
                    }}
                  >
                    <option value="">Selecciona el idioma principal...</option>
                    {languages.map(lang => (
                      <option key={lang.value} value={lang.value}>
                        {lang.label}
                      </option>
                    ))}
                  </Field>
                  {errors.language && touched.language && (
                    <p className="mt-2 text-sm text-red-600">{errors.language}</p>
                  )}
                </div>
              </div>

              {/* Nombre del Asistente */}
              <div className="bg-white shadow rounded-lg overflow-hidden relative p-6">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-brand-orange to-brand-purple flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800">Nombre del Asistente</h3>
                </div>
                
                <div className="pl-16">
                  <p className="text-gray-600 mb-4">
                    Personaliza el nombre de tu asistente virtual o deja en blanco para usar el nombre por defecto
                  </p>
                  <Field
                    type="text"
                    id="assistantName"
                    name="assistantName"
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-orange focus:ring-brand-orange py-3 px-4"
                    placeholder="Ej: María, Alex"
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      const value = e.target.value;
                      setFieldValue('assistantName', value);
                      handleFieldChange('assistantName', value);
                    }}
                  />
                </div>
              </div>

              {/* Género del Asistente */}
              <div className="bg-white shadow rounded-lg overflow-hidden relative p-6">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-brand-orange to-brand-purple flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800">Género del Asistente</h3>
                </div>
                
                <div className="pl-16">
                  <p className="text-gray-600 mb-4">
                    Selecciona el género que mejor represente a tu asistente virtual
                  </p>
                  <div className="grid grid-cols-3 gap-4">
                    {genderOptions.map(gender => (
                      <label
                        key={gender.value}
                        className={`
                          flex flex-col items-center justify-center p-4 rounded-lg cursor-pointer
                          ${values.assistantGender === gender.value 
                            ? 'bg-gradient-to-br from-brand-orange/10 to-brand-purple/10 border-2 border-brand-purple' 
                            : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
                          }
                          transition-all duration-200
                        `}
                      >
                        <div className={`
                          w-12 h-12 rounded-full flex items-center justify-center mb-2
                          ${values.assistantGender === gender.value 
                            ? 'bg-gradient-to-r from-brand-orange to-brand-purple' 
                            : 'bg-gray-200'
                          }
                        `}>
                          {gender.value === 'male' && (
                            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"></path>
                            </svg>
                          )}
                          {gender.value === 'female' && (
                            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"></path>
                            </svg>
                          )}
                          {gender.value === 'neutral' && (
                            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"></path>
                            </svg>
                          )}
                        </div>
                        <span className={`text-sm font-medium ${values.assistantGender === gender.value ? 'text-brand-purple' : 'text-gray-700'}`}>
                          {gender.label}
                        </span>
                        <input
                          type="radio"
                          name="assistantGender"
                          value={gender.value}
                          checked={values.assistantGender === gender.value}
                          onChange={(e) => {
                            setFieldValue('assistantGender', e.target.value);
                            handleFieldChange('assistantGender', e.target.value);
                          }}
                          className="sr-only"
                        />
                      </label>
                    ))}
                  </div>
                  {errors.assistantGender && touched.assistantGender && (
                    <p className="mt-2 text-sm text-red-600">{errors.assistantGender}</p>
                  )}
                </div>
              </div>

              {/* Personalidad */}
              <div className="bg-white shadow rounded-lg overflow-hidden relative p-6">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-brand-orange to-brand-purple flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800">Personalidad</h3>
                </div>
                
                <div className="pl-16">
                  <p className="text-gray-600 mb-4">
                    Define el estilo de comunicación y la personalidad de tu asistente (selecciona hasta 3)
                  </p>
                  
                  {maxPersonalitiesError && (
                    <p className="mb-4 text-sm font-medium text-brand-orange">
                      Solo puedes seleccionar hasta 3 personalidades
                    </p>
                  )}
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
                    {personalityTraits.map(trait => (
                      <label
                        key={trait.value}
                        className={`
                          relative flex items-center p-4 rounded-lg cursor-pointer
                          ${values.personality.includes(trait.value) 
                            ? 'bg-gradient-to-br from-brand-orange/10 to-brand-purple/10 border-2 border-brand-purple' 
                            : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
                          }
                          transition-all duration-200
                        `}
                      >
                        <input
                          type="checkbox"
                          name={`personality-${trait.value}`}
                          value={trait.value}
                          checked={values.personality.includes(trait.value)}
                          onChange={(e) => {
                            const isChecked = e.target.checked;
                            const value = trait.value;
                            let newPersonality = [...values.personality];
                            
                            if (isChecked && newPersonality.length < 3) {
                              newPersonality.push(value);
                              setMaxPersonalitiesError(false);
                            } else if (isChecked && newPersonality.length >= 3) {
                              setMaxPersonalitiesError(true);
                              return;
                            } else {
                              newPersonality = newPersonality.filter(p => p !== value);
                              setMaxPersonalitiesError(false);
                            }
                            
                            setFieldValue('personality', newPersonality);
                            handleFieldChange('personality', newPersonality);
                          }}
                          className="h-5 w-5 text-brand-purple border-gray-300 rounded mr-3 focus:ring-brand-purple"
                        />
                        <span className={`text-base font-medium ${values.personality.includes(trait.value) ? 'text-brand-purple' : 'text-gray-700'}`}>
                          {trait.label}
                        </span>
                      </label>
                    ))}
                  </div>
                  
                  {errors.personality && touched.personality && (
                    <p className="mt-2 text-sm text-red-600">{errors.personality}</p>
                  )}
                  
                  {values.personality.includes('other') && (
                    <div className="mt-4">
                      <label htmlFor="otherPersonality" className="block text-sm font-medium text-gray-700">
                        Describe la personalidad <span className="text-red-500">*</span>
                      </label>
                      <Field
                        type="text"
                        id="otherPersonality"
                        name="otherPersonality"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-orange focus:ring-brand-orange py-2 px-3"
                        placeholder="Describe la personalidad deseada..."
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          const value = e.target.value;
                          setFieldValue('otherPersonality', value);
                          handleFieldChange('otherPersonality', value);
                        }}
                      />
                      {errors.otherPersonality && touched.otherPersonality && (
                        <p className="mt-2 text-sm text-red-600">{errors.otherPersonality}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Información Adicional */}
              <div className="bg-white shadow rounded-lg overflow-hidden relative p-6">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-brand-orange to-brand-purple flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800">Información Adicional</h3>
                </div>
                
                <div className="pl-16">
                  <p className="text-gray-600 mb-4">
                    Agrega cualquier información adicional que ayude a personalizar mejor tu asistente virtual
                  </p>
                  <Field
                    as="textarea"
                    id="additionalInfo"
                    name="additionalInfo"
                    rows={4}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-orange focus:ring-brand-orange py-3 px-4"
                    placeholder="Ej: Preferencias específicas de comunicación, temas a evitar, etc."
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                      const value = e.target.value;
                      setFieldValue('additionalInfo', value);
                      handleFieldChange('additionalInfo', value);
                    }}
                  />
                </div>
              </div>

              {/* Barra fija de botones en la parte inferior */}
              <div className="fixed bottom-0 left-0 right-0 py-4 px-6 bg-white border-t border-gray-200 flex justify-between items-center z-10">
                {!hasUnsavedChanges ? (
                  <div className="flex items-center bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded-lg">
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                    </svg>
                    <div>
                      <div className="font-medium">Cambios guardados</div>
                      <div className="text-xs text-green-600">Todo está al día</div>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => navigate('/onboarding/location-details')}
                    className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Atrás
                  </button>
                )}

                <div className="flex space-x-4">
                  {hasUnsavedChanges ? (
                    <button
                      type="button"
                      onClick={() => handleSave(values)}
                      className="px-6 py-3 bg-white border border-brand-orange text-brand-orange font-medium rounded-lg hover:bg-orange-50 transition-colors"
                    >
                      Guardar cambios
                    </button>
                  ) : (
                    <div className="px-6 py-3 bg-gray-100 text-gray-500 font-medium rounded-lg">
                      Cambios guardados
                    </div>
                  )}
                  <button
                    type="submit"
                    className="px-6 py-3 bg-gradient-to-r from-brand-orange to-brand-purple text-white font-medium rounded-lg hover:opacity-90 transition-colors"
                  >
                    Continuar
                  </button>
                </div>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  )
} 
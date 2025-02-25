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
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">Configuración del Asistente Virtual</h2>
        <p className="mt-2 text-sm text-gray-600">
          Personaliza la experiencia de tu asistente virtual para que se alinee con la identidad de tu restaurante
        </p>
      </div>

      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleNext}
      >
        {({ values, errors, touched, setFieldValue }) => (
          <Form className="space-y-8" data-formik-values={JSON.stringify(values)}>
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
                      className="btn-secondary"
                    >
                      Continuar sin guardar
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          // Asegurarse que personality es un array
                          const personalityArray = Array.isArray(values.personality) ? values.personality : [values.personality];
                          
                          // Guardamos primero los valores actuales en el contexto
                          dispatch({
                            type: 'SET_AI_CONFIG',
                            payload: {
                              ...values,
                              personality: personalityArray,
                              avatar: null
                            }
                          });
                          // Usamos directamente saveFormData
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
                      className="btn-primary"
                    >
                      Guardar y continuar
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="p-6 space-y-6">
                <div>
                  <label htmlFor="language" className="block text-sm font-medium text-gray-700">
                    Idioma Principal<span className="text-red-500">*</span>
                  </label>
                  <p className="mt-1 text-sm text-gray-500">
                    Selecciona el idioma principal en el que el asistente se comunicará
                  </p>
                  <Field
                    as="select"
                    id="language"
                    name="language"
                    className="mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-orange focus:ring-brand-orange sm:text-sm"
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

                <div>
                  <label htmlFor="assistantName" className="block text-sm font-medium text-gray-700">
                    Nombre del Asistente
                  </label>
                  <p className="mt-1 text-sm text-gray-500">
                    Personaliza el nombre de tu asistente virtual o deja en blanco para usar el nombre por defecto
                  </p>
                  <Field
                    type="text"
                    id="assistantName"
                    name="assistantName"
                    className="mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-orange focus:ring-brand-orange sm:text-sm"
                    placeholder="Ej: María, Alex"
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      const value = e.target.value;
                      setFieldValue('assistantName', value);
                      handleFieldChange('assistantName', value);
                    }}
                  />
                </div>

                <div>
                  <label htmlFor="assistantGender" className="block text-sm font-medium text-gray-700">
                    Género del Asistente<span className="text-red-500">*</span>
                  </label>
                  <p className="mt-1 text-sm text-gray-500">
                    Selecciona el género que mejor represente a tu asistente virtual
                  </p>
                  <Field
                    as="select"
                    id="assistantGender"
                    name="assistantGender"
                    className="mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-orange focus:ring-brand-orange sm:text-sm"
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                      const value = e.target.value;
                      setFieldValue('assistantGender', value);
                      handleFieldChange('assistantGender', value);
                    }}
                  >
                    <option value="">Selecciona el género...</option>
                    {genderOptions.map(gender => (
                      <option key={gender.value} value={gender.value}>
                        {gender.label}
                      </option>
                    ))}
                  </Field>
                  {errors.assistantGender && touched.assistantGender && (
                    <p className="mt-2 text-sm text-red-600">{errors.assistantGender}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="personality" className="block text-sm font-medium text-gray-700">
                    Personalidad<span className="text-red-500">*</span>
                  </label>
                  <p className="mt-1 text-sm text-gray-500">
                    Define el estilo de comunicación y la personalidad de tu asistente (selecciona hasta 3)
                  </p>
                  {maxPersonalitiesError && (
                    <p className="mt-2 text-sm text-brand-orange font-medium">
                      Solo puedes seleccionar hasta 3 personalidades
                    </p>
                  )}
                  <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {personalityTraits.map(trait => (
                      <label
                        key={trait.value}
                        className={`relative flex cursor-pointer rounded-lg border p-4 shadow-sm focus:outline-none ${
                          values.personality.includes(trait.value)
                            ? 'border-brand-purple ring-2 ring-brand-purple bg-gradient-to-r from-brand-purple/5 to-brand-orange/5'
                            : 'border-gray-300'
                        }`}
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
                              // Agregar el valor si está marcado y hay menos de 3 seleccionados
                              newPersonality.push(value);
                              setMaxPersonalitiesError(false);
                            } else if (isChecked && newPersonality.length >= 3) {
                              // Si ya hay 3 seleccionados, mostrar mensaje de error
                              setMaxPersonalitiesError(true);
                              return;
                            } else {
                              // Eliminar el valor si está desmarcado
                              newPersonality = newPersonality.filter(p => p !== value);
                              setMaxPersonalitiesError(false);
                            }
                            
                            setFieldValue('personality', newPersonality);
                            handleFieldChange('personality', newPersonality);
                          }}
                          className="h-4 w-4 mr-2 text-brand-purple border-gray-300 rounded focus:ring-brand-orange checked:bg-gradient-brand-reverse"
                        />
                        <span className="flex flex-1">
                          <span className="flex flex-col">
                            <span className={`block text-sm font-medium ${values.personality.includes(trait.value) ? 'text-brand-purple' : 'text-gray-900'}`}>
                              {trait.label}
                            </span>
                          </span>
                        </span>
                      </label>
                    ))}
                  </div>
                  {errors.personality && touched.personality && (
                    <p className="mt-2 text-sm text-red-600">{errors.personality}</p>
                  )}
                </div>

                {values.personality.includes('other') && (
                  <div>
                    <label htmlFor="otherPersonality" className="block text-sm font-medium text-gray-700">
                      Describe la personalidad<span className="text-red-500">*</span>
                    </label>
                    <Field
                      type="text"
                      id="otherPersonality"
                      name="otherPersonality"
                      className="mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-orange focus:ring-brand-orange sm:text-sm"
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

                <div>
                  <label htmlFor="additionalInfo" className="block text-sm font-medium text-gray-700">
                    Información Adicional
                  </label>
                  <p className="mt-1 text-sm text-gray-500">
                    Agrega cualquier información adicional que ayude a personalizar mejor tu asistente virtual
                  </p>
                  <Field
                    as="textarea"
                    id="additionalInfo"
                    name="additionalInfo"
                    rows={4}
                    className="mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-orange focus:ring-brand-orange sm:text-sm"
                    placeholder="Ej: Preferencias específicas de comunicación, temas a evitar, etc."
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                      const value = e.target.value;
                      setFieldValue('additionalInfo', value);
                      handleFieldChange('additionalInfo', value);
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-6">
              <button
                type="button"
                onClick={() => navigate('/onboarding/location-details')}
                className="btn-secondary"
              >
                Atrás
              </button>
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => handleSave(values)}
                  className={hasUnsavedChanges ? 'btn-unsaved' : 'btn-saved'}
                  disabled={!hasUnsavedChanges}
                >
                  {hasUnsavedChanges ? 'Guardar cambios' : 'Cambios guardados'}
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                >
                  Continuar
                </button>
              </div>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  )
} 
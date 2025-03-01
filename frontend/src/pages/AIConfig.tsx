import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Formik, Form, Field, FormikProps } from 'formik'
import * as Yup from 'yup'
import { useForm } from '../context/FormContext'
import { useTranslation } from '../hooks/useTranslation'
import useFormProgress, { refreshFormData } from '../hooks/useFormProgress'
import { Notification } from '../components/Notification'

// Extender la interfaz Window para incluir saveCurrentFormData y validateCurrentStep
declare global {
  interface Window {
    onFormStateChange?: (hasChanges: boolean) => void;
    saveCurrentFormData?: () => Promise<boolean>;
    validateCurrentStep?: () => boolean;
  }
}

const validationSchema = Yup.object().shape({
  language: Yup.string().required('El idioma es obligatorio'),
  assistantName: Yup.string().required('El nombre del asistente es obligatorio'),
  assistantGender: Yup.string()
    .required('El género del asistente es obligatorio')
    .oneOf(['male', 'female'], 'Selección de género inválida'),
  personality: Yup.array()
    .of(Yup.string())
    .min(1, 'Seleccione al menos una personalidad')
    .max(3, 'Seleccione como máximo 3 personalidades')
    .required('Se requiere al menos un rasgo de personalidad'),
  otherPersonality: Yup.string().when('personality', {
    is: (personalities: string[]) => personalities && personalities.includes('other'),
    then: () => Yup.string().required('Por favor describe la personalidad'),
    otherwise: () => Yup.string(),
  }),
  additionalInfo: Yup.string(), // Este campo sigue siendo opcional
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

// Eliminando la opción "gender neutral" del selector de género
const genderOptions = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
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
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const formikRef = useRef<FormikProps<FormValues>>(null)
  const [isInitializing, setIsInitializing] = useState(true)
  const [initialFormValues, setInitialFormValues] = useState<FormValues | null>(null)
  const saveTimeout = useRef<NodeJS.Timeout | undefined>(undefined)
  const isFormInitialized = useRef(false)
  // Flag to prevent context updates from triggering form changes
  const skipFormUpdate = useRef(false)

  // Ensure personality is always an array
  const ensureArray = (value: any): string[] => {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    return [value];
  };

  // Load initial data only once when component mounts
  useEffect(() => {
    const loadInitialData = async () => {
      if (isFormInitialized.current) return;
      
      setIsInitializing(true);
      console.log("Initializing form for the first time");
      
      try {
        // Load data from localStorage or API
        const loadedData = await refreshFormData();
        console.log("Loaded form data:", loadedData);
        
        let formValues: FormValues;
        
        // If we have data from context, use that as initial values
        if (state.aiConfig && Object.keys(state.aiConfig).length > 0) {
          console.log("Using aiConfig from context for initial values:", state.aiConfig);
          formValues = {
            language: state.aiConfig.language || 'en',
            otherLanguage: state.aiConfig.otherLanguage || '',
            assistantName: state.aiConfig.assistantName || '',
            assistantGender: state.aiConfig.assistantGender || '',
            personality: ensureArray(state.aiConfig.personality),
            otherPersonality: state.aiConfig.otherPersonality || '',
            additionalInfo: state.aiConfig.additionalInfo || '',
          };
        } 
        // If we have data from localStorage (demo mode)
        else if (loadedData?.aiPreferences) {
          console.log("Using aiPreferences from localStorage for initial values:", loadedData.aiPreferences);
          const aiPrefs = loadedData.aiPreferences;
          
          formValues = {
            language: aiPrefs.language || 'en',
            otherLanguage: '',  // aiPrefs doesn't have otherLanguage
            assistantName: aiPrefs.assistantName || '',
            assistantGender: aiPrefs.assistantGender || '',
            personality: aiPrefs.specialties || (aiPrefs.tone ? aiPrefs.tone.split(',') : []),
            otherPersonality: aiPrefs.otherPersonality || '',
            additionalInfo: aiPrefs.additionalInfo || ''
          };
          
          // Update the context state only once at initialization
          // But don't update the form since we'll use initialValues
          skipFormUpdate.current = true;
          dispatch({
            type: 'SET_AI_CONFIG',
            payload: {
              language: formValues.language,
              otherLanguage: '',
              assistantName: formValues.assistantName,
              assistantGender: formValues.assistantGender,
              personality: ensureArray(formValues.personality),
              otherPersonality: formValues.otherPersonality,
              additionalInfo: formValues.additionalInfo,
              avatar: null
            }
          });
          skipFormUpdate.current = false;
        } else {
          // Default values if no data is found
          formValues = {
            language: 'en',
            otherLanguage: '',
            assistantName: '',
            assistantGender: '',
            personality: [],
            otherPersonality: '',
            additionalInfo: '',
          };
        }
        
        // Set the initial form values ONCE - this will be used by Formik
        setInitialFormValues(formValues);
        isFormInitialized.current = true;
      } catch (error) {
        console.error("Error initializing form:", error);
        // Set default values in case of error
        setInitialFormValues({
          language: 'en',
          otherLanguage: '',
          assistantName: '',
          assistantGender: '',
          personality: [],
          otherPersonality: '',
          additionalInfo: '',
        });
        isFormInitialized.current = true;
      } finally {
        // Allow a small delay before enabling user interaction
        setTimeout(() => {
          setIsInitializing(false);
        }, 100);
      }
    };
    
    loadInitialData();
  }, []); // Only run on mount

  // Función para guardar directamente los datos del formulario sin depender del contexto
  const saveFormDataDirect = async (formValues: FormValues) => {
    try {
      // Convertir datos del formulario al formato que espera la API o localStorage
      const personalityArray = Array.isArray(formValues.personality) 
        ? formValues.personality 
        : [formValues.personality].filter(Boolean);
      
      // Construir el objeto con los datos actuales
      const dataToSave = {
        aiPreferences: {
          language: formValues.language,
          tone: personalityArray.join(','),
          specialties: personalityArray,
          assistantName: formValues.assistantName,
          assistantGender: formValues.assistantGender,
          otherPersonality: formValues.otherPersonality,
          additionalInfo: formValues.additionalInfo
        }
      };
      
      // Actualizar el contexto para mantener consistencia
      dispatch({
        type: 'SET_AI_CONFIG',
        payload: {
          language: formValues.language,
          otherLanguage: formValues.otherLanguage,
          assistantName: formValues.assistantName,
          assistantGender: formValues.assistantGender,
          personality: personalityArray,
          otherPersonality: formValues.otherPersonality,
          additionalInfo: formValues.additionalInfo,
          avatar: null
        }
      });
      
      // Esperar un poco para asegurar que el dispatch se procese
      await new Promise(res => setTimeout(res, 10));
      
      // Guardar los datos
      console.log("Saving form data directly:", dataToSave);
      return await saveFormData();
    } catch (error) {
      console.error("Error saving form data directly:", error);
      return false;
    }
  };

  // Modificar la función handleFieldChange para actualizar SOLO el contexto
  const handleFieldChange = (field: string, value: any) => {
    // Marcar que tenemos cambios sin guardar
    setHasUnsavedChanges(true)
    
    // Actualizar SOLO el contexto (Formik ya se actualiza en los onChange)
    skipFormUpdate.current = true; // Prevenir que el cambio en el contexto afecte de vuelta al formulario
    
    // Validación especial para personality
    if (field === 'personality') {
      if (Array.isArray(value) && value.length > 3) {
        setMaxPersonalitiesError(true)
        return
      } else {
        setMaxPersonalitiesError(false)
      }
    }

    // Actualizar el contexto
    dispatch({
      type: 'SET_AI_CONFIG',
      payload: {
        ...state.aiConfig,
        [field]: value,
      },
    })
    
    skipFormUpdate.current = false;

    // Programar guardado automático
    if (saveTimeout.current) {
      clearTimeout(saveTimeout.current)
    }
    
    saveTimeout.current = setTimeout(async () => {
      try {
        // Usar los valores actuales de Formik para guardar
        if (formikRef.current) {
          await saveFormDataDirect(formikRef.current.values);
          setShowNotification(true);
          setTimeout(() => setShowNotification(false), 3000);
        }
      } catch (err) {
        console.error('Error saving form data:', err);
      }
    }, 1000);
  }

  // Comunicar cambios al componente padre
  useEffect(() => {
    if (window.onFormStateChange) {
      window.onFormStateChange(hasUnsavedChanges);
    }
  }, [hasUnsavedChanges]);

  // Función de validación que se expone globalmente
  const validateForm = useCallback(() => {
    console.log("Ejecutando validateCurrentStep en AIConfig");
    // Limpiar mensajes de error anteriores
    setValidationErrors([]);
    
    // Validar todos los campos requeridos
    const requiredFields = [
      { key: 'language', label: 'Idioma Principal' },
      { key: 'assistantName', label: 'Nombre del Asistente' },
      { key: 'assistantGender', label: 'Género del Asistente' }
    ];
    
    const formValues = formikRef.current?.values;
    if (!formValues) return false;
    
    // Verificar campos vacíos
    const missingFields = requiredFields.filter(field => {
      return !formValues[field.key as keyof FormValues];
    });
    
    // Si hay campos faltantes, mostrar errores y retornar false
    if (missingFields.length > 0) {
      const errorMessages = missingFields.map(field => 
        `El campo "${field.label}" es obligatorio.`
      );
      setValidationErrors(errorMessages);
      console.log("Validación fallida:", errorMessages);
      return false;
    }
    
    // Validar que se seleccione al menos una personalidad
    if (!formValues.personality || formValues.personality.length === 0) {
      setValidationErrors(['Debe seleccionar al menos una personalidad.']);
      console.log("Validación fallida: No se seleccionó ninguna personalidad");
      return false;
    }
    
    // Si seleccionó "other" personalidad, validar que haya especificado cuál
    if (formValues.personality.includes('other') && !formValues.otherPersonality) {
      setValidationErrors(['Si selecciona "Other" como personalidad, debe describir cuál.']);
      console.log("Validación fallida: No especificó la personalidad 'other'");
      return false;
    }
    
    console.log("Validación exitosa en AIConfig");
    return true;
  }, []);

  // Exponer la función de validación globalmente
  useEffect(() => {
    window.validateCurrentStep = validateForm;
    
    return () => {
      window.validateCurrentStep = undefined;
    };
  }, [validateForm]);

  // Reemplazar handleSave para usar la nueva función
  const handleSave = useCallback(async (values: FormValues) => {
    try {
      console.log("Saving AI Config with values:", values);
      const success = await saveFormDataDirect(values);
      setHasUnsavedChanges(false);
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);
      return success;
    } catch (error) {
      console.error('Error al guardar:', error);
      return false;
    }
  }, [dispatch, saveFormData]);

  // Exponer handleSave a través de window.saveCurrentFormData
  useEffect(() => {
    window.saveCurrentFormData = async () => {
      if (formikRef.current) {
        const currentValues = formikRef.current.values;
        console.log("Current form values for save:", currentValues);
        return await handleSave(currentValues);
      }
      return false;
    };
    
    return () => {
      window.saveCurrentFormData = undefined;
    };
  }, [handleSave]);

  const handleNext = async (values: FormValues) => {
    // Primero validar el formulario
    if (!validateForm()) {
      return;
    }
    
    if (hasUnsavedChanges) {
      // Save before navigating
      const saveSuccess = await handleSave(values);
      if (!saveSuccess) {
        setShowSavePrompt(true);
        return;
      }
    }
    
    navigate('/onboarding/menu-config');
  }

  // Add a loading overlay while initializing or waiting for initial values
  if (isInitializing || !initialFormValues) {
    return (
      <div className="min-h-screen bg-white px-4 py-8 pb-24 flex items-center justify-center">
        <div className="animate-pulse text-center">
          <p className="text-gray-500">Cargando información del asistente...</p>
        </div>
      </div>
    );
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

        {/* Mostrar errores de validación si existen */}
        {validationErrors.length > 0 && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-700">
                  Por favor corrige los siguientes errores:
                </h3>
                <ul className="mt-1 text-sm text-red-700 list-disc list-inside pl-2">
                  {validationErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        <Formik
          initialValues={initialFormValues}
          validationSchema={validationSchema}
          onSubmit={handleNext}
          innerRef={formikRef}
          enableReinitialize={false} // CRITICAL: prevent form from reinitializing
        >
          {({ values, errors, touched, setFieldValue }) => (
            <Form className="space-y-6">
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
                          navigate('/onboarding/menu-config');
                        }}
                        className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Continuar sin guardar
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          const success = await saveFormDataDirect(values);
                          if (success) {
                            setShowSavePrompt(false);
                            setHasUnsavedChanges(false);
                            navigate('/onboarding/menu-config');
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
                  <h3 className="text-xl font-semibold text-gray-800">Idioma Principal <span className="text-red-500">*</span></h3>
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
                      // Actualizar Formik y el contexto
                      if (formikRef.current) {
                        formikRef.current.setFieldValue('language', value);
                      }
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
                  <h3 className="text-xl font-semibold text-gray-800">Nombre del Asistente <span className="text-red-500">*</span></h3>
                </div>
                
                <div className="pl-16">
                  <p className="text-gray-600 mb-4">
                    Personaliza el nombre de tu asistente virtual
                  </p>
                  <Field
                    type="text"
                    id="assistantName"
                    name="assistantName"
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-orange focus:ring-brand-orange py-3 px-4"
                    placeholder="Ej: María, Alex"
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      const value = e.target.value;
                      // Actualizar Formik y el contexto
                      if (formikRef.current) {
                        formikRef.current.setFieldValue('assistantName', value);
                      }
                      handleFieldChange('assistantName', value);
                    }}
                  />
                  {errors.assistantName && touched.assistantName && (
                    <p className="mt-2 text-sm text-red-600">{errors.assistantName}</p>
                  )}
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
                  <h3 className="text-xl font-semibold text-gray-800">Género del Asistente <span className="text-red-500">*</span></h3>
                </div>
                
                <div className="pl-16">
                  <p className="text-gray-600 mb-4">
                    Selecciona el género que mejor represente a tu asistente virtual
                  </p>
                  <div className="grid grid-cols-2 gap-4">
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
                            const value = e.target.value;
                            // Actualizar Formik y el contexto
                            if (formikRef.current) {
                              formikRef.current.setFieldValue('assistantGender', value);
                            }
                            handleFieldChange('assistantGender', value);
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
                  <h3 className="text-xl font-semibold text-gray-800">Personalidad <span className="text-red-500">*</span></h3>
                </div>
                
                <div className="pl-16">
                  <p className="text-gray-600 mb-4">
                    Define el estilo de comunicación y la personalidad de tu asistente (selecciona al menos una, hasta 3)
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
                            
                            // Actualizar Formik y el contexto
                            if (formikRef.current) {
                              formikRef.current.setFieldValue('personality', newPersonality);
                            }
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
                          // Actualizar Formik y el contexto
                          if (formikRef.current) {
                            formikRef.current.setFieldValue('otherPersonality', value);
                          }
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

              {/* Información Adicional (opcional) */}
              <div className="bg-white shadow rounded-lg overflow-hidden relative p-6">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-brand-orange to-brand-purple flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800">Información Adicional <span className="text-gray-400 text-sm font-normal">(opcional)</span></h3>
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
                      // Actualizar Formik y el contexto
                      if (formikRef.current) {
                        formikRef.current.setFieldValue('additionalInfo', value);
                      }
                      handleFieldChange('additionalInfo', value);
                    }}
                  />
                </div>
              </div>

              {/* Barra fija de botones en la parte inferior */}
              <div className="fixed bottom-0 left-0 right-0 py-4 px-6 bg-white border-t border-gray-200 flex justify-between items-center z-10">
                <button
                  type="button"
                  onClick={() => navigate('/onboarding/location-details')}
                  className="px-6 py-3 bg-white border border-gray-300 rounded-full text-gray-700 hover:bg-gray-50 transition flex items-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  <span>Atrás</span>
                </button>

                <div className="flex space-x-4">
                  {hasUnsavedChanges && (
                    <button
                      type="button"
                      onClick={() => handleSave(values)}
                      className="px-6 py-3 border rounded-full flex items-center space-x-2 text-orange-600 border-orange-300 bg-orange-50 hover:bg-orange-100 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                      </svg>
                      <span>Guardar cambios</span>
                    </button>
                  )}
                  <button
                    type="submit"
                    className="px-8 py-3 text-white bg-gradient-to-r from-orange-400 to-pink-500 rounded-full hover:opacity-90 transition-all duration-300 shadow-md flex items-center space-x-2"
                  >
                    <span>Continuar</span>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
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
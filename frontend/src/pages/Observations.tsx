import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useFormProgress, FormData } from '../hooks/useFormProgress'
import { useTranslation } from '../hooks/useTranslation'
import { Formik, Form, Field, FormikProps } from 'formik'
import * as Yup from 'yup'
import FormActions from '../components/FormActions'
import { Notification } from '../components/Notification'
import { useForm } from '../context/FormContext'

// Extender la interfaz Window para incluir saveCurrentFormData
declare global {
  interface Window {
    onFormStateChange?: (hasChanges: boolean) => void;
    saveCurrentFormData?: () => Promise<boolean>;
  }
}

interface FormValues {
  additionalNotes: string
  termsAccepted: boolean
}

const validationSchema = Yup.object().shape({
  additionalNotes: Yup.string(),
  termsAccepted: Yup.boolean().oneOf([true], 'Debe aceptar los términos y condiciones para continuar'),
})

export default function Observations() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { formData, updateField, saveFormData } = useFormProgress()
  const { dispatch, state: formContextState } = useForm()
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [showSavePrompt, setShowSavePrompt] = useState(false)
  const [showNotification, setShowNotification] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isNavigating, setIsNavigating] = useState(false)
  const formikRef = useRef<FormikProps<FormValues> | null>(null)

  const initialValues: FormValues = {
    additionalNotes: formData.additionalNotes || '',
    termsAccepted: formData.termsAccepted || false,
  }

  // Comunicar cambios al componente padre
  useEffect(() => {
    if (window.onFormStateChange) {
      window.onFormStateChange(hasUnsavedChanges);
    }
  }, [hasUnsavedChanges]);

  // Simplificar el handleFieldChange para evitar ciclos
  const handleFieldChange = (field: keyof FormData, value: any) => {
    console.log(`Field changed: ${field} = ${value}`);
    setHasUnsavedChanges(true);
    
    // Update form data
    updateField(field, value);
    
    // Update FormContext directly
    if (field === 'additionalNotes') {
      dispatch({
        type: 'SET_ADDITIONAL_NOTES',
        payload: value
      });
    } else if (field === 'termsAccepted') {
      dispatch({
        type: 'SET_TERMS_ACCEPTED',
        payload: value
      });
    }
  }

  // Simplificar el handleSave para garantizar que isSaving se restablezca
  const handleSave = async (values: FormValues) => {
    if (isSaving) return false; // Prevenir múltiples llamadas simultáneas
    
    try {
      console.log("Guardando valores en Observations:", values);
      setIsSaving(true);
      
      // First, update the FormContext directly
      dispatch({
        type: 'SET_ADDITIONAL_NOTES',
        payload: values.additionalNotes
      });
      
      dispatch({
        type: 'SET_TERMS_ACCEPTED',
        payload: values.termsAccepted
      });
      
      // Then update each field individually in the form data
      Object.entries(values).forEach(([key, value]) => {
        updateField(key as keyof FormData, value);
      });
      
      // Save the changes to the database
      const success = await saveFormData();
      
      console.log("Resultado de guardar:", success ? "exitoso" : "fallido");
      
      if (success) {
        setHasUnsavedChanges(false);
        setShowNotification(true);
        setTimeout(() => setShowNotification(false), 3000);
      }
      
      return success;
    } catch (error) {
      console.error("Error en handleSave de Observations:", error);
      return false;
    } finally {
      // Garantizar que isSaving siempre se restablezca, incluso en caso de error
      setIsSaving(false);
    }
  };

  // Actualizar el useEffect de window.saveCurrentFormData
  useEffect(() => {
    window.saveCurrentFormData = async () => {
      if (formikRef.current) {
        const values = formikRef.current.values;
        return await handleSave(values);
      }
      return false;
    };
    
    return () => {
      window.saveCurrentFormData = undefined;
    };
  }, []);  // Sin dependencias para evitar recreaciones

  // Add a verification function to check if data is saved correctly
  const verifyDataSaved = (values: FormValues) => {
    // Check if the values match in FormContext
    const formContextMatch = 
      formContextState.additionalNotes === values.additionalNotes &&
      formContextState.termsAccepted === values.termsAccepted;
    
    // Check if the values match in formData
    const formDataMatch = 
      formData.additionalNotes === values.additionalNotes &&
      formData.termsAccepted === values.termsAccepted;
    
    console.log("Data verification before navigation:");
    console.log("- FormContext match:", formContextMatch);
    console.log("- FormData match:", formDataMatch);
    
    return formContextMatch && formDataMatch;
  };

  // Modify the handleSubmit function to include loading state
  const handleSubmit = (values: FormValues) => {
    if (hasUnsavedChanges) {
      setShowSavePrompt(true);
    } else {
      setIsNavigating(true);
      
      // Just navigate, no need to update values if there are no changes
      setTimeout(() => {
        navigate('/onboarding/review');
      }, 100);
    }
  }

  // Modify the SavePrompt component to include loading states
  const SavePrompt = () => {
    if (!showSavePrompt) return null;

    // Función para navegar directamente
    const handleNavigateWithoutSaving = () => {
      setShowSavePrompt(false);
      navigate('/onboarding/review');
    };

    // Función para guardar y luego navegar
    const handleSaveAndNavigate = async () => {
      if (isSaving) return; // Evitar múltiples ejecuciones
      
      try {
        if (formikRef.current) {
          const success = await handleSave(formikRef.current.values);
          if (success) {
            setShowSavePrompt(false);
            navigate('/onboarding/review');
          }
        }
      } catch (e) {
        console.error('Error al guardar los datos:', e);
        // Navigate anyway to prevent being stuck
        setShowSavePrompt(false);
        navigate('/onboarding/review');
      }
    };

    return (
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
              onClick={handleNavigateWithoutSaving}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              disabled={isSaving}
            >
              Continuar sin guardar
            </button>
            <button
              onClick={handleSaveAndNavigate}
              className="px-4 py-2 bg-brand-orange text-white rounded-md hover:bg-brand-orange-dark"
              disabled={isSaving}
            >
              {isSaving ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Guardando...
                </span>
              ) : 'Guardar y continuar'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white px-4 py-8 pb-24">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand-orange to-brand-purple">
            Observaciones Adicionales
          </h2>
          <p className="mt-3 text-gray-600">
            Configure cualquier información adicional relevante para optimizar la experiencia de sus clientes.
          </p>
        </div>
        
        {showNotification && (
          <Notification
            message="Los cambios han sido guardados correctamente"
            onClose={() => setShowNotification(false)}
          />
        )}
        
        <SavePrompt />
        
        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
          enableReinitialize={true}
          innerRef={(formik) => { formikRef.current = formik; }}
        >
          {(formikProps: FormikProps<FormValues>) => (
            <Form className="space-y-6">
              
              {/* Comentarios Adicionales */}
              <div className="bg-white shadow rounded-lg overflow-hidden relative p-6">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-brand-orange to-brand-purple flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800">Comentarios Adicionales</h3>
                </div>
                
                <div className="pl-16">
                  <p className="text-gray-600 mb-4">
                    Comparta cualquier detalle adicional sobre su restaurante que no haya sido cubierto en los pasos anteriores y que considere importante.
                  </p>
                  <Field
                    as="textarea"
                    name="additionalNotes"
                    id="additionalNotes"
                    rows={5}
                    placeholder="Por ejemplo: información sobre festividades especiales, características únicas de su restaurante, expectativas específicas sobre la plataforma, etc."
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-orange focus:ring-brand-orange py-3 px-4"
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                      const value = e.target.value;
                      formikProps.setFieldValue('additionalNotes', value);
                      handleFieldChange('additionalNotes', value);
                    }}
                  />
                </div>
              </div>

              {/* Información sobre Festividades */}
              <div className="bg-white shadow rounded-lg overflow-hidden relative p-6">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-brand-orange to-brand-purple flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800">Información sobre Festividades</h3>
                </div>
                
                <div className="pl-16">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-blue-700">
                      No se preocupe por detallar ahora todas las festividades. <strong>Dos semanas antes de cada festividad del año</strong>, su Project Manager asignado se pondrá en contacto para consultar si la celebrará y de qué forma específica lo hará su restaurante.
                    </p>
                  </div>
                </div>
              </div>

              {/* Términos y Condiciones */}
              <div className="bg-white shadow rounded-lg overflow-hidden relative p-6">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-brand-orange to-brand-purple flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800">Términos y Condiciones</h3>
                </div>
                
                <div className="pl-16">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-0.5">
                      <Field
                        type="checkbox"
                        name="termsAccepted"
                        id="termsAccepted"
                        className="h-5 w-5 rounded border-gray-300 text-brand-purple focus:ring-brand-purple transition duration-150"
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          const value = e.target.checked
                          formikProps.setFieldValue('termsAccepted', value)
                          handleFieldChange('termsAccepted', value)
                        }}
                        checked={formikProps.values.termsAccepted}
                      />
                    </div>
                    <div>
                      <label htmlFor="termsAccepted" className="font-medium text-gray-800 cursor-pointer">
                        Acepto los Términos y Condiciones
                      </label>
                      <p className="text-sm text-gray-600 mt-1">
                        Al marcar esta casilla, confirmo que he leído, entendido y acepto los términos de servicio y la política de privacidad de RestoHost. Entiendo que la información proporcionada será utilizada para configurar y personalizar la experiencia digital de mi restaurante.
                      </p>
                      {formikProps.errors.termsAccepted && formikProps.touched.termsAccepted && (
                        <div className="text-red-600 text-sm mt-2 font-medium">{formikProps.errors.termsAccepted}</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Barra fija de botones en la parte inferior */}
              <div className="fixed bottom-0 left-0 right-0 py-4 px-6 bg-white border-t border-gray-200 flex justify-between items-center z-10">
                {!hasUnsavedChanges ? (
                  <div className="flex items-center bg-green-50 border border-green-100 rounded-md px-4 py-3">
                    <svg className="w-5 h-5 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                    </svg>
                    <div>
                      <div className="text-green-700 font-medium">Cambios guardados</div>
                      <div className="text-green-600 text-sm">Todo está al día</div>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => navigate('/onboarding/tips-policy')}
                    className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-full hover:bg-gray-50 transition-colors flex items-center space-x-2"
                    disabled={isSaving}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    <span>Atrás</span>
                  </button>
                )}

                <div className="flex space-x-4">
                  {hasUnsavedChanges && (
                    <button
                      type="button"
                      onClick={() => {
                        if (formikRef.current) {
                          handleSave(formikRef.current.values);
                        }
                      }}
                      disabled={isSaving}
                      className="px-6 py-3 border rounded-full flex items-center space-x-2 text-orange-600 border-orange-300 bg-orange-50 hover:bg-orange-100 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                      </svg>
                      <span>{isSaving ? 'Guardando...' : 'Guardar cambios'}</span>
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-8 py-3 text-white bg-gradient-to-r from-orange-400 to-pink-500 rounded-full hover:opacity-90 transition-all duration-300 shadow-md flex items-center space-x-2"
                  >
                    <span>{isNavigating ? 'Continuando...' : 'Continuar'}</span>
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
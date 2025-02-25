import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useFormProgress, FormData } from '../hooks/useFormProgress'
import { useTranslation } from '../hooks/useTranslation'
import { Formik, Form, Field, FormikProps } from 'formik'
import * as Yup from 'yup'
import FormActions from '../components/FormActions'
import { Notification } from '../components/Notification'

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
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [showSavePrompt, setShowSavePrompt] = useState(false)
  const [showNotification, setShowNotification] = useState(false)

  const initialValues: FormValues = {
    additionalNotes: formData.additionalNotes || '',
    termsAccepted: formData.termsAccepted || false,
  }

  // Añadir este nuevo useEffect para mantener sincronizados los valores
  const [localValues, setLocalValues] = useState<FormValues>(initialValues);

  // Sincronizar con formData cuando cambie o se recargue la página
  useEffect(() => {
    if (!formData) return;
    
    console.log("FormData en Observations:", formData);
    console.log("AdditionalNotes:", formData.additionalNotes);
    
    // Actualizar los valores locales cuando formData cambia
    setLocalValues({
      additionalNotes: formData.additionalNotes || '',
      termsAccepted: formData.termsAccepted || false,
    });
  }, [formData]);

  // Comunicar cambios al componente padre
  useEffect(() => {
    if (window.onFormStateChange) {
      window.onFormStateChange(hasUnsavedChanges);
    }
  }, [hasUnsavedChanges]);

  const handleFieldChange = (field: keyof FormData, value: any) => {
    setHasUnsavedChanges(true)
    updateField(field, value)
  }

  const handleSave = useCallback(async (values: FormValues) => {
    try {
      console.log("Guardando valores:", values);
      
      // Actualizar cada campo individualmente
      Object.entries(values).forEach(([key, value]) => {
        updateField(key as keyof FormData, value);
      });
      
      // Guardar los cambios en la base de datos
      const success = await saveFormData();
      
      if (success) {
        console.log("Guardado exitoso");
        // Actualizar también el estado local para mantener sincronización
        setLocalValues(values);
        setHasUnsavedChanges(false);
        setShowNotification(true);
        setTimeout(() => setShowNotification(false), 3000);
        return true;
      } else {
        console.error("Error al guardar los datos");
        return false;
      }
    } catch (error) {
      console.error("Error en handleSave:", error);
      return false;
    }
  }, [updateField, saveFormData, setLocalValues]);

  // Actualizar el useEffect de window.saveCurrentFormData
  useEffect(() => {
    window.saveCurrentFormData = async () => {
      try {
        console.log("Ejecutando saveCurrentFormData");
        
        // Obtenemos los valores actuales del formulario
        const formikContext = document.querySelector('form')?.getAttribute('data-formik-values');
        if (!formikContext) {
          console.error('No se encontró el contexto de Formik');
          
          // Si no podemos obtener los valores del formulario, usar los valores locales actuales
          console.log("Usando valores locales:", localValues);
          return await handleSave(localValues);
        }
        
        const values = JSON.parse(formikContext);
        console.log("Valores obtenidos del formulario:", values);
        
        // Llamamos a handleSave con los valores actuales
        return await handleSave(values);
      } catch (e) {
        console.error('Error en saveCurrentFormData:', e);
        return false;
      }
    };
    
    return () => {
      window.saveCurrentFormData = undefined;
    };
  }, [handleSave, localValues]);

  const handleSubmit = (values: FormValues) => {
    if (hasUnsavedChanges) {
      setShowSavePrompt(true)
    } else {
      (Object.entries(values) as [keyof FormData, any][]).forEach(([field, value]) => {
        updateField(field, value)
      })
      navigate('/onboarding/review')
    }
  }

  // Componente para el modal de confirmación
  const SavePrompt = () => {
    if (!showSavePrompt) return null

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
              onClick={() => {
                setShowSavePrompt(false)
                navigate('/onboarding/review')
              }}
              className="btn-secondary"
            >
              Continuar sin guardar
            </button>
            <button
              onClick={async () => {
                try {
                  // Usamos directamente los valores actuales del formulario desde formData
                  const success = await saveFormData();
                  if (success) {
                    setShowSavePrompt(false);
                    setHasUnsavedChanges(false);
                    navigate('/onboarding/review');
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
    )
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-10">
        <h2 className="text-3xl font-bold text-gray-900 mb-3">Observaciones Adicionales</h2>
        <p className="text-lg text-gray-600 max-w-2xl">
          ¡Estamos a punto de finalizar! Antes de concluir, comparta cualquier información adicional que considere relevante para optimizar la experiencia de sus clientes.
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
        initialValues={localValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
        enableReinitialize={true}
      >
        {(formikProps: FormikProps<FormValues>) => (
          <Form className="space-y-8" data-formik-values={JSON.stringify(formikProps.values)}>
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8 space-y-8">
              <div className="space-y-4">
                <div className="border-b border-gray-200 pb-4">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Detalles Finales</h3>
                  <p className="text-gray-600">
                    Esta información será utilizada para personalizar aún más la experiencia de su restaurante.
                  </p>
                </div>
                
                <div className="space-y-3">
                  <label htmlFor="additionalNotes" className="block text-base font-medium text-gray-800">
                    Comentarios Adicionales
                  </label>
                  <p className="text-sm text-gray-600">
                    Comparta cualquier detalle adicional sobre su restaurante que no haya sido cubierto en los pasos anteriores y que considere importante para su configuración.
                  </p>
                  <div className="relative">
                    <Field
                      as="textarea"
                      name="additionalNotes"
                      id="additionalNotes"
                      rows={6}
                      placeholder="Por ejemplo: información sobre festividades especiales, características únicas de su restaurante, expectativas específicas sobre la plataforma, etc."
                      className="w-full rounded-md border-2 border-gray-300 p-4 shadow-md focus:border-brand-purple focus:ring-2 focus:ring-brand-purple transition duration-150 text-gray-700 placeholder-gray-500 placeholder-opacity-80"
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                        const value = e.target.value;
                        formikProps.setFieldValue('additionalNotes', value);
                        handleFieldChange('additionalNotes', value);
                      }}
                    />
                    <div className="absolute top-0 right-0 mt-2 mr-3 pointer-events-none">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </div>
                    {!formikProps.values.additionalNotes && (
                      <div className="absolute bottom-3 right-3 text-sm text-brand-orange font-medium animate-pulse">
                        Ingrese sus comentarios aquí
                      </div>
                    )}
                  </div>
                  {formikProps.errors.additionalNotes && formikProps.touched.additionalNotes && (
                    <div className="text-red-600 text-sm mt-1">{formikProps.errors.additionalNotes}</div>
                  )}
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h4 className="text-base font-medium text-blue-800">Información sobre festividades</h4>
                    <p className="mt-2 text-sm text-blue-700">
                      No se preocupe por detallar ahora todas las festividades. <strong>Dos semanas antes de cada festividad del año</strong>, su Project Manager asignado se pondrá en contacto para consultar si la celebrará y de qué forma específica lo hará su restaurante.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
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

            <div className="flex justify-between items-center pt-6">
              <button
                type="button"
                onClick={() => navigate('/onboarding/tips-policy')}
                className="inline-flex items-center px-6 py-3 border border-gray-300 shadow-sm text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-purple transition duration-150"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
                Volver
              </button>
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      // Mostrar un estado de carga temporal
                      const button = document.getElementById('save-button') as HTMLButtonElement;
                      if (button) {
                        button.innerHTML = `
                          <svg class="animate-spin -ml-1 mr-2 h-5 w-5 text-brand-orange" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Guardando...
                        `;
                        button.disabled = true;
                      }
                      
                      // Intentar guardar los cambios
                      const success = await handleSave(formikProps.values);
                      
                      // Mostrar feedback adicional
                      if (success) {
                        console.log("Guardado exitoso desde el botón");
                      } else {
                        console.error("Error al guardar desde el botón");
                        alert("Hubo un problema al guardar los cambios. Por favor, inténtelo de nuevo.");
                      }
                    } catch (error) {
                      console.error("Error al guardar:", error);
                      alert("Hubo un problema al guardar los cambios. Por favor, inténtelo de nuevo.");
                    }
                  }}
                  id="save-button"
                  className={`inline-flex items-center px-6 py-3 border shadow-sm text-base font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-150 ${
                    hasUnsavedChanges 
                      ? 'border-brand-orange text-brand-orange bg-white hover:bg-orange-50 focus:ring-brand-orange' 
                      : 'border-green-500 text-green-600 bg-green-50 cursor-default focus:ring-green-500'
                  }`}
                  disabled={!hasUnsavedChanges}
                >
                  {hasUnsavedChanges ? (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                      Guardar cambios
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Cambios guardados
                    </>
                  )}
                </button>
                <button
                  type="submit"
                  disabled={!formikProps.isValid}
                  className="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-gradient-to-r from-brand-purple to-brand-orange hover:from-brand-purple-dark hover:to-brand-orange-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-purple transition-all duration-150"
                >
                  Finalizar y Revisar
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  )
} 
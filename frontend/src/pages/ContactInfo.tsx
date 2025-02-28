import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from '../hooks/useTranslation'
import { useFormProgress } from '../hooks/useFormProgress'
import { Formik, Form, Field, ErrorMessage } from 'formik'
import * as Yup from 'yup'
import { FormData } from '../hooks/useFormProgress'

interface FormValues {
  contactName: string
  phone: string
  email: string
  address: string
  city: string
  state: string
  zipCode: string
  sameForAllLocations: boolean
}

const validationSchema = Yup.object().shape({
  contactName: Yup.string().required('Required'),
  phone: Yup.string().required('Required'),
  email: Yup.string().email('Invalid email').required('Required'),
  address: Yup.string().required('Required'),
  city: Yup.string().required('Required'),
  state: Yup.string().required('Required'),
  zipCode: Yup.string().required('Required'),
})

// Componente de notificación personalizado
const Notification = ({ message, onClose }: { message: string; onClose: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-4 right-4 z-50 animate-fade-in">
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 flex items-center space-x-3">
        <div className="flex-shrink-0">
          <div className="w-8 h-8 rounded-full bg-gradient-brand flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
        <p className="text-gray-800">{message}</p>
        <button
          onClick={onClose}
          className="flex-shrink-0 text-gray-400 hover:text-gray-600"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};

// Extender la interfaz Window para incluir saveCurrentFormData
declare global {
  interface Window {
    onFormStateChange?: (hasChanges: boolean) => void;
    saveCurrentFormData?: () => Promise<boolean>;
  }
}

export default function ContactInfo() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { formData, updateField, saveFormData } = useFormProgress()
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [showSavePrompt, setShowSavePrompt] = useState(false)
  const [showNotification, setShowNotification] = useState(false)
  const [localData, setLocalData] = useState<FormValues>({
    contactName: formData.contactName || '',
    phone: formData.phone || '',
    email: formData.email || '',
    address: formData.address || '',
    city: formData.city || '',
    state: formData.state || '',
    zipCode: formData.zipCode || '',
    sameForAllLocations: formData.sameForAllLocations ?? false,
  })

  // Helper function to get business name with fallback
  const getBusinessName = () => formData.legalBusinessName || 'tu empresa';

  // Sincronizar con formData cuando cambie
  useEffect(() => {
    if (!formData) return;

    const newData = {
      contactName: formData.contactName || '',
      phone: formData.phone || '',
      email: formData.email || '',
      address: formData.address || '',
      city: formData.city || '',
      state: formData.state || '',
      zipCode: formData.zipCode || '',
      sameForAllLocations: formData.sameForAllLocations ?? false,
    };

    // Verificar si hay cambios reales
    const hasChanges = Object.entries(newData).some(
      ([key, value]) => localData[key as keyof FormValues] !== value
    );

    if (hasChanges) {
      setLocalData(newData);
      setHasUnsavedChanges(false);
    }
  }, [formData]);

  // Comunicar cambios al componente padre
  useEffect(() => {
    if (window.onFormStateChange) {
      window.onFormStateChange(hasUnsavedChanges);
    }
  }, [hasUnsavedChanges]);

  const handleFieldChange = (field: keyof FormValues, value: any) => {
    setHasUnsavedChanges(true)
    setLocalData(prev => ({ ...prev, [field]: value }))
    updateField(field, value)
  }

  const handleNext = (values: FormValues) => {
    if (hasUnsavedChanges) {
      setShowSavePrompt(true)
    } else {
      navigate('/onboarding/location-details')
    }
  }

  const handleSave = useCallback(async () => {
    await saveFormData()
    setHasUnsavedChanges(false)
    setShowNotification(true)
    setTimeout(() => setShowNotification(false), 3000)
    return true; // Indicar que el guardado fue exitoso
  }, [saveFormData, setHasUnsavedChanges, setShowNotification]);

  // Exponer handleSave a través de window.saveCurrentFormData
  useEffect(() => {
    window.saveCurrentFormData = handleSave;
    
    return () => {
      window.saveCurrentFormData = undefined;
    };
  }, [handleSave]);

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
                navigate('/onboarding/location-details')
              }}
              className="btn-secondary"
            >
              Continuar sin guardar
            </button>
            <button
              onClick={async () => {
                const success = await handleSave();
                if (success) {
                  setShowSavePrompt(false)
                  navigate('/onboarding/location-details')
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
    <div className="max-w-5xl mx-auto p-6">
      {showNotification && (
        <Notification
          message="Los cambios han sido guardados correctamente"
          onClose={() => setShowNotification(false)}
        />
      )}
      <SavePrompt />
      
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand-orange to-brand-purple mb-2">
            Información de Contacto
          </h2>
          <p className="text-gray-600 mb-6">
            Por favor, ingresa los datos de contacto para {getBusinessName()}.
          </p>
        </div>

        <Formik
          initialValues={localData}
          validationSchema={validationSchema}
          onSubmit={handleNext}
          enableReinitialize
          validateOnMount
        >
          {({ isValid, values, setFieldValue, errors, touched }) => (
            <Form className="space-y-8">
              {/* Sección de Responsable de Comunicaciones */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-brand-orange to-brand-purple mb-4">
                  Responsable de Comunicación
                </h3>
                
                <div className="space-y-4">
                  <div className="group">
                    <div className="flex items-center">
                      <label htmlFor="contactName" className="block text-sm font-medium text-gray-700 mb-1 group-hover:text-brand-purple transition-colors">
                        Nombre del Contacto
                      </label>
                    </div>
                    <p className="text-xs text-gray-500 mb-2">Persona responsable de recibir comunicaciones importantes sobre la cuenta</p>
                    <Field
                      type="text"
                      id="contactName"
                      name="contactName"
                      className="input-field"
                      placeholder="Nombre completo"
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        handleFieldChange('contactName', e.target.value);
                        setFieldValue('contactName', e.target.value);
                      }}
                    />
                    <ErrorMessage name="contactName" component="div" className="text-red-500 text-sm mt-1" />
                  </div>

                  <div className="group">
                    <div className="flex items-center">
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1 group-hover:text-brand-purple transition-colors">
                        Teléfono de Contacto
                      </label>
                    </div>
                    <p className="text-xs text-gray-500 mb-2">Número donde podemos contactarte para temas importantes</p>
                    <Field
                      type="tel"
                      id="phone"
                      name="phone"
                      className="input-field"
                      placeholder="+1 (234) 567-8901"
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        handleFieldChange('phone', e.target.value);
                        setFieldValue('phone', e.target.value);
                      }}
                    />
                    <ErrorMessage name="phone" component="div" className="text-red-500 text-sm mt-1" />
                  </div>

                  <div className="group">
                    <div className="flex items-center">
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1 group-hover:text-brand-purple transition-colors">
                        Email de Contacto
                      </label>
                    </div>
                    <p className="text-xs text-gray-500 mb-2">Email donde recibirás comunicaciones importantes</p>
                    <Field
                      type="email"
                      id="email"
                      name="email"
                      className="input-field"
                      placeholder="ejemplo@dominio.com"
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        handleFieldChange('email', e.target.value);
                        setFieldValue('email', e.target.value);
                      }}
                    />
                    <ErrorMessage name="email" component="div" className="text-red-500 text-sm mt-1" />
                  </div>
                </div>
              </div>

              {/* Sección de Información de Oficina */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-brand-orange to-brand-purple mb-4">
                  Dirección Legal de la LLC
                </h3>
                
                <div className="space-y-4">
                  <div className="group">
                    <div className="flex items-center">
                      <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1 group-hover:text-brand-purple transition-colors">
                        Dirección
                      </label>
                    </div>
                    <p className="text-xs text-gray-500 mb-2">Dirección legal registrada del negocio</p>
                    <Field
                      type="text"
                      id="address"
                      name="address"
                      className="input-field"
                      placeholder="Calle y número"
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        handleFieldChange('address', e.target.value);
                        setFieldValue('address', e.target.value);
                      }}
                    />
                    <ErrorMessage name="address" component="div" className="text-red-500 text-sm mt-1" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="group">
                      <div className="flex items-center">
                        <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1 group-hover:text-brand-purple transition-colors">
                          Ciudad
                        </label>
                      </div>
                      <Field
                        type="text"
                        id="city"
                        name="city"
                        className="input-field"
                        placeholder="Ciudad"
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          handleFieldChange('city', e.target.value);
                          setFieldValue('city', e.target.value);
                        }}
                      />
                      <ErrorMessage name="city" component="div" className="text-red-500 text-sm mt-1" />
                    </div>

                    <div className="group">
                      <div className="flex items-center">
                        <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1 group-hover:text-brand-purple transition-colors">
                          Estado
                        </label>
                      </div>
                      <Field
                        type="text"
                        id="state"
                        name="state"
                        className="input-field"
                        placeholder="Estado"
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          handleFieldChange('state', e.target.value);
                          setFieldValue('state', e.target.value);
                        }}
                      />
                      <ErrorMessage name="state" component="div" className="text-red-500 text-sm mt-1" />
                    </div>

                    <div className="group">
                      <div className="flex items-center">
                        <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700 mb-1 group-hover:text-brand-purple transition-colors">
                          Código Postal
                        </label>
                      </div>
                      <Field
                        type="text"
                        id="zipCode"
                        name="zipCode"
                        className="input-field"
                        placeholder="Código postal"
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          handleFieldChange('zipCode', e.target.value);
                          setFieldValue('zipCode', e.target.value);
                        }}
                      />
                      <ErrorMessage name="zipCode" component="div" className="text-red-500 text-sm mt-1" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="fixed bottom-0 left-0 right-0 bg-white py-3 px-6 z-10 shadow-lg">
                <div className="flex justify-between max-w-5xl mx-auto">
                  <button
                    type="button"
                    onClick={() => navigate('/onboarding/legal-data')}
                    className="btn-secondary inline-flex items-center"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Atrás
                  </button>
                  
                  <div className="flex space-x-3">
                    <button
                      type="button"
                      onClick={() => saveFormData()}
                      className={hasUnsavedChanges ? "btn-unsaved inline-flex items-center" : "btn-saved inline-flex items-center"}
                      disabled={!hasUnsavedChanges}
                    >
                      {hasUnsavedChanges ? (
                        <>
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                          </svg>
                          Guardar cambios
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Cambios guardados
                        </>
                      )}
                    </button>
                    
                    <button
                      type="submit"
                      className="btn-primary inline-flex items-center"
                      disabled={!isValid}
                    >
                      Continuar
                      <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  )
} 
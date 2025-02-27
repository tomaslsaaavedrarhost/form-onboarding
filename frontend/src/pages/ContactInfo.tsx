import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from '../hooks/useTranslation'
import { useFormProgress } from '../hooks/useFormProgress'
import { Formik, Form, Field } from 'formik'
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

// Componente para el tooltip
const InfoTooltip = ({ text }: { text: string }) => {
  const [isVisible, setIsVisible] = useState(false);
  
  return (
    <div className="relative inline-block ml-2">
      <div
        className="w-5 h-5 rounded-full bg-gradient-brand flex items-center justify-center cursor-help"
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
      >
        <span className="text-white text-sm font-medium">i</span>
      </div>
      {isVisible && (
        <div className="absolute z-10 w-72 px-4 py-3 bg-white border border-gray-200 rounded-lg shadow-lg -right-2 top-7">
          <div className="absolute -top-2 right-3 w-4 h-4 bg-white border-t border-l border-gray-200 transform rotate-45"></div>
          <p className="text-sm text-gray-600">{text}</p>
        </div>
      )}
    </div>
  );
};

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
    <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {showNotification && (
        <Notification
          message="Los cambios han sido guardados correctamente"
          onClose={() => setShowNotification(false)}
        />
      )}
      <SavePrompt />
      <h2 className="text-2xl font-bold text-gray-900 mb-8">Información de Contacto</h2>
      <Formik
        initialValues={localData}
        validationSchema={validationSchema}
        onSubmit={handleNext}
        enableReinitialize
      >
        {({ errors, touched, setFieldValue, values }) => (
          <Form className="space-y-8">
            {/* Contact Information Section */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Responsable de Comunicación</h3>
              <div className="space-y-6">
                <div>
                  <div className="flex items-center">
                    <label htmlFor="contactName" className="form-label mb-0">
                      Nombre Completo
                    </label>
                    <InfoTooltip 
                      text={`Por favor, ingresa los datos de la persona responsable de la comunicación con RestoHost para ${getBusinessName()}. Esta persona será el punto de contacto principal para todas las comunicaciones importantes.`}
                    />
                  </div>
                  <Field
                    type="text"
                    name="contactName"
                    id="contactName"
                    className="input-field mt-2"
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      const value = e.target.value;
                      setFieldValue('contactName', value);
                      handleFieldChange('contactName', value);
                    }}
                  />
                  {errors.contactName && touched.contactName && (
                    <div className="error-message">{errors.contactName}</div>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <div className="flex items-center">
                      <label htmlFor="phone" className="form-label mb-0">
                        Teléfono de Contacto
                      </label>
                      <InfoTooltip 
                        text={`Número de teléfono donde podamos contactar al responsable de ${getBusinessName()} para temas importantes relacionados con la plataforma.`}
                      />
                    </div>
                    <Field
                      type="tel"
                      name="phone"
                      id="phone"
                      className="input-field mt-2"
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        const value = e.target.value;
                        setFieldValue('phone', value);
                        handleFieldChange('phone', value);
                      }}
                    />
                    {errors.phone && touched.phone && (
                      <div className="error-message">{errors.phone}</div>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center">
                      <label htmlFor="email" className="form-label mb-0">
                        Correo Electrónico
                      </label>
                      <InfoTooltip 
                        text={`Este correo se utilizará para todas las comunicaciones importantes relacionadas con ${getBusinessName()} y también recibirá los reportes mensuales de todas las ubicaciones.`}
                      />
                    </div>
                    <Field
                      type="email"
                      name="email"
                      id="email"
                      className="input-field mt-2"
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        const value = e.target.value;
                        setFieldValue('email', value);
                        handleFieldChange('email', value);
                      }}
                    />
                    {errors.email && touched.email && (
                      <div className="error-message">{errors.email}</div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Office Information Section */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Dirección Legal de la LLC</h3>
              <div className="space-y-6">
                <div>
                  <div className="flex items-center">
                    <label htmlFor="address" className="form-label mb-0">
                      Dirección
                    </label>
                    <InfoTooltip 
                      text={`Ingresa la dirección legal donde está registrada la LLC de ${getBusinessName()}. Esta debe ser la dirección oficial que aparece en los documentos de registro de la compañía.`}
                    />
                  </div>
                  <Field
                    type="text"
                    name="address"
                    id="address"
                    className="input-field mt-2"
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      const value = e.target.value;
                      setFieldValue('address', value);
                      handleFieldChange('address', value);
                    }}
                  />
                  {errors.address && touched.address && (
                    <div className="error-message">{errors.address}</div>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                  <div>
                    <div className="flex items-center">
                      <label htmlFor="city" className="form-label mb-0">
                        Ciudad
                      </label>
                      <InfoTooltip text={`Ciudad donde está registrada legalmente la LLC de ${getBusinessName()}.`} />
                    </div>
                    <Field
                      type="text"
                      name="city"
                      id="city"
                      className="input-field mt-2"
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        const value = e.target.value;
                        setFieldValue('city', value);
                        handleFieldChange('city', value);
                      }}
                    />
                    {errors.city && touched.city && (
                      <div className="error-message">{errors.city}</div>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center">
                      <label htmlFor="state" className="form-label mb-0">
                        Estado
                      </label>
                      <InfoTooltip text={`Estado donde está registrada legalmente la LLC de ${getBusinessName()}.`} />
                    </div>
                    <Field
                      type="text"
                      name="state"
                      id="state"
                      className="input-field mt-2"
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        const value = e.target.value;
                        setFieldValue('state', value);
                        handleFieldChange('state', value);
                      }}
                    />
                    {errors.state && touched.state && (
                      <div className="error-message">{errors.state}</div>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center">
                      <label htmlFor="zipCode" className="form-label mb-0">
                        Código Postal
                      </label>
                      <InfoTooltip text={`Código postal de la dirección legal donde está registrada la LLC de ${getBusinessName()}.`} />
                    </div>
                    <Field
                      type="text"
                      name="zipCode"
                      id="zipCode"
                      className="input-field mt-2"
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        const value = e.target.value;
                        setFieldValue('zipCode', value);
                        handleFieldChange('zipCode', value);
                      }}
                    />
                    {errors.zipCode && touched.zipCode && (
                      <div className="error-message">{errors.zipCode}</div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-between space-x-4">
              <button
                type="button"
                onClick={handleSave}
                className={hasUnsavedChanges ? 'btn-unsaved' : 'btn-saved'}
                disabled={!hasUnsavedChanges}
              >
                {hasUnsavedChanges ? 'Guardar cambios' : 'Cambios guardados'}
              </button>
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => navigate('/onboarding/legal-data')}
                  className="btn-secondary"
                >
                  {t('back')}
                </button>
                <button 
                  type="submit"
                  onClick={() => handleNext(values)}
                  className="btn-primary"
                >
                  {t('continue')}
                </button>
              </div>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  )
} 
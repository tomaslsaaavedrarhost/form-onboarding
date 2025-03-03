import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from '../hooks/useTranslation'
import { useFormProgress } from '../hooks/useFormProgress'
import { Formik, Form, Field, ErrorMessage, FormikProps } from 'formik'
import * as Yup from 'yup'
import { FormData } from '../hooks/useFormProgress'
import { useForm } from '../context/FormContext'

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
  contactName: Yup.string().required('Campo obligatorio'),
  phone: Yup.string().required('Campo obligatorio'),
  email: Yup.string().email('Email inválido').required('Campo obligatorio'),
  address: Yup.string().required('Campo obligatorio'),
  city: Yup.string().required('Campo obligatorio'),
  state: Yup.string().required('Campo obligatorio'),
  zipCode: Yup.string().required('Campo obligatorio'),
})

// Componente de notificación personalizado
const Notification = ({ message, onClose, type = 'success' }: { message: string; onClose: () => void; type?: 'success' | 'error' }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const isSuccess = type === 'success';

  return (
    <div className="fixed top-4 right-4 z-50 animate-fade-in">
      <div className={`bg-white rounded-lg shadow-lg border ${isSuccess ? 'border-green-200' : 'border-red-200'} p-4 flex items-center space-x-3`}>
        <div className="flex-shrink-0">
          <div className={`w-8 h-8 rounded-full ${isSuccess ? 'bg-gradient-brand' : 'bg-red-500'} flex items-center justify-center`}>
            {isSuccess ? (
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
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

// Extender la interfaz Window para incluir saveCurrentFormData y validateCurrentStep
declare global {
  interface Window {
    onFormStateChange?: (hasChanges: boolean) => void;
    saveCurrentFormData?: () => Promise<boolean>;
    validateCurrentStep?: () => boolean;
  }
}

export default function ContactInfo() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { formData, updateField, saveFormData } = useFormProgress()
  const formContext = useForm();
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [showSavePrompt, setShowSavePrompt] = useState(false)
  const [showNotification, setShowNotification] = useState(false)
  const [notificationType, setNotificationType] = useState<'success' | 'error'>('success')
  const [notificationMessage, setNotificationMessage] = useState('')
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const formikRef = useRef<FormikProps<FormValues>>(null)
  
  // Initialize local data with either flat fields from formData or nested fields from formContext
  const [localData, setLocalData] = useState<FormValues>(() => {
    // First try to get from flat fields (Firebase)
    const flatData = {
      contactName: formData.contactName || '',
      phone: formData.phone || '',
      email: formData.email || '',
      address: formData.address || '',
      city: formData.city || '',
      state: formData.state || '',
      zipCode: formData.zipCode || '',
      sameForAllLocations: formData.sameForAllLocations ?? false,
    };
    
    // Then try to fill gaps from contactInfo nested object (FormContext)
    const nestedData = formContext.state.contactInfo || {};
    
    // Return merged data, prioritizing flat fields
    return {
      contactName: flatData.contactName || nestedData.contactName || '',
      phone: flatData.phone || nestedData.phone || '',
      email: flatData.email || nestedData.email || '',
      address: flatData.address || nestedData.address || '',
      city: flatData.city || nestedData.city || '',
      state: flatData.state || nestedData.state || '',
      zipCode: flatData.zipCode || nestedData.zipCode || '',
      sameForAllLocations: flatData.sameForAllLocations ?? nestedData.sameForAllLocations ?? false,
    };
  });

  // Log data on mount and formData changes
  useEffect(() => {
    console.log("ContactInfo: formData from useFormProgress:", formData);
    console.log("ContactInfo: contactInfo from FormContext:", formContext.state.contactInfo);
  }, [formData, formContext.state.contactInfo]);

  // Debug log
  useEffect(() => {
    // Verify data structure on mount
    if (formData) {
      console.log("Verificando estructura de datos en ContactInfo:");
      console.log("- Flat fields:", {
        contactName: formData.contactName,
        phone: formData.phone,
        email: formData.email,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        zipCode: formData.zipCode,
        sameForAllLocations: formData.sameForAllLocations
      });
      console.log("- FormContext contactInfo:", formContext.state.contactInfo);
    }
  }, [formData, formContext.state.contactInfo]);

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
      console.log('Actualizando datos locales desde formData:', newData);
      setLocalData(newData);
      setHasUnsavedChanges(false);
    }
  }, [formData]);

  // Función para detectar cambios en el formulario
  const detectFormChanges = useCallback((currentValues: FormValues) => {
    // Comparar con los datos originales de formData
    const originalData = {
      contactName: formData.contactName || '',
      phone: formData.phone || '',
      email: formData.email || '',
      address: formData.address || '',
      city: formData.city || '',
      state: formData.state || '',
      zipCode: formData.zipCode || '',
      sameForAllLocations: formData.sameForAllLocations ?? false,
    };
    
    // Verificar si hay cambios comparando cada campo
    const changedFields = Object.entries(currentValues).filter(
      ([key, value]) => originalData[key as keyof FormValues] !== value
    );
    
    const hasChanges = changedFields.length > 0;
    
    if (hasChanges) {
      console.log('Cambios detectados en los campos:', changedFields.map(([key]) => key));
    }
    
    return hasChanges;
  }, [formData]);

  // Comunicar cambios al componente padre
  useEffect(() => {
    if (window.onFormStateChange) {
      window.onFormStateChange(hasUnsavedChanges);
    }
  }, [hasUnsavedChanges]);

  const handleFieldChange = (field: keyof FormValues, value: any) => {
    // Actualizar datos locales
    const updatedData = { ...localData, [field]: value };
    setLocalData(updatedData);
    
    // Detectar si hay cambios reales comparando con los datos originales
    const hasChanges = detectFormChanges(updatedData);
    setHasUnsavedChanges(hasChanges);
    
    // Actualizar el campo tanto como flat field (para Firebase) y en el objeto contactInfo
    updateField(field, value);
    
    // También actualizar en el contexto del formulario para mantener sincronizado
    formContext.dispatch({
      type: 'SET_CONTACT_INFO',
      payload: {
        ...formContext.state.contactInfo,
        [field]: value
      }
    });
  }

  // Función de validación que se expone globalmente
  const validateForm = useCallback(() => {
    console.log("Ejecutando validateCurrentStep en ContactInfo");
    // Limpiar mensajes de error anteriores
    setValidationErrors([]);
    
    // Validar todos los campos requeridos
    const requiredFields: Array<{ key: keyof FormValues, label: string }> = [
      { key: 'contactName', label: 'Nombre del Contacto' },
      { key: 'phone', label: 'Teléfono de Contacto' },
      { key: 'email', label: 'Email de Contacto' },
      { key: 'address', label: 'Dirección' },
      { key: 'city', label: 'Ciudad' },
      { key: 'state', label: 'Estado' },
      { key: 'zipCode', label: 'Código Postal' }
    ];
    
    // Verificar campos vacíos
    const missingFields = requiredFields.filter(field => {
      const value = localData[field.key];
      return typeof value !== 'string' || value.trim() === '';
    });
    
    // Si hay campos faltantes, mostrar errores y retornar false
    if (missingFields.length > 0) {
      const errorMessages = missingFields.map(field => 
        `El campo "${field.label}" es obligatorio.`
      );
      setValidationErrors(errorMessages);
      console.log("Validación fallida:", errorMessages);
      
      // También activar validación de Formik para mostrar los errores en la UI
      if (formikRef.current) {
        formikRef.current.validateForm();
      }
      
      return false;
    }
    
    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (localData.email && !emailRegex.test(localData.email)) {
      setValidationErrors(['El formato del email no es válido.']);
      console.log("Validación fallida: Email inválido");
      return false;
    }
    
    console.log("Validación exitosa en ContactInfo");
    return true;
  }, [localData]);

  // Exponer la función de validación globalmente
  useEffect(() => {
    window.validateCurrentStep = validateForm;
    
    return () => {
      window.validateCurrentStep = undefined;
    };
  }, [validateForm]);

  const handleNext = async (values: FormValues) => {
    try {
      // Primero validar el formulario
      if (!validateForm()) {
        return;
      }
      
      // Verificar si hay cambios comparando con los datos originales
      const hasChanges = detectFormChanges(values);
      
      if (!hasChanges) {
        console.log('No se detectaron cambios en el formulario, continuando sin guardar');
        navigate('/onboarding/location-details');
        return;
      }
      
      console.log('Se detectaron cambios en el formulario, guardando...');
      setIsSaving(true);
      
      // Preparar los datos de contacto asegurando que todos los campos estén presentes
      const contactData = {
        contactName: values.contactName.trim(),
        phone: values.phone.trim(),
        email: values.email.trim(),
        address: values.address.trim(),
        city: values.city.trim(),
        state: values.state.trim(),
        zipCode: values.zipCode.trim(),
        sameForAllLocations: values.sameForAllLocations
      };
      
      // Actualizar el FormContext con los datos de contacto
      formContext.dispatch({
        type: 'SET_CONTACT_INFO',
        payload: contactData
      });
      
      // Actualizar cada campo en Firebase
      const updatePromises = Object.entries(contactData).map(([field, value]) => {
        return updateField(field, value);
      });
      
      // Esperar a que todas las actualizaciones se completen
      await Promise.all(updatePromises);
      
      // Guardar todo el formulario para asegurar sincronización
      await saveFormData();
      
      console.log('Datos de contacto guardados correctamente');
      setHasUnsavedChanges(false);
      setNotificationType('success');
      setNotificationMessage('Datos guardados correctamente');
      setShowNotification(true);
      
      // Navegar a la siguiente página después de un breve retraso para que el usuario vea la notificación
      setTimeout(() => {
        setIsSaving(false);
        navigate('/onboarding/location-details');
      }, 1000);
      
    } catch (error) {
      console.error('Error al guardar datos de contacto:', error);
      setIsSaving(false);
      setNotificationType('error');
      setNotificationMessage('Error al guardar los datos de contacto. Por favor, intenta nuevamente.');
      setShowNotification(true);
    }
  };

  const handleSave = useCallback(async () => {
    if (!hasUnsavedChanges) return true;
    
    console.log("Guardando cambios manualmente...");
    setIsSaving(true);
    
    try {
      await saveFormData();
      setHasUnsavedChanges(false);
      setShowNotification(true);
      setNotificationType('success');
      setNotificationMessage('Los cambios han sido guardados correctamente');
      setTimeout(() => setShowNotification(false), 3000);
      setIsSaving(false);
      return true;
    } catch (error) {
      console.error("Error al guardar cambios:", error);
      setIsSaving(false);
      setShowNotification(true);
      setNotificationType('error');
      setNotificationMessage('Error al guardar cambios. Por favor, intenta nuevamente.');
      return false;
    }
  }, [saveFormData, hasUnsavedChanges]);

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
          message={notificationMessage}
          onClose={() => setShowNotification(false)}
          type={notificationType}
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
          initialValues={localData}
          validationSchema={validationSchema}
          onSubmit={handleNext}
          enableReinitialize
          validateOnMount
          innerRef={formikRef}
        >
          {({ isValid, values, setFieldValue, errors, touched }) => (
            <Form className="space-y-8 pb-24">
              {/* Sección de Responsable de Comunicaciones */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-brand-orange to-brand-purple mb-4">
                  Responsable de Comunicación
                </h3>
                
                <div className="space-y-4">
                  <div className="group">
                    <div className="flex items-center">
                      <label htmlFor="contactName" className="block text-sm font-medium text-gray-700 mb-1 group-hover:text-brand-purple transition-colors">
                        Nombre del Contacto <span className="text-red-500">*</span>
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
                        Teléfono de Contacto <span className="text-red-500">*</span>
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
                        Email de Contacto <span className="text-red-500">*</span>
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
                        Dirección <span className="text-red-500">*</span>
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
                          Ciudad <span className="text-red-500">*</span>
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
                          Estado <span className="text-red-500">*</span>
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
                          Código Postal <span className="text-red-500">*</span>
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

              {/* Nueva barra de botones fixed en estilo consistente con otros pasos */}
              <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => navigate('/onboarding/legal-data')}
                  className="btn-secondary"
                >
                  Atrás
                </button>
                
                <div className="flex items-center">
                  {hasUnsavedChanges && (
                    <>
                      <span className="text-orange-500 mr-4 flex items-center">
                        <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zm-1 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                        </svg>
                        Cambios sin guardar
                      </span>
                      
                      <button
                        type="button"
                        onClick={handleSave}
                        disabled={isSaving}
                        className="mr-4 px-4 py-2 bg-orange-100 text-orange-700 border border-orange-300 rounded-md hover:bg-orange-200 transition-colors"
                      >
                        {isSaving ? 'Guardando...' : 'Guardar cambios'}
                      </button>
                    </>
                  )}
                  
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={isSaving}
                  >
                    {isSaving ? 'Guardando...' : 'Continuar'}
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
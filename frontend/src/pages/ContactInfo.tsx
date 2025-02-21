import React, { useState } from 'react'
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

export default function ContactInfo() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { formData, updateField } = useFormProgress()

  // Helper function to get business name with fallback
  const getBusinessName = () => formData.legalBusinessName || 'tu empresa';

  const initialValues: FormValues = {
    contactName: formData.contactName || '',
    phone: formData.phone || '',
    email: formData.email || '',
    address: formData.address || '',
    city: formData.city || '',
    state: formData.state || '',
    zipCode: formData.zipCode || '',
    sameForAllLocations: formData.sameForAllLocations ?? false,
  }

  const handleFieldChange = (field: keyof FormData, value: any) => {
    updateField(field, value)
  }

  const handleSubmit = (values: FormValues) => {
    (Object.entries(values) as [keyof FormData, any][]).forEach(([field, value]) => {
      updateField(field, value)
    })
    navigate('/onboarding/location-details')
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-8">Información de Contacto</h2>
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
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
                    value={values.contactName}
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
                      value={values.phone}
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
                      value={values.email}
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
              <h3 className="text-lg font-medium text-gray-900">Dirección de Oficina Principal</h3>
              <div className="space-y-6">
                <div>
                  <div className="flex items-center">
                    <label htmlFor="address" className="form-label mb-0">
                      Dirección
                    </label>
                    <InfoTooltip 
                      text={`Ingresa la dirección de la oficina principal donde se gestionan las operaciones de ${getBusinessName()}.`}
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
                    value={values.address}
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
                      <InfoTooltip text={`Ciudad donde se encuentra la oficina principal de ${getBusinessName()}.`} />
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
                      value={values.city}
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
                      <InfoTooltip text={`Estado donde se encuentra la oficina principal de ${getBusinessName()}.`} />
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
                      value={values.state}
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
                      <InfoTooltip text={`Código postal de la oficina principal de ${getBusinessName()}.`} />
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
                      value={values.zipCode}
                    />
                    {errors.zipCode && touched.zipCode && (
                      <div className="error-message">{errors.zipCode}</div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="btn-secondary"
              >
                {t('back')}
              </button>
              <button type="submit" className="btn-primary">
                {t('continue')}
              </button>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  )
} 
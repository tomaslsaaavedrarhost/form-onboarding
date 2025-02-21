import React from 'react'
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

export default function ContactInfo() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { formData, updateField } = useFormProgress()

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
      <h2 className="text-2xl font-bold text-gray-900 mb-8">{t('contactInformation')}</h2>
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {({ errors, touched, setFieldValue, values }) => (
          <Form className="space-y-8">
            {/* Contact Information Section */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
              <h3 className="text-lg font-medium text-gray-900">{t('primaryContact')}</h3>
              <p className="text-sm text-gray-600">{t('primaryContactDescription')}</p>

              <div>
                <label htmlFor="contactName" className="form-label">
                  {t('contactName')}
                </label>
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
                  <label htmlFor="phone" className="form-label">
                    {t('phoneNumber')}
                  </label>
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
                  <label htmlFor="email" className="form-label">
                    {t('emailAddress')}
                  </label>
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
                  <p className="mt-2 text-sm text-gray-500">
                    {t('emailDisclaimer')}
                  </p>
                </div>
              </div>
            </div>

            {/* Office Information Section */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
              <h3 className="text-lg font-medium text-gray-900">{t('officeInformation')}</h3>
              <p className="text-sm text-gray-600">{t('officeDescription')}</p>

              <div>
                <label htmlFor="address" className="form-label">
                  {t('streetAddress')}
                </label>
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
                  <label htmlFor="city" className="form-label">
                    {t('city')}
                  </label>
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
                  <label htmlFor="state" className="form-label">
                    {t('state')}
                  </label>
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
                  <label htmlFor="zipCode" className="form-label">
                    {t('zipCode')}
                  </label>
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

              <div className="mt-4">
                <label className="inline-flex items-center">
                  <Field
                    type="checkbox"
                    name="sameForAllLocations"
                    className="form-checkbox"
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      const value = e.target.checked;
                      setFieldValue('sameForAllLocations', value);
                      handleFieldChange('sameForAllLocations', value);
                    }}
                    checked={values.sameForAllLocations}
                  />
                  <span className="ml-2">{t('sameForAllLocations')}</span>
                </label>
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
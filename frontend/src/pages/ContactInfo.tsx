import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Formik, Form, Field } from 'formik'
import * as Yup from 'yup'
import { useForm } from '../context/FormContext'
import { useTranslation } from '../hooks/useTranslation'

const validationSchema = Yup.object().shape({
  contactName: Yup.string().required('Contact name is required'),
  phone: Yup.string()
    .required('Phone number is required')
    .matches(/^[0-9-+()]*$/, 'Invalid phone number'),
  email: Yup.string()
    .email('Invalid email address')
    .required('Email is required'),
  address: Yup.string().required('Address is required'),
  city: Yup.string().required('City is required'),
  state: Yup.string().required('State is required'),
  zipCode: Yup.string()
    .required('ZIP code is required')
    .matches(/^[0-9]{5}(-[0-9]{4})?$/, 'Invalid ZIP code'),
})

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

export default function ContactInfo() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { state, dispatch } = useForm()

  const initialValues: FormValues = {
    contactName: state.contactInfo?.contactName || '',
    phone: state.contactInfo?.phone || '',
    email: state.contactInfo?.email || '',
    address: state.contactInfo?.address || '',
    city: state.contactInfo?.city || '',
    state: state.contactInfo?.state || '',
    zipCode: state.contactInfo?.zipCode || '',
    sameForAllLocations: state.contactInfo?.sameForAllLocations || false,
  }

  const handleFieldChange = (field: string, value: any) => {
    dispatch({
      type: 'SET_CONTACT_INFO',
      payload: {
        ...state.contactInfo,
        [field]: value
      }
    })
  }

  const handleSubmit = (values: FormValues) => {
    dispatch({
      type: 'SET_CONTACT_INFO',
      payload: values
    })
    navigate('/onboarding/location-details')
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">{t('contactInfoTitle')}</h2>
        <p className="mt-2 text-sm text-gray-600">
          {t('contactInfoSubtitle')}
        </p>
      </div>

      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {({ errors, touched, setFieldValue, values }) => (
          <Form className="space-y-6">
            {/* Contact Information Section */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
              <h3 className="text-lg font-medium text-gray-900">{t('basicContactInfo')}</h3>
              
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
            </div>

            <div className="flex justify-between">
              <button
                type="button"
                onClick={() => navigate('/onboarding/legal-data')}
                className="btn-secondary"
              >
                Back
              </button>
              <button type="submit" className="btn-primary">
                Continue
              </button>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  )
} 
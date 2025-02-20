import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Formik, Form, Field } from 'formik'
import * as Yup from 'yup'
import { useForm } from '../context/FormContext'
import { useTranslation } from '../hooks/useTranslation'

const validationSchema = Yup.object().shape({
  language: Yup.string().required('Language is required'),
  assistantName: Yup.string(),
  assistantGender: Yup.string()
    .required('Assistant gender is required')
    .oneOf(['male', 'female', 'neutral'], 'Invalid gender selection'),
  personality: Yup.string()
    .required('Personality trait is required'),
  otherPersonality: Yup.string().when('personality', {
    is: 'other',
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
  personality: string
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

  const initialValues: FormValues = {
    language: state.aiConfig?.language || 'en',
    otherLanguage: state.aiConfig?.otherLanguage || '',
    assistantName: state.aiConfig?.assistantName || '',
    assistantGender: state.aiConfig?.assistantGender || '',
    personality: state.aiConfig?.personality || '',
    otherPersonality: '',
    additionalInfo: state.aiConfig?.additionalInfo || '',
  }

  const handleFieldChange = (field: string, value: any) => {
    dispatch({
      type: 'SET_AI_CONFIG',
      payload: {
        ...state.aiConfig,
        [field]: value,
        avatar: null
      }
    })
  }

  const handleSubmit = (values: FormValues) => {
    dispatch({
      type: 'SET_AI_CONFIG',
      payload: {
        ...values,
        avatar: null
      }
    })
    navigate('/onboarding/menu-config')
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">AI Assistant Configuration</h2>
        <p className="mt-2 text-sm text-gray-600">
          Configure how your AI assistant will interact with customers.
        </p>
      </div>

      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {({ values, errors, touched, setFieldValue }) => (
          <Form className="space-y-6">
            {/* Basic Configuration */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Basic Configuration</h3>

              <div>
                <label htmlFor="language" className="form-label">
                  Primary Language<span className="text-red-500">*</span>
                </label>
                <Field
                  as="select"
                  name="language"
                  id="language"
                  className="select-brand mt-2"
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                    const value = e.target.value;
                    setFieldValue('language', value);
                    handleFieldChange('language', value);
                  }}
                  value={values.language}
                >
                  <option value="">Select language...</option>
                  {languages.map((lang) => (
                    <option key={lang.value} value={lang.value}>
                      {lang.label}
                    </option>
                  ))}
                </Field>
                {errors.language && touched.language && (
                  <div className="error-message">{errors.language}</div>
                )}
                <p className="mt-2 text-sm text-gray-500">
                  {t('secondaryLanguageNote')}
                </p>
              </div>

              <div>
                <label htmlFor="assistantName" className="form-label">
                  Assistant Name (Optional)
                </label>
                <Field
                  type="text"
                  name="assistantName"
                  id="assistantName"
                  className="input-field mt-2"
                  placeholder="Leave blank for default name"
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    const value = e.target.value;
                    setFieldValue('assistantName', value);
                    handleFieldChange('assistantName', value);
                  }}
                  value={values.assistantName}
                />
              </div>

              <div>
                <label htmlFor="assistantGender" className="form-label">
                  Assistant Gender<span className="text-red-500">*</span>
                </label>
                <Field
                  as="select"
                  name="assistantGender"
                  id="assistantGender"
                  className="select-brand mt-2"
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                    const value = e.target.value;
                    setFieldValue('assistantGender', value);
                    handleFieldChange('assistantGender', value);
                  }}
                  value={values.assistantGender}
                >
                  <option value="">Select gender...</option>
                  {genderOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Field>
                {errors.assistantGender && touched.assistantGender && (
                  <div className="error-message">{errors.assistantGender}</div>
                )}
              </div>
            </div>

            {/* Personality Configuration */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Personality Configuration</h3>

              <div>
                <label className="form-label">Personality Trait<span className="text-red-500">*</span></label>
                <div className="mt-2 space-y-2">
                  {personalityTraits.map((trait) => (
                    <div key={trait.value} className="flex items-center">
                      <Field
                        type="radio"
                        name="personality"
                        value={trait.value}
                        id={`personality-${trait.value}`}
                        className="h-4 w-4 border-gray-300 text-primary-600 focus:ring-primary-600"
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          setFieldValue('personality', e.target.value)
                          handleFieldChange('personality', e.target.value)
                        }}
                      />
                      <label
                        htmlFor={`personality-${trait.value}`}
                        className="ml-2 block text-sm text-gray-900"
                      >
                        {trait.label}
                      </label>
                    </div>
                  ))}
                </div>
                {errors.personality && touched.personality && (
                  <div className="error-message">{errors.personality}</div>
                )}

                {values.personality === 'other' && (
                  <div className="mt-4">
                    <label htmlFor="otherPersonality" className="form-label">
                      Describe the personality<span className="text-red-500">*</span>
                    </label>
                    <Field
                      type="text"
                      name="otherPersonality"
                      id="otherPersonality"
                      className="input-field mt-2"
                      placeholder="Describe the desired personality trait..."
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        const value = e.target.value;
                        setFieldValue('otherPersonality', value);
                        handleFieldChange('otherPersonality', value);
                      }}
                      value={values.otherPersonality}
                    />
                    {errors.otherPersonality && touched.otherPersonality && (
                      <div className="error-message">{errors.otherPersonality}</div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Additional Information */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Additional Information</h3>
              
              <div>
                <label htmlFor="additionalInfo" className="form-label">
                  Other Relevant Information
                </label>
                <Field
                  as="textarea"
                  name="additionalInfo"
                  id="additionalInfo"
                  rows={4}
                  className="input-field mt-2"
                  placeholder="Please provide any additional details or important information that may be helpful for the assistant..."
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                    const value = e.target.value;
                    setFieldValue('additionalInfo', value);
                    handleFieldChange('additionalInfo', value);
                  }}
                  value={values.additionalInfo}
                />
                {errors.additionalInfo && touched.additionalInfo && (
                  <div className="error-message">{errors.additionalInfo}</div>
                )}
              </div>
            </div>

            <div className="flex justify-between">
              <button
                type="button"
                onClick={() => navigate('/onboarding/location-details')}
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
import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useFormProgress, FormData } from '../hooks/useFormProgress'
import { useTranslation } from '../hooks/useTranslation'
import { Formik, Form, Field, FormikProps } from 'formik'
import * as Yup from 'yup'
import FormActions from '../components/FormActions'

interface FormValues {
  additionalNotes: string
  termsAccepted: boolean
}

const validationSchema = Yup.object().shape({
  additionalNotes: Yup.string(),
  termsAccepted: Yup.boolean().oneOf([true], 'You must accept the terms and conditions'),
})

export default function Observations() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { formData, updateField } = useFormProgress()

  const initialValues: FormValues = {
    additionalNotes: formData.additionalNotes || '',
    termsAccepted: formData.termsAccepted || false,
  }

  const handleFieldChange = (field: keyof FormData, value: any) => {
    updateField(field, value)
  }

  const handleSubmit = (values: FormValues) => {
    (Object.entries(values) as [keyof FormData, any][]).forEach(([field, value]) => {
      updateField(field, value)
    })
    navigate('/onboarding/review')
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-8">{t('additionalObservations')}</h2>
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {(formikProps: FormikProps<FormValues>) => (
          <Form className="space-y-8">
            <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
              <div>
                <label htmlFor="additionalNotes" className="form-label">
                  {t('additionalNotes')}
                </label>
                <Field
                  as="textarea"
                  name="additionalNotes"
                  id="additionalNotes"
                  rows={4}
                  className="input-field mt-2"
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                    const value = e.target.value
                    formikProps.setFieldValue('additionalNotes', value)
                    handleFieldChange('additionalNotes', value)
                  }}
                  value={formikProps.values.additionalNotes}
                />
                {formikProps.errors.additionalNotes && formikProps.touched.additionalNotes && (
                  <div className="error-message">{formikProps.errors.additionalNotes}</div>
                )}
              </div>

              <div>
                <label className="inline-flex items-center">
                  <Field
                    type="checkbox"
                    name="termsAccepted"
                    className="form-checkbox"
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      const value = e.target.checked
                      formikProps.setFieldValue('termsAccepted', value)
                      handleFieldChange('termsAccepted', value)
                    }}
                    checked={formikProps.values.termsAccepted}
                  />
                  <span className="ml-2">{t('termsAndConditions')}</span>
                </label>
                {formikProps.errors.termsAccepted && formikProps.touched.termsAccepted && (
                  <div className="error-message">{formikProps.errors.termsAccepted}</div>
                )}
              </div>
            </div>

            <FormActions
              onSubmit={formikProps.submitForm}
              nextPath="/onboarding/review"
              isValid={formikProps.isValid}
            />
          </Form>
        )}
      </Formik>
    </div>
  )
} 
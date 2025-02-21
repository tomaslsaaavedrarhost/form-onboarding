import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Formik, Form, Field } from 'formik'
import * as Yup from 'yup'
import { useForm } from '../context/FormContext'

const validationSchema = Yup.object().shape({
  additionalNotes: Yup.string(),
  termsAccepted: Yup.boolean()
    .oneOf([true], 'You must accept the terms and conditions')
    .required('You must accept the terms and conditions'),
})

interface FormValues {
  additionalNotes: string
  termsAccepted: boolean
}

export default function Observations() {
  const navigate = useNavigate()
  const { state, dispatch } = useForm()

  const initialValues: FormValues = {
    additionalNotes: state.additionalNotes || '',
    termsAccepted: state.termsAccepted || false,
  }

  // Add real-time saving
  const handleFieldChange = (field: string, value: any) => {
    if (field === 'additionalNotes') {
      dispatch({
        type: 'SET_ADDITIONAL_NOTES',
        payload: value
      })
    } else if (field === 'termsAccepted') {
      dispatch({
        type: 'SET_TERMS_ACCEPTED',
        payload: value
      })
    }
  }

  const handleSubmit = (values: FormValues) => {
    dispatch({
      type: 'SET_ADDITIONAL_NOTES',
      payload: values.additionalNotes
    })
    dispatch({
      type: 'SET_TERMS_ACCEPTED',
      payload: values.termsAccepted
    })
    navigate('/onboarding/review')
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">Additional Notes</h2>
        <p className="mt-2 text-sm text-gray-600">
          Add any additional information or special requirements for your restaurant.
        </p>
      </div>

      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {({ errors, touched }) => (
          <Form className="space-y-6">
            <div>
              <label htmlFor="additionalNotes" className="form-label">
                Additional Notes
              </label>
              <Field
                as="textarea"
                name="additionalNotes"
                id="additionalNotes"
                rows={6}
                className="input-field mt-2"
                placeholder="Enter any additional information that might be relevant for the AI assistant configuration..."
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                  handleFieldChange('additionalNotes', e.target.value)
                }}
              />
              {errors.additionalNotes && touched.additionalNotes && (
                <div className="error-message">{errors.additionalNotes}</div>
              )}
            </div>

            <div className="rounded-md bg-gray-50 p-4">
              <div className="flex items-start">
                <div className="flex h-6 items-center">
                  <Field
                    type="checkbox"
                    name="termsAccepted"
                    id="termsAccepted"
                    className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-600"
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      handleFieldChange('termsAccepted', e.target.checked)
                    }}
                  />
                </div>
                <div className="ml-3">
                  <label htmlFor="termsAccepted" className="text-sm text-gray-700">
                    I accept the{' '}
                    <a
                      href="#"
                      className="font-medium text-primary-600 hover:text-primary-500"
                      onClick={(e) => {
                        e.preventDefault()
                        // Here you would typically open the terms and conditions modal/page
                      }}
                    >
                      terms and conditions
                    </a>
                  </label>
                  {errors.termsAccepted && touched.termsAccepted && (
                    <p className="error-message">{errors.termsAccepted}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-between">
              <button
                type="button"
                onClick={() => navigate('/onboarding/tips-policy')}
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
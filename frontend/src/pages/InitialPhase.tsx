import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Formik, Form, Field, FormikProps } from 'formik'
import * as Yup from 'yup'
import { useForm } from '../context/FormContext'

const validationSchema = Yup.object().shape({
  locationCount: Yup.number()
    .required('Required')
    .min(1, 'Must have at least 1 location')
    .max(50, 'Cannot have more than 50 locations'),
  locations: Yup.array().of(
    Yup.object().shape({
      id: Yup.string().required('ID is required'),
      name: Yup.string().required('Location name is required'),
      nameConfirmed: Yup.boolean()
        .oneOf([true], 'Please confirm the location name')
        .required('Please confirm the location name'),
    })
  ),
})

interface Location {
  id: string
  name: string
  nameConfirmed: boolean
}

interface FormValues {
  locationCount: number
  locations: Location[]
}

interface FormikTouched<T> {
  [key: string]: boolean | FormikTouched<T[keyof T]>
}

interface LocationErrors {
  name?: string
  nameConfirmed?: string
}

interface FormErrors {
  locationCount?: string
  locations?: LocationErrors[]
}

export default function InitialPhase() {
  const navigate = useNavigate()
  const [showLocationInputs, setShowLocationInputs] = useState(false)
  const { state, dispatch } = useForm()

  const initialValues: FormValues = {
    locationCount: state.locations.length || 1,
    locations: state.locations.length > 0 
      ? state.locations 
      : [{ id: '1', name: '', nameConfirmed: false }],
  }

  useEffect(() => {
    if (state.locations.length > 0) {
      setShowLocationInputs(true)
    }
  }, [state.locations])

  const handleSubmit = (values: FormValues) => {
    const locations = values.locations.map((location, index) => ({
      ...location,
      id: location.id || String(index + 1),
    }))
    
    dispatch({ type: 'SET_LOCATIONS', payload: locations })
    navigate('/ai-config')
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold">
          <div className="bg-gradient-brand bg-clip-text text-transparent inline-block">
            Initial Setup
          </div>
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          Let's start by setting up your restaurant locations.
        </p>
      </div>

      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
        enableReinitialize
      >
        {(formikProps: FormikProps<FormValues>) => {
          const { values, setFieldValue, errors, touched } = formikProps
          
          useEffect(() => {
            if (values.locationCount === 1 && !showLocationInputs) {
              setShowLocationInputs(true)
            }
          }, [values.locationCount])

          return (
            <Form className="space-y-6">
              <div>
                <label htmlFor="locationCount" className="form-label">
                  How many locations does your restaurant have?
                </label>
                <Field
                  type="number"
                  name="locationCount"
                  id="locationCount"
                  min="1"
                  max="50"
                  className="input-field mt-2"
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    const count = parseInt(e.target.value)
                    setFieldValue('locationCount', count)
                    setFieldValue(
                      'locations',
                      Array(count)
                        .fill(null)
                        .map((_, i) => ({
                          id: values.locations[i]?.id || String(i + 1),
                          name: values.locations[i]?.name || '',
                          nameConfirmed: values.locations[i]?.nameConfirmed || false,
                        }))
                    )
                    if (count === 1) {
                      setShowLocationInputs(true)
                    }
                  }}
                />
                {errors.locationCount && touched.locationCount && (
                  <div className="error-message">{errors.locationCount}</div>
                )}
              </div>

              {showLocationInputs && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900">Location Names</h3>
                  {values.locations.map((location, index) => (
                    <div key={location.id} className="space-y-4 rounded-lg border border-gray-200 p-4">
                      <div>
                        <label htmlFor={`locations.${index}.name`} className="form-label">
                          Location {index + 1} Name
                        </label>
                        <Field
                          type="text"
                          name={`locations.${index}.name`}
                          id={`locations.${index}.name`}
                          className="input-field mt-2"
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            setFieldValue(`locations.${index}.name`, e.target.value)
                            setFieldValue(`locations.${index}.nameConfirmed`, false)
                          }}
                        />
                        {errors.locations?.[index]?.name && touched.locations?.[index]?.name && (
                          <div className="error-message">
                            {errors.locations[index].name}
                          </div>
                        )}
                      </div>

                      {location.name && (
                        <div className="rounded-md bg-gray-50 p-4">
                          <div className="flex items-start">
                            <div className="flex h-6 items-center">
                              <Field
                                type="checkbox"
                                name={`locations.${index}.nameConfirmed`}
                                id={`locations.${index}.nameConfirmed`}
                                className="checkbox-brand"
                              />
                            </div>
                            <div className="ml-3">
                              <label
                                htmlFor={`locations.${index}.nameConfirmed`}
                                className="text-sm text-gray-700"
                              >
                                I confirm that "{location.name}" is the exact name of this location
                              </label>
                              {errors.locations?.[index]?.nameConfirmed && 
                               touched.locations?.[index]?.nameConfirmed && (
                                <p className="error-message mt-1">
                                  {errors.locations[index].nameConfirmed}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={() => navigate('/contact-info')}
                  className="btn-secondary"
                >
                  Back
                </button>
                <button type="submit" className="btn-primary">
                  Continue to AI Configuration
                </button>
              </div>
            </Form>
          )
        }}
      </Formik>
    </div>
  )
} 
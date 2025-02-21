import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Formik, Form, Field } from 'formik'
import * as Yup from 'yup'
import { useForm } from '../context/FormContext'
import { FormikErrors, FormikTouched } from 'formik'

interface LocationPolicy {
  locationId: string
  hasTips: 'yes' | 'no' | 'depends'
  tipDetails: string
  hasServiceCharge: boolean
  serviceChargeDetails: string
}

interface GroupPolicy {
  groupId: string
  locations: string[]
  hasTips: 'yes' | 'no' | 'depends'
  tipDetails: string
  hasServiceCharge: boolean
  serviceChargeDetails: string
}

interface PolicyObject {
  hasTips: 'yes' | 'no' | 'depends'
  tipDetails: string
  hasServiceCharge: boolean
  serviceChargeDetails: string
}

interface TipsPolicyState {
  useGroups: boolean
  locationPolicies: { [key: string]: PolicyObject }
  groupPolicies: { [key: string]: PolicyObject }
}

interface FormValues {
  useGroups: boolean
  locationPolicies: LocationPolicy[]
  groupPolicies: GroupPolicy[]
}

const validationSchema = Yup.object().shape({
  useGroups: Yup.boolean().required(),
  locationPolicies: Yup.array().when('useGroups', {
    is: false,
    then: () => Yup.array().of(
      Yup.object().shape({
        locationId: Yup.string().required(),
        hasTips: Yup.string()
          .required('Please select a tipping policy')
          .oneOf(['yes', 'no', 'depends']),
        tipDetails: Yup.string().when('hasTips', {
          is: (val: string) => val === 'yes' || val === 'depends',
          then: () => Yup.string().required('Please provide tip details'),
        }),
        hasServiceCharge: Yup.boolean().required('Please specify if there is a service charge'),
        serviceChargeDetails: Yup.string().when('hasServiceCharge', {
          is: true,
          then: () => Yup.string().required('Please provide service charge details'),
        }),
      })
    ),
  }),
  groupPolicies: Yup.array().when('useGroups', {
    is: true,
    then: () => Yup.array().of(
      Yup.object().shape({
        groupId: Yup.string().required(),
        locations: Yup.array().of(Yup.string()).min(1, 'At least one location is required'),
        hasTips: Yup.string()
          .required('Please select a tipping policy')
          .oneOf(['yes', 'no', 'depends']),
        tipDetails: Yup.string().when('hasTips', {
          is: (val: string) => val === 'yes' || val === 'depends',
          then: () => Yup.string().required('Please provide tip details'),
        }),
        hasServiceCharge: Yup.boolean().required('Please specify if there is a service charge'),
        serviceChargeDetails: Yup.string().when('hasServiceCharge', {
          is: true,
          then: () => Yup.string().required('Please provide service charge details'),
        }),
      })
    ),
  }),
})

export default function TipsPolicy() {
  const navigate = useNavigate()
  const { state, dispatch } = useForm()

  const initialValues: FormValues = {
    useGroups: state.tipsPolicy?.useGroups || false,
    locationPolicies: state.locations.map(location => ({
      locationId: location.id,
      hasTips: state.tipsPolicy?.locationPolicies?.[location.id]?.hasTips || 'yes',
      tipDetails: state.tipsPolicy?.locationPolicies?.[location.id]?.tipDetails || '',
      hasServiceCharge: state.tipsPolicy?.locationPolicies?.[location.id]?.hasServiceCharge || false,
      serviceChargeDetails: state.tipsPolicy?.locationPolicies?.[location.id]?.serviceChargeDetails || '',
    })),
    groupPolicies: state.menuGroups.map(group => ({
      groupId: group.name,
      locations: group.locations,
      hasTips: state.tipsPolicy?.groupPolicies?.[group.name]?.hasTips || 'yes',
      tipDetails: state.tipsPolicy?.groupPolicies?.[group.name]?.tipDetails || '',
      hasServiceCharge: state.tipsPolicy?.groupPolicies?.[group.name]?.hasServiceCharge || false,
      serviceChargeDetails: state.tipsPolicy?.groupPolicies?.[group.name]?.serviceChargeDetails || '',
    })),
  }

  const handleSubmit = (values: FormValues) => {
    // Convert array policies to object format
    const locationPolicies: { [key: string]: PolicyObject } = {}
    values.locationPolicies.forEach(policy => {
      locationPolicies[policy.locationId] = {
        hasTips: policy.hasTips,
        tipDetails: policy.tipDetails,
        hasServiceCharge: policy.hasServiceCharge,
        serviceChargeDetails: policy.serviceChargeDetails
      }
    })

    const groupPolicies: { [key: string]: PolicyObject } = {}
    values.groupPolicies.forEach(policy => {
      groupPolicies[policy.groupId] = {
        hasTips: policy.hasTips,
        tipDetails: policy.tipDetails,
        hasServiceCharge: policy.hasServiceCharge,
        serviceChargeDetails: policy.serviceChargeDetails
      }
    })

    dispatch({
      type: 'SET_TIPS_POLICY',
      payload: {
        useGroups: values.useGroups,
        locationPolicies,
        groupPolicies
      }
    })
    navigate('/onboarding/observations')
  }

  const handleFieldChange = (field: string, value: any) => {
    const currentState = { ...state.tipsPolicy } as TipsPolicyState
    if (field.startsWith('locationPolicies.')) {
      const [, locationId, prop] = field.split('.')
      currentState.locationPolicies[locationId] = {
        ...currentState.locationPolicies[locationId],
        [prop]: value
      }
    } else if (field.startsWith('groupPolicies.')) {
      const [, groupId, prop] = field.split('.')
      currentState.groupPolicies[groupId] = {
        ...currentState.groupPolicies[groupId],
        [prop]: value
      }
    } else {
      (currentState as any)[field] = value
    }

    dispatch({
      type: 'SET_TIPS_POLICY',
      payload: currentState
    })
  }

  const renderPolicyFields = (
    prefix: string,
    values: PolicyObject,
    errors: FormikErrors<LocationPolicy> | FormikErrors<GroupPolicy>,
    touched: FormikTouched<LocationPolicy> | FormikTouched<GroupPolicy>,
    name: string
  ) => (
    <div className="space-y-6">
      <div>
        <label className="form-label">Does your restaurant accept tips?</label>
        <div className="mt-2 space-y-4">
          <div className="flex items-center">
            <Field
              type="radio"
              name={`${prefix}.hasTips`}
              value="yes"
              id={`${prefix}-tips-yes`}
              className="h-4 w-4 border-gray-300 text-primary-600 focus:ring-primary-600"
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                handleFieldChange(`${prefix}.hasTips`, e.target.value)
              }}
            />
            <label htmlFor={`${prefix}-tips-yes`} className="ml-3 block text-sm text-gray-700">
              Yes, we accept tips
            </label>
          </div>
          <div className="flex items-center">
            <Field
              type="radio"
              name={`${prefix}.hasTips`}
              value="no"
              id={`${prefix}-tips-no`}
              className="h-4 w-4 border-gray-300 text-primary-600 focus:ring-primary-600"
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                handleFieldChange(`${prefix}.hasTips`, e.target.value)
              }}
            />
            <label htmlFor={`${prefix}-tips-no`} className="ml-3 block text-sm text-gray-700">
              No, we don't accept tips
            </label>
          </div>
          <div className="flex items-center">
            <Field
              type="radio"
              name={`${prefix}.hasTips`}
              value="depends"
              id={`${prefix}-tips-depends`}
              className="h-4 w-4 border-gray-300 text-primary-600 focus:ring-primary-600"
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                handleFieldChange(`${prefix}.hasTips`, e.target.value)
              }}
            />
            <label htmlFor={`${prefix}-tips-depends`} className="ml-3 block text-sm text-gray-700">
              It depends (specify below)
            </label>
          </div>
        </div>
        {errors?.hasTips && touched?.hasTips && (
          <div className="error-message">{errors.hasTips}</div>
        )}
      </div>

      {(values.hasTips === 'yes' || values.hasTips === 'depends') && (
        <div>
          <label htmlFor={`${prefix}-tipDetails`} className="form-label">
            Tip Details
          </label>
          <Field
            as="textarea"
            name={`${prefix}.tipDetails`}
            id={`${prefix}-tipDetails`}
            rows={3}
            className="input-field mt-2"
            placeholder="Explain your tipping policy (e.g., suggested percentages, minimum party size for automatic gratuity, etc.)"
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
              handleFieldChange(`${prefix}.tipDetails`, e.target.value)
            }}
          />
          {errors?.tipDetails && touched?.tipDetails && (
            <div className="error-message">{errors.tipDetails}</div>
          )}
        </div>
      )}

      <div>
        <div className="flex items-center">
          <Field
            type="checkbox"
            name={`${prefix}.hasServiceCharge`}
            id={`${prefix}-hasServiceCharge`}
            className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-600"
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              handleFieldChange(`${prefix}.hasServiceCharge`, e.target.checked)
            }}
          />
          <label htmlFor={`${prefix}-hasServiceCharge`} className="ml-2 block text-sm text-gray-900">
            We apply a service charge
          </label>
        </div>
        {errors?.hasServiceCharge && touched?.hasServiceCharge && (
          <div className="error-message">{errors.hasServiceCharge}</div>
        )}
      </div>

      {values.hasServiceCharge && (
        <div>
          <label htmlFor={`${prefix}-serviceChargeDetails`} className="form-label">
            Service Charge Details
          </label>
          <Field
            as="textarea"
            name={`${prefix}.serviceChargeDetails`}
            id={`${prefix}-serviceChargeDetails`}
            rows={3}
            className="input-field mt-2"
            placeholder="Explain your service charge policy (e.g., percentage, conditions, etc.)"
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
              handleFieldChange(`${prefix}.serviceChargeDetails`, e.target.value)
            }}
          />
          {errors?.serviceChargeDetails && touched?.serviceChargeDetails && (
            <div className="error-message">{errors.serviceChargeDetails}</div>
          )}
        </div>
      )}
    </div>
  )

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">Tips & Service Charges</h2>
        <p className="mt-2 text-sm text-gray-600">
          Configure your restaurant's tipping and service charge policies.
        </p>
      </div>

      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {({ values, errors, touched }) => (
          <Form className="space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <Field
                    type="radio"
                    name="useGroups"
                    value={false}
                    className="h-4 w-4 border-gray-300 text-primary-600 focus:ring-primary-600"
                  />
                  <span className="ml-2 text-sm text-gray-900">Configure by Location</span>
                </label>
                <label className="flex items-center">
                  <Field
                    type="radio"
                    name="useGroups"
                    value={true}
                    className="h-4 w-4 border-gray-300 text-primary-600 focus:ring-primary-600"
                  />
                  <span className="ml-2 text-sm text-gray-900">Configure by Groups</span>
                </label>
              </div>
            </div>

            {!values.useGroups ? (
              // Por ubicación
              values.locationPolicies.map((policy, index) => {
                const location = state.locations.find(l => l.id === policy.locationId)
                return (
                  <div key={policy.locationId} className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      {location?.name}
                    </h3>
                    {renderPolicyFields(
                      `locationPolicies.${index}`,
                      policy,
                      errors.locationPolicies?.[index] as FormikErrors<LocationPolicy>,
                      touched.locationPolicies?.[index] as FormikTouched<LocationPolicy>,
                      location?.name || ''
                    )}
                  </div>
                )
              })
            ) : (
              // Por grupo
              values.groupPolicies.map((policy, index) => {
                const locationNames = policy.locations
                  .map(locId => state.locations.find(l => l.id === locId)?.name)
                  .filter(Boolean)
                  .join(', ')
                return (
                  <div key={policy.groupId} className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {policy.groupId}
                    </h3>
                    <p className="text-sm text-gray-500 mb-4">
                      Locations: {locationNames}
                    </p>
                    {renderPolicyFields(
                      `groupPolicies.${index}`,
                      policy,
                      errors.groupPolicies?.[index] as FormikErrors<GroupPolicy>,
                      touched.groupPolicies?.[index] as FormikTouched<GroupPolicy>,
                      policy.groupId
                    )}
                  </div>
                )
              })
            )}

            <div className="flex justify-between">
              <button
                type="button"
                onClick={() => navigate('/onboarding/menu-config')}
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
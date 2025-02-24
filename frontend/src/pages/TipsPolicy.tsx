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
      locations: group.locations || [],
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
              No, we do not accept tips
            </label>
          </div>
        </div>
      </div>
      {values.hasTips === 'depends' && (
        <div>
          <label className="form-label">Why do you not accept tips?</label>
          <Field
            type="text"
            name={`${prefix}.tipDetails`}
            id={`${prefix}-tip-details`}
            className="mt-1 block w-full"
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              handleFieldChange(`${prefix}.tipDetails`, e.target.value)
            }}
          />
        </div>
      )}
      <div>
        <label className="form-label">Does your restaurant charge a service fee?</label>
        <div className="mt-2 space-y-4">
          <div className="flex items-center">
            <Field
              type="radio"
              name={`${prefix}.hasServiceCharge`}
              value="yes"
              id={`${prefix}-service-charge-yes`}
              className="h-4 w-4 border-gray-300 text-primary-600 focus:ring-primary-600"
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                handleFieldChange(`${prefix}.hasServiceCharge`, e.target.value === 'yes')
              }}
            />
            <label htmlFor={`${prefix}-service-charge-yes`} className="ml-3 block text-sm text-gray-700">
              Yes, we charge a service fee
            </label>
          </div>
          <div className="flex items-center">
            <Field
              type="radio"
              name={`${prefix}.hasServiceCharge`}
              value="no"
              id={`${prefix}-service-charge-no`}
              className="h-4 w-4 border-gray-300 text-primary-600 focus:ring-primary-600"
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                handleFieldChange(`${prefix}.hasServiceCharge`, e.target.value === 'no')
              }}
            />
            <label htmlFor={`${prefix}-service-charge-no`} className="ml-3 block text-sm text-gray-700">
              No, we do not charge a service fee
            </label>
          </div>
        </div>
      </div>
      {values.hasServiceCharge && (
        <div>
          <label className="form-label">Service fee details</label>
          <Field
            type="text"
            name={`${prefix}.serviceChargeDetails`}
            id={`${prefix}-service-charge-details`}
            className="mt-1 block w-full"
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              handleFieldChange(`${prefix}.serviceChargeDetails`, e.target.value)
            }}
          />
        </div>
      )}
    </div>
  )

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold mb-4">Tipping Policy</h1>
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {({ isSubmitting }) => (
          <Form className="space-y-6">
            <div>
              <label className="form-label">Use location-specific policies</label>
              <div className="mt-2 space-y-4">
                <div className="flex items-center">
                  <Field
                    type="radio"
                    name="useGroups"
                    value="yes"
                    id="use-groups-yes"
                    className="h-4 w-4 border-gray-300 text-primary-600 focus:ring-primary-600"
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      handleFieldChange('useGroups', e.target.value === 'yes')
                    }}
                  />
                  <label htmlFor="use-groups-yes" className="ml-3 block text-sm text-gray-700">
                    Yes, use location-specific policies
                  </label>
                </div>
                <div className="flex items-center">
                  <Field
                    type="radio"
                    name="useGroups"
                    value="no"
                    id="use-groups-no"
                    className="h-4 w-4 border-gray-300 text-primary-600 focus:ring-primary-600"
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      handleFieldChange('useGroups', e.target.value === 'no')
                    }}
                  />
                  <label htmlFor="use-groups-no" className="ml-3 block text-sm text-gray-700">
                    No, use a single policy for all locations
                  </label>
                </div>
              </div>
            </div>
            {state.useGroups && (
              <>
                {state.locations.map(location => (
                  <div key={location.id} className="space-y-6">
                    <h2 className="text-xl font-bold">{location.name}</h2>
                    {renderPolicyFields(`locationPolicies.${location.id}`, state.tipsPolicy?.locationPolicies?.[location.id] || {}, {}, {}, location.id)}
                  </div>
                ))}
                {state.menuGroups.map(group => (
                  <div key={group.name} className="space-y-6">
                    <h2 className="text-xl font-bold">{group.name}</h2>
                    {renderPolicyFields(`groupPolicies.${group.name}`, state.tipsPolicy?.groupPolicies?.[group.name] || {}, {}, {}, group.name)}
                  </div>
                ))}
              </>
            )}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700"
            >
              {isSubmitting ? 'Saving...' : 'Save'}
            </button>
          </Form>
        )}
      </Formik>
    </div>
  )
}
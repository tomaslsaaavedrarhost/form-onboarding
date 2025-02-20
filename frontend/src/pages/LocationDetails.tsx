import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Formik, Form, Field, FieldArray } from 'formik'
import * as Yup from 'yup'
import { useForm } from '../context/FormContext'
import { useTranslation } from '../hooks/useTranslation'
import { TimeSlots } from '../components/TimeSlots'
import WeeklySchedule from '../components/WeeklySchedule'
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline'
import { LocationDetail } from '../context/FormContext'
import { useFormikContext } from 'formik'

// Lista de estados de EE.UU.
const US_STATES = [
  { value: 'AL', label: 'Alabama' },
  { value: 'AK', label: 'Alaska' },
  { value: 'AZ', label: 'Arizona' },
  { value: 'AR', label: 'Arkansas' },
  { value: 'CA', label: 'California' },
  { value: 'CO', label: 'Colorado' },
  { value: 'CT', label: 'Connecticut' },
  { value: 'DE', label: 'Delaware' },
  { value: 'FL', label: 'Florida' },
  { value: 'GA', label: 'Georgia' },
  { value: 'HI', label: 'Hawaii' },
  { value: 'ID', label: 'Idaho' },
  { value: 'IL', label: 'Illinois' },
  { value: 'IN', label: 'Indiana' },
  { value: 'IA', label: 'Iowa' },
  { value: 'KS', label: 'Kansas' },
  { value: 'KY', label: 'Kentucky' },
  { value: 'LA', label: 'Louisiana' },
  { value: 'ME', label: 'Maine' },
  { value: 'MD', label: 'Maryland' },
  { value: 'MA', label: 'Massachusetts' },
  { value: 'MI', label: 'Michigan' },
  { value: 'MN', label: 'Minnesota' },
  { value: 'MS', label: 'Mississippi' },
  { value: 'MO', label: 'Missouri' },
  { value: 'MT', label: 'Montana' },
  { value: 'NE', label: 'Nebraska' },
  { value: 'NV', label: 'Nevada' },
  { value: 'NH', label: 'New Hampshire' },
  { value: 'NJ', label: 'New Jersey' },
  { value: 'NM', label: 'New Mexico' },
  { value: 'NY', label: 'New York' },
  { value: 'NC', label: 'North Carolina' },
  { value: 'ND', label: 'North Dakota' },
  { value: 'OH', label: 'Ohio' },
  { value: 'OK', label: 'Oklahoma' },
  { value: 'OR', label: 'Oregon' },
  { value: 'PA', label: 'Pennsylvania' },
  { value: 'RI', label: 'Rhode Island' },
  { value: 'SC', label: 'South Carolina' },
  { value: 'SD', label: 'South Dakota' },
  { value: 'TN', label: 'Tennessee' },
  { value: 'TX', label: 'Texas' },
  { value: 'UT', label: 'Utah' },
  { value: 'VT', label: 'Vermont' },
  { value: 'VA', label: 'Virginia' },
  { value: 'WA', label: 'Washington' },
  { value: 'WV', label: 'West Virginia' },
  { value: 'WI', label: 'Wisconsin' },
  { value: 'WY', label: 'Wyoming' },
  { value: 'DC', label: 'District of Columbia' }
] as const

// Lista de carriers de teléfono
const PHONE_CARRIERS = [
  'VERIZON WIRELESS',
  'AT&T MOBILITY',
  'T-MOBILE USA',
  'SPRINT CORPORATION'
] as const

// Lista de métodos de pago
const PAYMENT_METHODS = [
  'CASH',
  'CREDIT_CARD',
  'DEBIT_CARD',
  'MOBILE_PAYMENT',
  'GIFT_CARD'
] as const

// Lista de tipos de llamadas
const CALL_TYPES = [
  { value: 'catering', label: 'Catering Inquiries' },
  { value: 'dietary', label: 'Dietary/Allergy Questions' },
  { value: 'vegan', label: 'Vegan Options' },
  { value: 'events', label: 'Events & Private Dining' },
  { value: 'other', label: 'Other' }
]

const RESERVATION_PLATFORMS = [
  'OPENTABLE',
  'RESY',
  'YELP',
  'TOCK',
  'SEVENROOMS',
  'TABLEIN'
] as const

const PICKUP_DELIVERY_PLATFORMS = [
  'UBER_EATS',
  'DOORDASH',
  'GRUBHUB',
  'POSTMATES',
  'SEAMLESS',
  'CHOWNOW',
  'TOAST_TAKEOUT',
  'OWN_PLATFORM',
  'OTHER'
] as const

interface CarrierCredentials {
  username: string
  password: string
  pin: string
}

interface TransferRule {
  type: string
  number: string
  description?: string
  otherType?: string
}

interface TimeSlot {
  start: string
  end: string
  type: string
  kitchenClosingTime?: string | null
}

interface DaySchedule {
  enabled: boolean
  timeSlots: TimeSlot[]
}

interface WeeklySchedule {
  [key: string]: DaySchedule
}

interface ReservationSettings {
  acceptsReservations: boolean
  platform: string
  reservationLink: string
  phoneCarrier: string
  parking: {
    hasParking: boolean
    parkingType?: 'free' | 'paid'
    pricingDetails: string
    location: string
  }
  schedule: WeeklySchedule
}

interface ExtendedLocationDetail extends LocationDetail {
  schedule: WeeklySchedule
  paymentMethodsNotes: string
  defaultTransferToHost: boolean
  transferRules: any[]
  reservationSettings: ReservationSettings
}

interface FormValues {
  locationDetails: LocationDetail[]
}

const phoneRegExp = /^\+?1?\d{10,14}$/

const getErrorMessage = (error: any, defaultMessage: string) => {
  return typeof error === 'string' ? error : defaultMessage
}

// Add this constant for the days of the week
const DAYS_OF_WEEK = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

// Add this constant for weekdays and weekends
const WEEKDAYS: (keyof WeeklySchedule)[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
const WEEKENDS: (keyof WeeklySchedule)[] = ['saturday', 'sunday']

// Add these constants at the top with other constants
const WAIT_TIME_RANGES = [
  { value: '0-15', label: '0-15 min', color: 'bg-green-100 hover:bg-green-200' },
  { value: '15-30', label: '15-30 min', color: 'bg-yellow-100 hover:bg-yellow-200' },
  { value: '30-45', label: '30-45 min', color: 'bg-orange-100 hover:bg-orange-200' },
  { value: '45-60', label: '45-60 min', color: 'bg-red-100 hover:bg-red-200' },
  { value: '60+', label: '60+ min', color: 'bg-red-200 hover:bg-red-300' }
] as const

const TIME_SLOTS = [
  { id: 'opening-15', label: 'Opening - 15:00' },
  { id: '15-18', label: '15:00 - 18:00' },
  { id: '18-22', label: '18:00 - 22:00' },
  { id: '22-closing', label: '22:00 - Closing' }
] as const

// Add these constants at the top with other constants
const AGE_VERIFICATION_DOCUMENTS = [
  'DRIVERS_LICENSE',
  'PASSPORT',
  'MILITARY_ID',
  'STATE_ID',
  'FOREIGN_PASSPORT',
  'OTHER'
] as const

// Update the section titles to use gradient text
const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <h3 className="text-lg font-bold tracking-tight bg-gradient-brand bg-clip-text text-transparent mb-4">
    {children}
  </h3>
)

export const createEmptySchedule = () => {
  const schedule: LocationDetail['schedule'] = {}
  DAYS_OF_WEEK.forEach(day => {
    schedule[day] = {
      enabled: false,
      timeSlots: []
    }
  })
  return schedule
}

export const createEmptyLocation = (): LocationDetail => ({
  locationId: '',
  state: '',
  streetAddress: '',
  timeZone: '',
  managerEmail: '',
  phoneNumbers: [],
  acceptedPaymentMethods: [],
  creditCardExclusions: '',
  debitCardExclusions: '',
  mobilePaymentExclusions: '',
  phoneCarrier: '',
  schedule: createEmptySchedule(),
  defaultTransferToHost: false,
  transferRules: [],
  reservationSettings: {
    acceptsReservations: false,
    platform: '',
    reservationLink: '',
    phoneCarrier: '',
    parking: {
      hasParking: false,
      parkingType: undefined,
      pricingDetails: '',
      location: ''
    },
    schedule: createEmptySchedule()
  },
  waitTimes: {
    monday: {},
    tuesday: {},
    wednesday: {},
    thursday: {},
    friday: {},
    saturday: {},
    sunday: {}
  },
  pickupSettings: {
    platforms: [],
    preferredPlatform: '',
    preferredPlatformLink: ''
  },
  deliverySettings: {
    platforms: [],
    preferredPlatform: '',
    preferredPlatformLink: ''
  },
  parking: {
    hasParking: false,
    parkingType: undefined,
    pricingDetails: '',
    location: ''
  },
  corkage: {
    allowed: false,
    fee: ''
  },
  specialDiscounts: {
    hasDiscounts: false,
    details: []
  },
  holidayEvents: {
    hasEvents: false,
    events: []
  },
  specialEvents: {
    hasEvents: false,
    events: []
  },
  socialMedia: {
    instagram: {
      usesInstagram: false,
      handle: ''
    }
  },
  birthdayCelebrations: {
    allowed: false,
    details: '',
    restrictions: []
  },
  dressCode: {
    hasDressCode: false,
    details: '',
    exceptions: []
  },
  ageVerification: {
    acceptedDocuments: [],
    otherDocuments: ''
  },
  smokingArea: {
    hasSmokingArea: false,
    details: ''
  },
  brunchMenu: {
    hasBrunchMenu: false,
    schedule: '',
    menuFile: null
  }
})

const validationSchema = Yup.object().shape({
  locationDetails: Yup.array().of(
    Yup.object().shape({
      locationId: Yup.string().required('required'),
      state: Yup.string().required('required'),
      streetAddress: Yup.string().required('required'),
      timeZone: Yup.string().required('required'),
      managerEmail: Yup.string().email('invalidEmail').required('required'),
      phoneNumbers: Yup.array().of(Yup.string()).min(1, 'required'),
      acceptedPaymentMethods: Yup.array().of(Yup.string()).min(1, 'required'),
      phoneCarrier: Yup.string().required('required'),
      schedule: Yup.object().shape(
        DAYS_OF_WEEK.reduce((acc, day) => ({
          ...acc,
          [day]: Yup.object().shape({
            enabled: Yup.boolean(),
            timeSlots: Yup.array().when('enabled', {
              is: true,
              then: () => Yup.array().of(
                Yup.object().shape({
                  start: Yup.string().required('required'),
                  end: Yup.string().required('required'),
                  type: Yup.string().required('required'),
                  kitchenClosingTime: Yup.string().nullable()
                })
              ).min(1, 'atLeastOneTimeSlot')
            })
          })
        }), {})
      ),
      paymentMethodsNotes: Yup.string(),
      defaultTransferToHost: Yup.boolean(),
      transferRules: Yup.array(),
      reservationSettings: Yup.object().shape({
        acceptsReservations: Yup.boolean(),
        platform: Yup.string().when('acceptsReservations', {
          is: true,
          then: () => Yup.string().required('required')
        }),
        reservationLink: Yup.string().when('platform', {
          is: (val: string) => val && val.length > 0,
          then: () => Yup.string().url('invalidUrl').required('required')
        }),
        phoneCarrier: Yup.string().required('required'),
        parking: Yup.object().shape({
          hasParking: Yup.boolean().required('required'),
          parkingType: Yup.string().when('hasParking', {
            is: true,
            then: () => Yup.string().oneOf(['free', 'paid']).required('required')
          }),
          pricingDetails: Yup.string().when(['hasParking', 'parkingType'], {
            is: (hasParking: boolean, parkingType: string) => hasParking && parkingType === 'paid',
            then: () => Yup.string().required('required')
          }),
          location: Yup.string().when('hasParking', {
            is: true,
            then: () => Yup.string().required('required')
          })
        }),
        schedule: Yup.object().shape(
          DAYS_OF_WEEK.reduce((acc, day) => ({
            ...acc,
            [day]: Yup.object().shape({
              enabled: Yup.boolean(),
              timeSlots: Yup.array().when('enabled', {
                is: true,
                then: () => Yup.array().of(
                  Yup.object().shape({
                    start: Yup.string().required('required'),
                    end: Yup.string().required('required'),
                    type: Yup.string().required('required'),
                    kitchenClosingTime: Yup.string().nullable()
                  })
                ).min(1, 'atLeastOneTimeSlot')
              })
            })
          }), {})
        )
      }),
      parking: Yup.object().shape({
        hasParking: Yup.boolean().required('required'),
        parkingType: Yup.string().when('hasParking', {
          is: true,
          then: () => Yup.string().oneOf(['free', 'paid']).required('required')
        }),
        pricingDetails: Yup.string().when(['hasParking', 'parkingType'], {
          is: (hasParking: boolean, parkingType: string) => hasParking && parkingType === 'paid',
          then: () => Yup.string().required('required')
        }),
        location: Yup.string().when('hasParking', {
          is: true,
          then: () => Yup.string().required('required')
        })
      })
    })
  )
})

const TIME_ZONES = [
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Phoenix', label: 'Mountain Time - Arizona (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'America/Anchorage', label: 'Alaska Time (AKT)' },
  { value: 'Pacific/Honolulu', label: 'Hawaii-Aleutian Time (HAT)' }
] as const

export default function LocationDetails() {
  const navigate = useNavigate()
  const { state, dispatch } = useForm()
  const { t } = useTranslation()
  const [expandedLocations, setExpandedLocations] = useState<string[]>([])

  const initialValues = {
    locationDetails: (state.locations || []).map(location => ({
      locationId: location.id,
      state: '',
      streetAddress: '',
      timeZone: '',
      managerEmail: '',
      phoneNumbers: [''],
      acceptedPaymentMethods: [],
      creditCardExclusions: '',
      debitCardExclusions: '',
      mobilePaymentExclusions: '',
      phoneCarrier: '',
      otherPhoneCarrier: '',
      carrierCredentials: {
        username: '',
        password: '',
        pin: ''
      },
      schedule: createEmptySchedule(),
      defaultTransferToHost: true,
      transferRules: [],
      reservationSettings: {
        acceptsReservations: false,
        platform: '',
        reservationLink: '',
        phoneCarrier: '',
        parking: {
          hasParking: false,
          parkingType: undefined,
          pricingDetails: '',
          location: ''
        },
        schedule: createEmptySchedule()
      },
      waitTimes: {
        monday: {},
        tuesday: {},
        wednesday: {},
        thursday: {},
        friday: {},
        saturday: {},
        sunday: {}
      },
      pickupSettings: {
        platforms: [],
        preferredPlatform: '',
        preferredPlatformLink: ''
      },
      deliverySettings: {
        platforms: [],
        preferredPlatform: '',
        preferredPlatformLink: ''
      },
      parking: {
        hasParking: false,
        parkingType: undefined,
        pricingDetails: '',
        location: ''
      },
      corkage: {
        allowed: false,
        fee: ''
      },
      specialDiscounts: {
        hasDiscounts: false,
        details: []
      },
      holidayEvents: {
        hasEvents: false,
        events: []
      },
      specialEvents: {
        hasEvents: false,
        events: []
      },
      socialMedia: {
        instagram: {
          usesInstagram: false,
          handle: ''
        }
      },
      birthdayCelebrations: {
        allowed: false,
        details: '',
        restrictions: []
      },
      dressCode: {
        hasDressCode: false,
        details: '',
        exceptions: []
      },
      ageVerification: {
        acceptedDocuments: [],
        otherDocuments: ''
      },
      smokingArea: {
        hasSmokingArea: false,
        details: ''
      },
      brunchMenu: {
        hasBrunchMenu: false,
        schedule: '',
        menuFile: null
      }
    }))
  } as FormValues

  const handleSubmit = (values: FormValues) => {
    dispatch({
      type: 'SET_LOCATION_DETAILS',
      payload: values.locationDetails
    })
    navigate('/onboarding/ai-config')
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">{t('locationDetailsTitle')}</h2>
        <p className="mt-2 text-sm text-gray-600">
          {t('locationDetailsSubtitle')}
        </p>
      </div>

      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {({ values, setFieldValue }) => (
          <Form className="space-y-8">
            {values.locationDetails.map((location, index) => (
              <div
                key={location.locationId || index}
                className="bg-white shadow rounded-lg overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => {
                    if (expandedLocations.includes(location.locationId)) {
                      setExpandedLocations(expandedLocations.filter(id => id !== location.locationId))
                    } else {
                      setExpandedLocations([...expandedLocations, location.locationId])
                    }
                  }}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50"
                >
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      {location.streetAddress || `Location ${index + 1}`}
                    </h3>
                    {location.streetAddress && (
                      <p className="mt-1 text-sm text-gray-500">
                        {location.state}
                      </p>
                    )}
                  </div>
                  {expandedLocations.includes(location.locationId) ? (
                    <ChevronUpIcon className="h-5 w-5 text-gray-400" />
                  ) : (
                    <ChevronDownIcon className="h-5 w-5 text-gray-400" />
                  )}
                </button>
                {expandedLocations.includes(location.locationId) && (
                  <div className="px-6 py-4 border-t border-gray-200 space-y-6">
                    <SectionTitle>Basic Location Information</SectionTitle>
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                      <div>
                        <label htmlFor={`locationDetails.${index}.state`} className="block text-sm font-medium text-gray-700">
                          State
                        </label>
                        <p className="mt-1 text-sm text-gray-500">
                          Select the state where this location operates
                        </p>
                        <Field
                          as="select"
                          name={`locationDetails.${index}.state`}
                          className="mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        >
                          <option value="">Select a state...</option>
                          {US_STATES.map(state => (
                            <option key={state.value} value={state.value}>
                              {state.label}
                            </option>
                          ))}
                        </Field>
                      </div>

                      <div>
                        <label htmlFor={`locationDetails.${index}.streetAddress`} className="block text-sm font-medium text-gray-700">
                          Street Address
                        </label>
                        <p className="mt-1 text-sm text-gray-500">
                          Enter the complete street address for this location
                        </p>
                        <Field
                          type="text"
                          name={`locationDetails.${index}.streetAddress`}
                          placeholder="e.g., 123 Main Street, Suite 100"
                          className="mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        />
                      </div>

                      <div>
                        <label htmlFor={`locationDetails.${index}.timeZone`} className="block text-sm font-medium text-gray-700">
                          Time Zone
                        </label>
                        <p className="mt-1 text-sm text-gray-500">
                          Select the time zone for accurate business hours display
                        </p>
                        <Field
                          as="select"
                          name={`locationDetails.${index}.timeZone`}
                          className="mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        >
                          <option value="">Select time zone...</option>
                          {TIME_ZONES.map(tz => (
                            <option key={tz.value} value={tz.value}>
                              {tz.label}
                            </option>
                          ))}
                        </Field>
                      </div>

                      <div>
                        <label htmlFor={`locationDetails.${index}.managerEmail`} className="block text-sm font-medium text-gray-700">
                          Manager's Email Address
                        </label>
                        <p className="mt-1 text-sm text-gray-500">
                          This email will receive important notifications and customer support requests
                        </p>
                        <Field
                          type="email"
                          name={`locationDetails.${index}.managerEmail`}
                          placeholder="manager@restaurant.com"
                          className="mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <SectionTitle>Contact Phone Numbers</SectionTitle>
                      <p className="mt-1 mb-4 text-sm text-gray-500">
                        Add all phone numbers that customers can use to contact this location
                      </p>
                      <FieldArray name={`locationDetails.${index}.phoneNumbers`}>
                        {({ push, remove }) => (
                          <div className="space-y-2">
                            {values.locationDetails[index].phoneNumbers.map((phone, phoneIndex) => (
                              <div key={phoneIndex} className="flex gap-2">
                                <Field
                                  type="tel"
                                  name={`locationDetails.${index}.phoneNumbers.${phoneIndex}`}
                                  placeholder="Enter phone number with country code"
                                  className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                />
                                <button
                                  type="button"
                                  onClick={() => remove(phoneIndex)}
                                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                                >
                                  Remove
                                </button>
                              </div>
                            ))}
                            <button
                              type="button"
                              onClick={() => push('')}
                              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
                            >
                              Add Another Phone Number
                            </button>
                          </div>
                        )}
                      </FieldArray>
                    </div>

                    <div>
                      <SectionTitle>Payment Methods</SectionTitle>
                      <p className="mt-1 mb-4 text-sm text-gray-500">
                        Select all payment methods accepted at this location and specify any restrictions
                      </p>
                      <div className="mt-2 space-y-4">
                        {PAYMENT_METHODS.map(method => (
                          <div key={method} className="space-y-2">
                            <div className="flex items-center">
                              <Field
                                type="checkbox"
                                name={`locationDetails.${index}.acceptedPaymentMethods`}
                                value={method}
                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                              />
                              <label className="ml-2 text-sm text-gray-700">
                                {method.replace('_', ' ')}
                              </label>
                            </div>
                            {values.locationDetails[index].acceptedPaymentMethods.includes(method) && 
                             (method === 'CREDIT_CARD' || method === 'DEBIT_CARD' || method === 'MOBILE_PAYMENT') && (
                              <div className="ml-6">
                                <Field
                                  type="text"
                                  name={`locationDetails.${index}.${method.toLowerCase().replace('_', '')}Exclusions`}
                                  placeholder={`Specify any ${method.toLowerCase().replace('_', ' ')} exclusions (e.g., 'No American Express')`}
                                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <SectionTitle>Corkage Policy</SectionTitle>
                      <p className="mt-1 mb-4 text-sm text-gray-500">
                        Specify if your establishment allows customers to bring their own wine and any associated fees
                      </p>
                      <div className="space-y-4">
                        <div className="flex items-center space-x-4">
                          <span className="text-sm font-medium text-gray-700">Does your establishment allow corkage?</span>
                          <div className="flex items-center space-x-4">
                            <label className="inline-flex items-center">
                              <input
                                type="radio"
                                name={`locationDetails.${index}.corkage.allowed`}
                                checked={values.locationDetails[index].corkage.allowed === true}
                                onChange={() => setFieldValue(`locationDetails.${index}.corkage.allowed`, true)}
                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                              />
                              <span className="ml-2 text-sm text-gray-700">Yes</span>
                            </label>
                            <label className="inline-flex items-center">
                              <input
                                type="radio"
                                name={`locationDetails.${index}.corkage.allowed`}
                                checked={values.locationDetails[index].corkage.allowed === false}
                                onChange={() => setFieldValue(`locationDetails.${index}.corkage.allowed`, false)}
                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                              />
                              <span className="ml-2 text-sm text-gray-700">No</span>
                            </label>
                          </div>
                        </div>

                        {values.locationDetails[index].corkage.allowed && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                              Corkage Fee
                            </label>
                            <p className="mt-1 text-sm text-gray-500">
                              Specify the fee charged per bottle
                            </p>
                            <Field
                              type="text"
                              name={`locationDetails.${index}.corkage.fee`}
                              placeholder="e.g., $25 per bottle"
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <SectionTitle>Special Discounts and Happy Hours</SectionTitle>
                      <p className="mt-1 mb-4 text-sm text-gray-500">
                        Configure any ongoing specials, discounts, or Happy Hours for specific groups
                      </p>
                      <div className="space-y-4">
                        <div className="flex items-center space-x-4">
                          <span className="text-sm font-medium text-gray-700">Do you offer any special discounts or Happy Hours?</span>
                          <div className="flex items-center space-x-4">
                            <label className="inline-flex items-center">
                              <input
                                type="radio"
                                name={`locationDetails.${index}.specialDiscounts.hasDiscounts`}
                                checked={values.locationDetails[index].specialDiscounts.hasDiscounts === true}
                                onChange={() => setFieldValue(`locationDetails.${index}.specialDiscounts.hasDiscounts`, true)}
                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                              />
                              <span className="ml-2 text-sm text-gray-700">Yes</span>
                            </label>
                            <label className="inline-flex items-center">
                              <input
                                type="radio"
                                name={`locationDetails.${index}.specialDiscounts.hasDiscounts`}
                                checked={values.locationDetails[index].specialDiscounts.hasDiscounts === false}
                                onChange={() => setFieldValue(`locationDetails.${index}.specialDiscounts.hasDiscounts`, false)}
                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                              />
                              <span className="ml-2 text-sm text-gray-700">No</span>
                            </label>
                          </div>
                        </div>

                        {values.locationDetails[index].specialDiscounts.hasDiscounts && (
                          <div>
                            <FieldArray name={`locationDetails.${index}.specialDiscounts.details`}>
                              {({ push, remove }) => (
                                <div className="space-y-2">
                                  {values.locationDetails[index].specialDiscounts.details?.map((detail, detailIndex) => (
                                    <div key={detailIndex} className="flex gap-2">
                                      <Field
                                        type="text"
                                        name={`locationDetails.${index}.specialDiscounts.details.${detailIndex}`}
                                        placeholder="e.g., 10% off for military, Happy Hour 4-6 PM"
                                        className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => remove(detailIndex)}
                                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700"
                                      >
                                        Remove
                                      </button>
                                    </div>
                                  ))}
                                  <button
                                    type="button"
                                    onClick={() => push('')}
                                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
                                  >
                                    Add Discount/Special
                                  </button>
                                </div>
                              )}
                            </FieldArray>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <SectionTitle>Phone Service Provider</SectionTitle>
                      <p className="mt-1 text-sm text-gray-500">
                        Select your phone service provider to configure call forwarding settings
                      </p>
                      <Field
                        as="select"
                        name={`locationDetails.${index}.phoneCarrier`}
                        className="mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      >
                        <option value="">{t('selectPhoneCarrier')}</option>
                        {PHONE_CARRIERS.map(carrier => (
                          <option key={carrier} value={carrier}>
                            {carrier.replace('_', ' ')}
                          </option>
                        ))}
                        <option value="other">{t('other')}</option>
                      </Field>
                    </div>

                    {values.locationDetails[index].phoneCarrier === 'other' && (
                      <div>
                        <label htmlFor={`locationDetails.${index}.otherPhoneCarrier`} className="block text-sm font-medium text-gray-700">
                          {t('otherPhoneCarrier')}
                        </label>
                        <p className="mt-1 text-sm text-gray-500">
                          Please specify your phone service provider's name
                        </p>
                        <Field
                          type="text"
                          name={`locationDetails.${index}.otherPhoneCarrier`}
                          className="mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        />
                      </div>
                    )}

                    {values.locationDetails[index].phoneCarrier && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          {t('carrierCredentials')}
                        </label>
                        <p className="mt-1 text-sm text-gray-500">
                          Enter your phone service provider credentials to enable automatic call forwarding configuration
                        </p>
                        <div className="mt-2 space-y-4">
                          <div>
                            <label htmlFor={`locationDetails.${index}.carrierCredentials.username`} className="block text-sm font-medium text-gray-700">
                              Account Username or Email
                            </label>
                            <Field
                              type="text"
                              name={`locationDetails.${index}.carrierCredentials.username`}
                              placeholder="Enter your carrier account username"
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            />
                          </div>
                          <div>
                            <label htmlFor={`locationDetails.${index}.carrierCredentials.password`} className="block text-sm font-medium text-gray-700">
                              Account Password
                            </label>
                            <Field
                              type="password"
                              name={`locationDetails.${index}.carrierCredentials.password`}
                              placeholder="Enter your carrier account password"
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            />
                          </div>
                          <div>
                            <label htmlFor={`locationDetails.${index}.carrierCredentials.pin`} className="block text-sm font-medium text-gray-700">
                              Account PIN or Security Code
                            </label>
                            <p className="mt-1 text-sm text-gray-500">
                              This is typically a 4-digit code used for account security
                            </p>
                            <Field
                              type="text"
                              name={`locationDetails.${index}.carrierCredentials.pin`}
                              placeholder="Enter your account PIN"
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    <div>
                      <SectionTitle>Opening and Closing Hours</SectionTitle>
                      <p className="mt-1 mb-4 text-sm text-gray-500">
                        Configure your business hours for each day of the week. You can set different time slots for regular hours, breaks, or special hours. Days without configured hours will be marked as closed.
                      </p>
                      <WeeklySchedule
                        index={index}
                      />
                    </div>

                    <div>
                      <SectionTitle>Call Transfer Configuration</SectionTitle>
                      <p className="mt-1 mb-4 text-sm text-gray-500">
                        Configure how incoming calls should be handled for this location
                      </p>
                      <div className="space-y-4">
                        <div className="flex items-center space-x-4">
                          <span className="text-sm font-medium text-gray-700">Transfer all calls to host (main line)?</span>
                          <div className="flex items-center space-x-4">
                            <label className="inline-flex items-center">
                              <input
                                type="radio"
                                name={`locationDetails.${index}.defaultTransferToHost`}
                                checked={values.locationDetails[index].defaultTransferToHost === true}
                                onChange={() => setFieldValue(`locationDetails.${index}.defaultTransferToHost`, true)}
                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                              />
                              <span className="ml-2 text-sm text-gray-700">Yes</span>
                            </label>
                            <label className="inline-flex items-center">
                              <input
                                type="radio"
                                name={`locationDetails.${index}.defaultTransferToHost`}
                                checked={values.locationDetails[index].defaultTransferToHost === false}
                                onChange={() => setFieldValue(`locationDetails.${index}.defaultTransferToHost`, false)}
                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                              />
                              <span className="ml-2 text-sm text-gray-700">No</span>
                            </label>
                          </div>
                        </div>

                        {values.locationDetails[index].defaultTransferToHost === false && (
                          <div className="mt-4 space-y-4 border border-gray-200 rounded-lg p-4">
                            <SectionTitle>Advanced Call Transfer Rules</SectionTitle>
                            <p className="mt-1 mb-4 text-sm text-gray-500">
                              Configure specific phone numbers for different types of inquiries
                            </p>
                            <FieldArray name={`locationDetails.${index}.transferRules`}>
                              {({ push, remove }) => (
                                <div className="space-y-4">
                                  {values.locationDetails[index].transferRules.map((rule, ruleIndex) => (
                                    <div key={ruleIndex} className="grid grid-cols-1 gap-4 p-4 border border-gray-200 rounded-md">
                                      <div>
                                        <label className="block text-sm font-medium text-gray-700">Type of Inquiry</label>
                                        <Field
                                          as="select"
                                          name={`locationDetails.${index}.transferRules.${ruleIndex}.type`}
                                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                        >
                                          <option value="">Select type...</option>
                                          {CALL_TYPES.map(type => (
                                            <option key={type.value} value={type.value}>{type.label}</option>
                                          ))}
                                        </Field>
                                      </div>
                                      <div>
                                        <label className="block text-sm font-medium text-gray-700">Transfer Number</label>
                                        <Field
                                          type="tel"
                                          name={`locationDetails.${index}.transferRules.${ruleIndex}.number`}
                                          placeholder="Enter phone number for this type of inquiry"
                                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                        />
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => remove(ruleIndex)}
                                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700"
                                      >
                                        Remove Rule
                                      </button>
                                    </div>
                                  ))}
                                  <button
                                    type="button"
                                    onClick={() => push({ type: '', number: '' })}
                                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
                                  >
                                    Add Transfer Rule
                                  </button>
                                </div>
                              )}
                            </FieldArray>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <SectionTitle>Reservation Settings</SectionTitle>
                      <p className="mt-1 mb-4 text-sm text-gray-500">
                        Configure how reservations are handled for this location
                      </p>
                      <div className="space-y-4">
                        <div className="flex items-center space-x-4">
                          <span className="text-sm font-medium text-gray-700">Does this location accept reservations?</span>
                          <div className="flex items-center space-x-4">
                            <label className="inline-flex items-center">
                              <input
                                type="radio"
                                name={`locationDetails.${index}.reservationSettings.acceptsReservations`}
                                checked={values.locationDetails[index].reservationSettings.acceptsReservations === true}
                                onChange={() => setFieldValue(`locationDetails.${index}.reservationSettings.acceptsReservations`, true)}
                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                              />
                              <span className="ml-2 text-sm text-gray-700">Yes</span>
                            </label>
                            <label className="inline-flex items-center">
                              <input
                                type="radio"
                                name={`locationDetails.${index}.reservationSettings.acceptsReservations`}
                                checked={values.locationDetails[index].reservationSettings.acceptsReservations === false}
                                onChange={() => setFieldValue(`locationDetails.${index}.reservationSettings.acceptsReservations`, false)}
                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                              />
                              <span className="ml-2 text-sm text-gray-700">No</span>
                            </label>
                          </div>
                        </div>

                        {values.locationDetails[index].reservationSettings.acceptsReservations === true && (
                          <div className="mt-4 space-y-4 border border-gray-200 rounded-lg p-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700">
                                Reservation Platform
                              </label>
                              <Field
                                as="select"
                                name={`locationDetails.${index}.reservationSettings.platform`}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                              >
                                <option value="">Select reservation platform...</option>
                                {RESERVATION_PLATFORMS.map(platform => (
                                  <option key={platform} value={platform}>
                                    {platform}
                                  </option>
                                ))}
                              </Field>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700">
                                Maximum Advance Reservation Time
                              </label>
                              <p className="mt-1 text-sm text-gray-500">
                                How far in advance customers can make reservations
                              </p>
                              <div className="mt-1 flex gap-2">
                                <Field
                                  type="number"
                                  name={`locationDetails.${index}.reservationSettings.maxAdvanceTime`}
                                  min="1"
                                  className="block w-32 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                />
                                <Field
                                  as="select"
                                  name={`locationDetails.${index}.reservationSettings.maxAdvanceTimeUnit`}
                                  className="block w-32 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                >
                                  <option value="days">Days</option>
                                  <option value="weeks">Weeks</option>
                                </Field>
                              </div>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700">
                                Maximum Party Size
                              </label>
                              <p className="mt-1 text-sm text-gray-500">
                                Maximum number of guests allowed per booking before requiring human transfer
                              </p>
                              <Field
                                type="number"
                                name={`locationDetails.${index}.reservationSettings.maxPartySize`}
                                min="1"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700">
                                Reservation Grace Period
                              </label>
                              <p className="mt-1 text-sm text-gray-500">
                                How long to hold a reservation before marking it as a no-show (in minutes)
                              </p>
                              <Field
                                type="number"
                                name={`locationDetails.${index}.reservationSettings.gracePeriod`}
                                min="0"
                                placeholder="Enter minutes"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700">
                                Party Size Requirements
                              </label>
                              <p className="mt-1 text-sm text-gray-500">
                                Does at least half of the party need to be present to be seated?
                              </p>
                              <div className="mt-2 flex items-center space-x-4">
                                <label className="inline-flex items-center">
                                  <input
                                    type="radio"
                                    name={`locationDetails.${index}.reservationSettings.requireHalfParty`}
                                    checked={values.locationDetails[index].reservationSettings.requireHalfParty === true}
                                    onChange={() => setFieldValue(`locationDetails.${index}.reservationSettings.requireHalfParty`, true)}
                                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                                  />
                                  <span className="ml-2 text-sm text-gray-700">Yes</span>
                                </label>
                                <label className="inline-flex items-center">
                                  <input
                                    type="radio"
                                    name={`locationDetails.${index}.reservationSettings.requireHalfParty`}
                                    checked={values.locationDetails[index].reservationSettings.requireHalfParty === false}
                                    onChange={() => setFieldValue(`locationDetails.${index}.reservationSettings.requireHalfParty`, false)}
                                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                                  />
                                  <span className="ml-2 text-sm text-gray-700">No</span>
                                </label>
                              </div>
                            </div>

                            {values.locationDetails[index].reservationSettings.platform && (
                              <div>
                                <label className="block text-sm font-medium text-gray-700">
                                  Reservation Link
                                </label>
                                <p className="mt-1 text-sm text-gray-500">
                                  Direct link where customers can make reservations
                                </p>
                                <Field
                                  type="url"
                                  name={`locationDetails.${index}.reservationSettings.reservationLink`}
                                  placeholder="https://..."
                                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                />
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <SectionTitle>Pickup/Takeout Settings</SectionTitle>
                      <p className="mt-1 mb-4 text-sm text-gray-500">
                        Configure which platforms you use for pickup/takeout orders and set your preferred platform for AI promotion
                      </p>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Pickup/Takeout Platforms
                          </label>
                          <p className="mt-1 text-sm text-gray-500">
                            Select all platforms where customers can place pickup/takeout orders
                          </p>
                          <div className="mt-2 space-y-2">
                            {PICKUP_DELIVERY_PLATFORMS.map(platform => (
                              <div key={platform} className="flex items-center">
                                <Field
                                  type="checkbox"
                                  name={`locationDetails.${index}.pickupSettings.platforms`}
                                  value={platform}
                                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                />
                                <label className="ml-2 text-sm text-gray-700">
                                  {platform.replace(/_/g, ' ')}
                                </label>
                              </div>
                            ))}
                          </div>
                        </div>

                        {values.locationDetails[index].pickupSettings.platforms.length > 0 && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                              Preferred Platform for AI Promotion
                            </label>
                            <p className="mt-1 text-sm text-gray-500">
                              Select which platform you want the AI to promote when customers call
                            </p>
                            <Field
                              as="select"
                              name={`locationDetails.${index}.pickupSettings.preferredPlatform`}
                              className="mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            >
                              <option value="">Select preferred platform...</option>
                              {values.locationDetails[index].pickupSettings.platforms.map(platform => (
                                <option key={platform} value={platform}>
                                  {platform.replace(/_/g, ' ')}
                                </option>
                              ))}
                            </Field>
                          </div>
                        )}

                        {values.locationDetails[index].pickupSettings.preferredPlatform && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                              Platform Link
                            </label>
                            <p className="mt-1 text-sm text-gray-500">
                              Enter the direct link to your location on the preferred platform
                            </p>
                            <Field
                              type="url"
                              name={`locationDetails.${index}.pickupSettings.preferredPlatformLink`}
                              placeholder="https://..."
                              className="mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <SectionTitle>Delivery Settings</SectionTitle>
                      <p className="mt-1 mb-4 text-sm text-gray-500">
                        Configure which platforms you use for delivery orders and set your preferred platform for AI promotion
                      </p>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Delivery Platforms
                          </label>
                          <p className="mt-1 text-sm text-gray-500">
                            Select all platforms where customers can place delivery orders
                          </p>
                          <div className="mt-2 space-y-2">
                            {PICKUP_DELIVERY_PLATFORMS.map(platform => (
                              <div key={platform} className="flex items-center">
                                <Field
                                  type="checkbox"
                                  name={`locationDetails.${index}.deliverySettings.platforms`}
                                  value={platform}
                                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                />
                                <label className="ml-2 text-sm text-gray-700">
                                  {platform.replace(/_/g, ' ')}
                                </label>
                              </div>
                            ))}
                          </div>
                        </div>

                        {values.locationDetails[index].deliverySettings.platforms.length > 0 && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                              Preferred Platform for AI Promotion
                            </label>
                            <p className="mt-1 text-sm text-gray-500">
                              Select which platform you want the AI to promote when customers call
                            </p>
                            <Field
                              as="select"
                              name={`locationDetails.${index}.deliverySettings.preferredPlatform`}
                              className="mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            >
                              <option value="">Select preferred platform...</option>
                              {values.locationDetails[index].deliverySettings.platforms.map(platform => (
                                <option key={platform} value={platform}>
                                  {platform.replace(/_/g, ' ')}
                                </option>
                              ))}
                            </Field>
                          </div>
                        )}

                        {values.locationDetails[index].deliverySettings.preferredPlatform && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                              Platform Link
                            </label>
                            <p className="mt-1 text-sm text-gray-500">
                              Enter the direct link to your location on the preferred platform
                            </p>
                            <Field
                              type="url"
                              name={`locationDetails.${index}.deliverySettings.preferredPlatformLink`}
                              placeholder="https://..."
                              className="mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <SectionTitle>Parking Information</SectionTitle>
                      <p className="mt-1 mb-4 text-sm text-gray-500">
                        Configure parking availability and details for this location
                      </p>
                      <div className="space-y-4">
                        <div className="flex items-center space-x-4">
                          <span className="text-sm font-medium text-gray-700">Does this location have parking available?</span>
                          <div className="flex items-center space-x-4">
                            <label className="inline-flex items-center">
                              <input
                                type="radio"
                                name={`locationDetails.${index}.parking.hasParking`}
                                checked={values.locationDetails[index].parking.hasParking === true}
                                onChange={() => setFieldValue(`locationDetails.${index}.parking.hasParking`, true)}
                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                              />
                              <span className="ml-2 text-sm text-gray-700">Yes</span>
                            </label>
                            <label className="inline-flex items-center">
                              <input
                                type="radio"
                                name={`locationDetails.${index}.parking.hasParking`}
                                checked={values.locationDetails[index].parking.hasParking === false}
                                onChange={() => setFieldValue(`locationDetails.${index}.parking.hasParking`, false)}
                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                              />
                              <span className="ml-2 text-sm text-gray-700">No</span>
                            </label>
                          </div>
                        </div>

                        {values.locationDetails[index].parking.hasParking && (
                          <div className="space-y-4 border border-gray-200 rounded-lg p-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700">
                                Parking Type
                              </label>
                              <div className="mt-2 flex items-center space-x-4">
                                <label className="inline-flex items-center">
                                  <input
                                    type="radio"
                                    name={`locationDetails.${index}.parking.parkingType`}
                                    checked={values.locationDetails[index].parking.parkingType === 'free'}
                                    onChange={() => setFieldValue(`locationDetails.${index}.parking.parkingType`, 'free')}
                                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                                  />
                                  <span className="ml-2 text-sm text-gray-700">Free</span>
                                </label>
                                <label className="inline-flex items-center">
                                  <input
                                    type="radio"
                                    name={`locationDetails.${index}.parking.parkingType`}
                                    checked={values.locationDetails[index].parking.parkingType === 'paid'}
                                    onChange={() => setFieldValue(`locationDetails.${index}.parking.parkingType`, 'paid')}
                                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                                  />
                                  <span className="ml-2 text-sm text-gray-700">Paid</span>
                                </label>
                              </div>
                            </div>

                            {values.locationDetails[index].parking.parkingType === 'paid' && (
                              <div>
                                <label className="block text-sm font-medium text-gray-700">
                                  Pricing Details
                                </label>
                                <p className="mt-1 text-sm text-gray-500">
                                  Specify the parking rates and payment methods
                                </p>
                                <Field
                                  as="textarea"
                                  name={`locationDetails.${index}.parking.pricingDetails`}
                                  rows={3}
                                  placeholder="e.g., $2/hour, $10 flat rate after 6 PM, validation available with purchase"
                                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                />
                              </div>
                            )}

                            <div>
                              <label className="block text-sm font-medium text-gray-700">
                                Parking Location
                              </label>
                              <p className="mt-1 text-sm text-gray-500">
                                Provide details about where customers can find parking
                              </p>
                              <Field
                                as="textarea"
                                name={`locationDetails.${index}.parking.location`}
                                rows={3}
                                placeholder="e.g., Underground garage entrance on Main St, Street parking available on Oak Ave"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <SectionTitle>Average Wait Times for Walk-ins</SectionTitle>
                      <p className="mt-1 mb-4 text-sm text-gray-500">
                        Configure the typical wait times for walk-in customers during different time periods
                      </p>
                      
                      <div className="space-y-2 border border-gray-200 rounded-lg divide-y">
                        {DAYS_OF_WEEK.map((day) => (
                          <div key={day} className="overflow-hidden">
                            <button
                              type="button"
                              onClick={() => {
                                if (expandedLocations.includes(`${location.locationId}-${day}-wait-times`)) {
                                  setExpandedLocations(expandedLocations.filter(id => id !== `${location.locationId}-${day}-wait-times`))
                                } else {
                                  setExpandedLocations([...expandedLocations, `${location.locationId}-${day}-wait-times`])
                                }
                              }}
                              className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 focus:outline-none"
                            >
                              <h4 className="text-sm font-medium text-gray-900 capitalize">
                                {day}
                              </h4>
                              {expandedLocations.includes(`${location.locationId}-${day}-wait-times`) ? (
                                <ChevronUpIcon className="h-5 w-5 text-gray-400" />
                              ) : (
                                <ChevronDownIcon className="h-5 w-5 text-gray-400" />
                              )}
                            </button>

                            {expandedLocations.includes(`${location.locationId}-${day}-wait-times`) && (
                              <div className="border-t border-gray-200">
                                <table className="min-w-full divide-y divide-gray-200">
                                  <thead className="bg-gray-50">
                                    <tr>
                                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Time Period
                                      </th>
                                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Average Wait Time
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody className="bg-white divide-y divide-gray-200">
                                    {TIME_SLOTS.map((slot) => (
                                      <tr key={slot.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                          {slot.label}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                          <div className="flex gap-2">
                                            {WAIT_TIME_RANGES.map((range) => (
                                              <button
                                                key={range.value}
                                                type="button"
                                                onClick={() => setFieldValue(
                                                  `locationDetails.${index}.waitTimes.${day}.${slot.id}`,
                                                  range.value
                                                )}
                                                className={`px-3 py-2 rounded-md text-sm font-medium ${range.color} ${
                                                  values.locationDetails[index].waitTimes?.[day]?.[slot.id] === range.value
                                                    ? 'ring-2 ring-indigo-500'
                                                    : ''
                                                }`}
                                              >
                                                {range.label}
                                              </button>
                                            ))}
                                          </div>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <SectionTitle>Age Verification Documents</SectionTitle>
                      <p className="mt-1 mb-4 text-sm text-gray-500">
                        Select which documents are accepted to verify the legal drinking age
                      </p>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Accepted Documents
                          </label>
                          <div className="mt-2 space-y-2">
                            {AGE_VERIFICATION_DOCUMENTS.map(doc => (
                              <div key={doc} className="flex items-center">
                                <Field
                                  type="checkbox"
                                  name={`locationDetails.${index}.ageVerification.acceptedDocuments`}
                                  value={doc}
                                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                />
                                <label className="ml-2 text-sm text-gray-700">
                                  {doc.replace(/_/g, ' ')}
                                </label>
                              </div>
                            ))}
                          </div>
                        </div>

                        {values.locationDetails[index].ageVerification.acceptedDocuments.includes('OTHER') && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                              Other Accepted Documents
                            </label>
                            <Field
                              type="text"
                              name={`locationDetails.${index}.ageVerification.otherDocuments`}
                              placeholder="Please specify other accepted documents"
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <SectionTitle>Smoking Area</SectionTitle>
                      <p className="mt-1 mb-4 text-sm text-gray-500">
                        Specify if your establishment has a designated smoking area
                      </p>
                      <div className="space-y-4">
                        <div className="flex items-center space-x-4">
                          <span className="text-sm font-medium text-gray-700">Do you offer a smoking area?</span>
                          <div className="flex items-center space-x-4">
                            <label className="inline-flex items-center">
                              <input
                                type="radio"
                                name={`locationDetails.${index}.smokingArea.hasSmokingArea`}
                                checked={values.locationDetails[index].smokingArea.hasSmokingArea === true}
                                onChange={() => setFieldValue(`locationDetails.${index}.smokingArea.hasSmokingArea`, true)}
                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                              />
                              <span className="ml-2 text-sm text-gray-700">Yes</span>
                            </label>
                            <label className="inline-flex items-center">
                              <input
                                type="radio"
                                name={`locationDetails.${index}.smokingArea.hasSmokingArea`}
                                checked={values.locationDetails[index].smokingArea.hasSmokingArea === false}
                                onChange={() => setFieldValue(`locationDetails.${index}.smokingArea.hasSmokingArea`, false)}
                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                              />
                              <span className="ml-2 text-sm text-gray-700">No</span>
                            </label>
                          </div>
                        </div>

                        {values.locationDetails[index].smokingArea.hasSmokingArea && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                              Smoking Area Details
                            </label>
                            <p className="mt-1 text-sm text-gray-500">
                              Provide details about the smoking area location and any specific rules
                            </p>
                            <Field
                              as="textarea"
                              name={`locationDetails.${index}.smokingArea.details`}
                              rows={3}
                              placeholder="e.g., Outdoor patio on the east side, covered area with heaters"
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <SectionTitle>Brunch Menu</SectionTitle>
                      <p className="mt-1 mb-4 text-sm text-gray-500">
                        Specify if you offer a brunch menu and provide the schedule
                      </p>
                      <div className="space-y-4">
                        <div className="flex items-center space-x-4">
                          <span className="text-sm font-medium text-gray-700">Do you offer a brunch menu?</span>
                          <div className="flex items-center space-x-4">
                            <label className="inline-flex items-center">
                              <input
                                type="radio"
                                name={`locationDetails.${index}.brunchMenu.hasBrunchMenu`}
                                checked={values.locationDetails[index].brunchMenu.hasBrunchMenu === true}
                                onChange={() => setFieldValue(`locationDetails.${index}.brunchMenu.hasBrunchMenu`, true)}
                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                              />
                              <span className="ml-2 text-sm text-gray-700">Yes</span>
                            </label>
                            <label className="inline-flex items-center">
                              <input
                                type="radio"
                                name={`locationDetails.${index}.brunchMenu.hasBrunchMenu`}
                                checked={values.locationDetails[index].brunchMenu.hasBrunchMenu === false}
                                onChange={() => setFieldValue(`locationDetails.${index}.brunchMenu.hasBrunchMenu`, false)}
                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                              />
                              <span className="ml-2 text-sm text-gray-700">No</span>
                            </label>
                          </div>
                        </div>

                        {values.locationDetails[index].brunchMenu.hasBrunchMenu && (
                          <>
                            <div>
                              <label className="block text-sm font-medium text-gray-700">
                                Brunch Schedule
                              </label>
                              <p className="mt-1 text-sm text-gray-500">
                                Specify which days you offer brunch and during what hours
                              </p>
                              <Field
                                as="textarea"
                                name={`locationDetails.${index}.brunchMenu.schedule`}
                                rows={3}
                                placeholder="e.g., Saturday and Sunday, 10 AM - 2 PM"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700">
                                Brunch Menu File
                              </label>
                              <p className="mt-1 text-sm text-gray-500">
                                If you have a digital or PDF version of your brunch menu, you can attach it here
                              </p>
                              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                                <div className="space-y-1 text-center">
                                  <svg
                                    className="mx-auto h-12 w-12 text-gray-400"
                                    stroke="currentColor"
                                    fill="none"
                                    viewBox="0 0 48 48"
                                    aria-hidden="true"
                                  >
                                    <path
                                      d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                                      strokeWidth={2}
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    />
                                  </svg>
                                  <div className="flex text-sm text-gray-600">
                                    <label
                                      htmlFor={`brunch-menu-file-${index}`}
                                      className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
                                    >
                                      <span>Upload a file</span>
                                      <input
                                        id={`brunch-menu-file-${index}`}
                                        type="file"
                                        className="sr-only"
                                        accept=".pdf,.doc,.docx"
                                        onChange={(event) => {
                                          const file = event.currentTarget.files?.[0]
                                          setFieldValue(`locationDetails.${index}.brunchMenu.menuFile`, file || null)
                                        }}
                                      />
                                    </label>
                                    <p className="pl-1">or drag and drop</p>
                                  </div>
                                  <p className="text-xs text-gray-500">PDF, DOC, DOCX up to 10MB</p>
                                </div>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}

            <div className="flex justify-between">
              <button
                type="button"
                onClick={() => navigate('/onboarding/contact-info')}
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
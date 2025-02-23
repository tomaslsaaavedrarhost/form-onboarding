import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Formik, Form, Field, FieldArray } from 'formik'
import * as Yup from 'yup'
import { useForm, type LocationDetail } from '../context/FormContext'
import { useTranslation } from '../hooks/useTranslation'
import { TimeSlots } from '../components/TimeSlots'
import WeeklySchedule from '../components/WeeklySchedule'
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline'
import type { Location } from '../context/FormContext'
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
  gracePeriod: number
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
  showPassword?: boolean
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
    gracePeriod: 15,
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
        gracePeriod: Yup.number().when('acceptsReservations', {
          is: true,
          then: () => Yup.number().min(0, 'Must be at least 0').required('required')
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

interface WaitTimes {
  [key: string]: {
    [timeSlot: string]: string;
  };
}

// Componente de notificación personalizado
const Notification = ({ message, onClose }: { message: string; onClose: () => void }) => {
  React.useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-4 right-4 z-50 animate-fade-in">
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 flex items-center space-x-3">
        <div className="flex-shrink-0">
          <div className="w-8 h-8 rounded-full bg-gradient-brand flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
        <p className="text-gray-800">{message}</p>
        <button
          onClick={onClose}
          className="flex-shrink-0 text-gray-400 hover:text-gray-600"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default function LocationDetails() {
  const { state, dispatch } = useForm();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [expandedLocations, setExpandedLocations] = useState<string[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showSavePrompt, setShowSavePrompt] = useState(false);
  const [showNotification, setShowNotification] = useState(false);

  // Función para manejar cambios en cualquier campo
  const handleFieldChange = (setFieldValue: any, field: string, value: any) => {
    setHasUnsavedChanges(true);
    setFieldValue(field, value);
  };

  const handleSave = async (values: any) => {
    try {
      // Asegurarse de que los valores sean válidos antes de guardar
      const locationDetails = values.locationDetails.map((location: LocationDetail) => ({
        ...location,
        // Asegurarse de que los arrays estén inicializados
        phoneNumbers: location.phoneNumbers || [],
        acceptedPaymentMethods: location.acceptedPaymentMethods || [],
        transferRules: location.transferRules || [],
        // Asegurarse de que los objetos anidados estén inicializados
        reservationSettings: {
          ...location.reservationSettings,
          parking: location.reservationSettings?.parking || { hasParking: false }
        },
        pickupSettings: location.pickupSettings || { platforms: [], preferredPlatform: '', preferredPlatformLink: '' },
        deliverySettings: location.deliverySettings || { platforms: [], preferredPlatform: '', preferredPlatformLink: '' },
        parking: location.parking || { hasParking: false },
        corkage: location.corkage || { allowed: false },
        specialDiscounts: location.specialDiscounts || { hasDiscounts: false, details: [] }
      }));

      // Actualizar el estado global con los nuevos valores
      dispatch({ type: 'SET_LOCATION_DETAILS', payload: locationDetails });
      setHasUnsavedChanges(false);
      setShowNotification(true);
    } catch (error) {
      console.error('Error al guardar:', error);
      alert('Hubo un error al guardar los cambios. Por favor intenta nuevamente.');
    }
  };

  const handleNext = (values: FormValues) => {
    if (hasUnsavedChanges) {
      setShowSavePrompt(true);
    } else {
      dispatch({ type: 'SET_LOCATION_DETAILS', payload: values.locationDetails });
      navigate('/onboarding/ai-config', { replace: true });
    }
  };

  // Componente para el modal de confirmación
  const SavePrompt = ({ values }: { values: any }) => {
    if (!showSavePrompt) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Cambios sin guardar
          </h3>
          <p className="text-gray-600 mb-6">
            Tienes cambios sin guardar. ¿Qué deseas hacer?
          </p>
          <div className="flex justify-end space-x-4">
            <button
              onClick={() => {
                setShowSavePrompt(false);
                dispatch({ type: 'SET_LOCATION_DETAILS', payload: values.locationDetails });
                navigate('/onboarding/ai-config', { replace: true });
              }}
              className="btn-secondary"
            >
              Continuar sin guardar
            </button>
            <button
              onClick={async () => {
                await handleSave(values);
                setShowSavePrompt(false);
                navigate('/onboarding/ai-config', { replace: true });
              }}
              className="btn-primary"
            >
              Guardar y continuar
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {showNotification && (
        <Notification
          message="Los cambios han sido guardados correctamente"
          onClose={() => setShowNotification(false)}
        />
      )}
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">{t('locationDetailsTitle')}</h2>
        <p className="mt-2 text-sm text-gray-600">
          {t('locationDetailsSubtitle')}
        </p>
      </div>

      <Formik
        initialValues={{
          locationDetails: state.locationDetails?.length > 0 
            ? state.locationDetails 
            : (state.locations || []).map((location): LocationDetail => ({
                locationId: location.id,
                selectedLocationName: location.name,
                state: '',
                streetAddress: '',
                timeZone: '',
                managerEmail: '',
                phoneNumbers: [],
                acceptedPaymentMethods: [],
                phoneCarrier: '',
                schedule: createEmptySchedule(),
                defaultTransferToHost: false,
                transferRules: [],
                reservationSettings: {
                  acceptsReservations: false,
                  platform: '',
                  reservationLink: '',
                  phoneCarrier: '',
                  gracePeriod: 15,
                  parking: {
                    hasParking: false
                  },
                  schedule: createEmptySchedule()
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
                  hasParking: false
                },
                corkage: {
                  allowed: false
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
                    usesInstagram: false
                  }
                },
                birthdayCelebrations: {
                  allowed: false
                },
                dressCode: {
                  hasDressCode: false
                },
                ageVerification: {
                  acceptedDocuments: []
                },
                smokingArea: {
                  hasSmokingArea: false
                },
                brunchMenu: {
                  hasBrunchMenu: false
                }
              }))
        }}
        enableReinitialize={false}
        validationSchema={validationSchema}
        onSubmit={(values) => handleNext(values)}
      >
        {({ values, setFieldValue }) => (
          <Form className="space-y-8">
            <SavePrompt values={values} />
            
            {values.locationDetails.map((location: LocationDetail, index: number) => (
              <div key={location.locationId || index} className="bg-white shadow rounded-lg overflow-hidden">
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
                      {location.selectedLocationName || `Location ${index + 1}`}
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
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Selecciona el nombre de la ubicación
                      </label>
                      <p className="mt-1 text-sm text-gray-500">
                        Elige a qué ubicación corresponden estos detalles
                      </p>
                      <Field
                        as="select"
                        name={`locationDetails.${index}.selectedLocationName`}
                        className="mt-2 block w-full rounded-md border-gray-300 py-3 px-4 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                          const selectedName = e.target.value;
                          const isNameTaken = values.locationDetails.some(
                            (loc, i) => i !== index && loc.selectedLocationName === selectedName
                          );
                          if (!isNameTaken) {
                            handleFieldChange(setFieldValue, `locationDetails.${index}.selectedLocationName`, selectedName);
                          } else {
                            alert('Este nombre de ubicación ya ha sido seleccionado para otra ubicación');
                            e.target.value = values.locationDetails[index].selectedLocationName || '';
                          }
                        }}
                      >
                        <option value="">Selecciona una ubicación...</option>
                        {state.locations
                          .filter(loc => loc.nameConfirmed && loc.name)
                          .filter(loc => 
                            !values.locationDetails.some(
                              (detail, i) => 
                                i !== index && 
                                detail.selectedLocationName === loc.name
                            )
                          )
                          .map(loc => (
                            <option key={loc.name} value={loc.name}>
                              {loc.name}
                            </option>
                          ))
                        }
                      </Field>
                    </div>

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
                          className="mt-2 block w-full rounded-md border-gray-300 py-3 px-4 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleFieldChange(setFieldValue, `locationDetails.${index}.state`, e.target.value)}
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
                          className="mt-2 block w-full rounded-md border-gray-300 py-3 px-4 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFieldChange(setFieldValue, `locationDetails.${index}.streetAddress`, e.target.value)}
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
                          className="mt-2 block w-full rounded-md border-gray-300 py-3 px-4 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleFieldChange(setFieldValue, `locationDetails.${index}.timeZone`, e.target.value)}
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
                          className="mt-2 block w-full rounded-md border-gray-300 py-3 px-4 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFieldChange(setFieldValue, `locationDetails.${index}.managerEmail`, e.target.value)}
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
                                  className="flex-1 rounded-md border-gray-300 py-3 px-4 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFieldChange(setFieldValue, `locationDetails.${index}.phoneNumbers.${phoneIndex}`, e.target.value)}
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
                                checked={values.locationDetails[index].acceptedPaymentMethods.includes(method)}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                  const currentMethods = [...values.locationDetails[index].acceptedPaymentMethods];
                                  if (e.target.checked) {
                                    currentMethods.push(method);
                                  } else {
                                    const idx = currentMethods.indexOf(method);
                                    if (idx > -1) {
                                      currentMethods.splice(idx, 1);
                                    }
                                  }
                                  handleFieldChange(setFieldValue, `locationDetails.${index}.acceptedPaymentMethods`, currentMethods);
                                }}
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
                                  className="block w-full rounded-md border-gray-300 py-3 px-4 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFieldChange(setFieldValue, `locationDetails.${index}.${method.toLowerCase().replace('_', '')}Exclusions`, e.target.value)}
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
                          <label className="inline-flex items-center">
                            <input
                              type="radio"
                              name={`locationDetails.${index}.corkage.allowed`}
                              checked={values.locationDetails[index].corkage.allowed === true}
                              onChange={() => handleFieldChange(setFieldValue, `locationDetails.${index}.corkage.allowed`, true)}
                              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                            />
                            <span className="ml-2 text-sm text-gray-700">Yes</span>
                          </label>
                          <label className="inline-flex items-center">
                            <input
                              type="radio"
                              name={`locationDetails.${index}.corkage.allowed`}
                              checked={values.locationDetails[index].corkage.allowed === false}
                              onChange={() => handleFieldChange(setFieldValue, `locationDetails.${index}.corkage.allowed`, false)}
                              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                            />
                            <span className="ml-2 text-sm text-gray-700">No</span>
                          </label>
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
                              className="mt-1 block w-full rounded-md border-gray-300 py-3 px-4 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFieldChange(setFieldValue, `locationDetails.${index}.corkage.fee`, e.target.value)}
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
                          <label className="inline-flex items-center">
                            <input
                              type="radio"
                              name={`locationDetails.${index}.specialDiscounts.hasDiscounts`}
                              checked={values.locationDetails[index].specialDiscounts.hasDiscounts === true}
                              onChange={() => handleFieldChange(setFieldValue, `locationDetails.${index}.specialDiscounts.hasDiscounts`, true)}
                              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                            />
                            <span className="ml-2 text-sm text-gray-700">Yes</span>
                          </label>
                          <label className="inline-flex items-center">
                            <input
                              type="radio"
                              name={`locationDetails.${index}.specialDiscounts.hasDiscounts`}
                              checked={values.locationDetails[index].specialDiscounts.hasDiscounts === false}
                              onChange={() => handleFieldChange(setFieldValue, `locationDetails.${index}.specialDiscounts.hasDiscounts`, false)}
                              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                            />
                            <span className="ml-2 text-sm text-gray-700">No</span>
                          </label>
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
                                        className="flex-1 rounded-md border-gray-300 py-3 px-4 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFieldChange(setFieldValue, `locationDetails.${index}.specialDiscounts.details.${detailIndex}`, e.target.value)}
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
                        className="mt-2 block w-full rounded-md border-gray-300 py-3 px-4 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleFieldChange(setFieldValue, `locationDetails.${index}.phoneCarrier`, e.target.value)}
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
                          className="mt-2 block w-full rounded-md border-gray-300 py-3 px-4 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFieldChange(setFieldValue, `locationDetails.${index}.otherPhoneCarrier`, e.target.value)}
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
                              className="mt-1 block w-full rounded-md border-gray-300 py-3 px-4 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFieldChange(setFieldValue, `locationDetails.${index}.carrierCredentials.username`, e.target.value)}
                            />
                          </div>
                          <div>
                            <label htmlFor={`locationDetails.${index}.carrierCredentials.password`} className="block text-sm font-medium text-gray-700">
                              Account Password
                            </label>
                            <div className="mt-1 relative">
                              <Field
                                type={values.locationDetails[index].showPassword ? "text" : "password"}
                                name={`locationDetails.${index}.carrierCredentials.password`}
                                placeholder="Enter your carrier account password"
                                className="block w-full rounded-md border-gray-300 py-3 px-4 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFieldChange(setFieldValue, `locationDetails.${index}.carrierCredentials.password`, e.target.value)}
                              />
                              <div className="mt-2">
                                <label className="inline-flex items-center">
                                  <input
                                    type="checkbox"
                                    checked={values.locationDetails[index].showPassword || false}
                                    onChange={(e) => handleFieldChange(setFieldValue, `locationDetails.${index}.showPassword`, e.target.checked)}
                                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                  />
                                  <span className="ml-2 text-sm text-gray-600">Show password</span>
                                </label>
                              </div>
                            </div>
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
                              className="mt-1 block w-full rounded-md border-gray-300 py-3 px-4 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFieldChange(setFieldValue, `locationDetails.${index}.carrierCredentials.pin`, e.target.value)}
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
                        ¿Querés configuraciones avanzadas para el Human Transfer?
                      </p>
                      <div className="space-y-4">
                        <div className="flex items-center space-x-4">
                          <label className="inline-flex items-center">
                            <input
                              type="radio"
                              name={`locationDetails.${index}.defaultTransferToHost`}
                              checked={values.locationDetails[index].defaultTransferToHost === true}
                              onChange={() => handleFieldChange(setFieldValue, `locationDetails.${index}.defaultTransferToHost`, true)}
                              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                            />
                            <span className="ml-2 text-sm text-gray-700">Yes</span>
                          </label>
                          <label className="inline-flex items-center">
                            <input
                              type="radio"
                              name={`locationDetails.${index}.defaultTransferToHost`}
                              checked={values.locationDetails[index].defaultTransferToHost === false}
                              onChange={() => handleFieldChange(setFieldValue, `locationDetails.${index}.defaultTransferToHost`, false)}
                              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                            />
                            <span className="ml-2 text-sm text-gray-700">No</span>
                          </label>
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
                                          className="mt-1 block w-full rounded-md border-gray-300 py-3 px-4 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleFieldChange(setFieldValue, `locationDetails.${index}.transferRules.${ruleIndex}.type`, e.target.value)}
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
                                          className="mt-1 block w-full rounded-md border-gray-300 py-3 px-4 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFieldChange(setFieldValue, `locationDetails.${index}.transferRules.${ruleIndex}.number`, e.target.value)}
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
                        ¿Aceptan reservas en esta locación?
                      </p>
                      <div className="space-y-4">
                        <div className="flex items-center space-x-4">
                          <label className="inline-flex items-center">
                            <input
                              type="radio"
                              name={`locationDetails.${index}.reservationSettings.acceptsReservations`}
                              checked={values.locationDetails[index].reservationSettings.acceptsReservations === true}
                              onChange={() => handleFieldChange(setFieldValue, `locationDetails.${index}.reservationSettings.acceptsReservations`, true)}
                              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                            />
                            <span className="ml-2 text-sm text-gray-700">Yes</span>
                          </label>
                          <label className="inline-flex items-center">
                            <input
                              type="radio"
                              name={`locationDetails.${index}.reservationSettings.acceptsReservations`}
                              checked={values.locationDetails[index].reservationSettings.acceptsReservations === false}
                              onChange={() => handleFieldChange(setFieldValue, `locationDetails.${index}.reservationSettings.acceptsReservations`, false)}
                              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                            />
                            <span className="ml-2 text-sm text-gray-700">No</span>
                          </label>
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
                                className="mt-1 block w-full rounded-md border-gray-300 py-3 px-4 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleFieldChange(setFieldValue, `locationDetails.${index}.reservationSettings.platform`, e.target.value)}
                              >
                                <option value="">Select reservation platform...</option>
                                {RESERVATION_PLATFORMS.map(platform => (
                                  <option key={platform} value={platform}>
                                    {platform}
                                  </option>
                                ))}
                              </Field>
                            </div>

                            {values.locationDetails[index].reservationSettings.platform && (
                              <div>
                                <label className="block text-sm font-medium text-gray-700">
                                  Link de Reservas
                                </label>
                                <p className="mt-1 text-sm text-gray-500">
                                  Ingresa el link exacto de reservas para esta ubicación. Este link será enviado por el asistente AI a los clientes que soliciten hacer una reserva.
                                </p>
                                <Field
                                  type="url"
                                  name={`locationDetails.${index}.reservationSettings.reservationLink`}
                                  placeholder="https://..."
                                  className="mt-1 block w-full rounded-md border-gray-300 py-3 px-4 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFieldChange(setFieldValue, `locationDetails.${index}.reservationSettings.reservationLink`, e.target.value)}
                                />
                              </div>
                            )}

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
                                  className="block w-32 rounded-md border-gray-300 py-3 px-4 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFieldChange(setFieldValue, `locationDetails.${index}.reservationSettings.maxAdvanceTime`, e.target.value)}
                                />
                                <Field
                                  as="select"
                                  name={`locationDetails.${index}.reservationSettings.maxAdvanceTimeUnit`}
                                  className="block w-32 rounded-md border-gray-300 py-3 px-4 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleFieldChange(setFieldValue, `locationDetails.${index}.reservationSettings.maxAdvanceTimeUnit`, e.target.value)}
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
                                className="mt-1 block w-full rounded-md border-gray-300 py-3 px-4 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFieldChange(setFieldValue, `locationDetails.${index}.reservationSettings.maxPartySize`, e.target.value)}
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700">
                                Grace Period (minutes)
                              </label>
                              <p className="mt-1 text-sm text-gray-500">
                                How many minutes after the reservation time the table will be held before being released
                              </p>
                              <Field
                                type="number"
                                min="0"
                                name={`locationDetails.${index}.reservationSettings.gracePeriod`}
                                className="mt-1 block w-full rounded-md border-gray-300 py-3 px-4 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFieldChange(setFieldValue, `locationDetails.${index}.reservationSettings.gracePeriod`, parseInt(e.target.value))}
                                placeholder="e.g., 15"
                              />
                            </div>
                          </div>
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
                onClick={() => handleSave(values)}
                className={hasUnsavedChanges ? 'btn-unsaved' : 'btn-saved'}
                disabled={!hasUnsavedChanges}
              >
                {hasUnsavedChanges ? 'Guardar cambios' : 'Cambios guardados'}
              </button>
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => navigate('/onboarding/contact-info')}
                  className="btn-secondary"
                >
                  {t('back')}
                </button>
                <button 
                  type="button"
                  onClick={() => handleNext(values)}
                  className="btn-primary"
                >
                  {t('continue')}
                </button>
              </div>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  )
}
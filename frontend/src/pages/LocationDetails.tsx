import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Formik, Form, Field, FieldArray } from 'formik'
import * as Yup from 'yup'
import { useForm } from '../context/FormContext'
import type { LocationDetail, WeeklySchedule as WeeklyScheduleType } from '../context/FormContext'
import { useTranslation } from '../hooks/useTranslation'
import { TimeSlots } from '../components/TimeSlots'
import WeeklyScheduleComponent from '../components/WeeklySchedule'
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline'
import { useFormikContext } from 'formik'
import { useFormProgress } from '../hooks/useFormProgress'
import { createEmptyLocation } from '../utils/locationUtils'

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
  'SPRINT CORPORATION',
  'OTHER'
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

interface PhoneNumber {
  value: string
  index: number
}

interface TransferRule {
  type: string
  number: string
  description?: string
  otherType?: string
  index: number
}

interface DiscountDetail {
  value: string
  index: number
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

interface ParkingDetails {
  hasParking: boolean
  parkingType: string | undefined
  pricingDetails: string
  location: string
}

interface ReservationSettings {
  acceptsReservations: boolean
  platform: string
  reservationLink: string
  phoneCarrier: string
  gracePeriod: number
  parking: ParkingDetails
  schedule: WeeklySchedule
}

export interface ExtendedLocationDetail {
  locationId: string
  selectedLocationName?: string
  state: string
  streetAddress: string
  timeZone: string
  managerEmail: string
  phoneNumbers: string[]
  acceptedPaymentMethods: string[]
  creditCardExclusions: string
  debitCardExclusions: string
  mobilePaymentExclusions: string
  phoneCarrier: string
  otherPhoneCarrier?: string
  carrierCredentials: CarrierCredentials
  schedule: WeeklySchedule
  defaultTransferToHost: boolean
  transferRules: TransferRule[]
  paymentMethodsNotes: string
  reservationSettings: ReservationSettings
  waitTimes: {
    [key: string]: {
      [timeSlot: string]: string
    }
  }
  pickupSettings: {
    platforms: string[]
    preferredPlatform: string
    preferredPlatformLink: string
    otherPlatform?: string
  }
  deliverySettings: {
    platforms: string[]
    preferredPlatform: string
    preferredPlatformLink: string
    otherPlatform?: string
  }
  parking: ParkingDetails
  corkage: {
    allowed: boolean
    fee: string
  }
  specialDiscounts: {
    hasDiscounts: boolean
    details: string[]
  }
  holidayEvents: {
    hasEvents: boolean
    events: any[]
  }
  specialEvents: {
    hasEvents: boolean
    events: any[]
  }
  socialMedia: {
    instagram: {
      usesInstagram: boolean
      handle: string
    }
  }
  birthdayCelebrations: {
    allowed: boolean
    details: string
    restrictions: string[]
  }
  dressCode: {
    hasDressCode: boolean
    details: string
    exceptions: string[]
  }
  ageVerification: {
    acceptedDocuments: string[]
    otherDocuments: string
  }
  smokingArea: {
    hasSmokingArea: boolean
    details: string
  }
  brunchMenu: {
    hasBrunchMenu: boolean
    schedule: string
    menuFile: File | null
    menuUrl?: string
  }
}

interface FormValues {
  locationDetails: ExtendedLocationDetail[]
}

interface FormContextType {
  state: {
    locationDetails: ExtendedLocationDetail[]
    locations: Array<{
      id: string
      name: string
      nameConfirmed: boolean
    }>
  }
  dispatch: (action: { type: string; payload: any }) => void
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

export const createEmptySchedule = (): WeeklySchedule => {
  const schedule: WeeklySchedule = {}
  DAYS_OF_WEEK.forEach(day => {
    schedule[day] = {
      enabled: false,
      timeSlots: [] as TimeSlot[]
    }
  })
  return schedule
}

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

const LocationDetails: React.FC = () => {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { state, dispatch } = useForm()
  const { formData, saveFormData } = useFormProgress()
  const [expandedLocations, setExpandedLocations] = useState<string[]>([])
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [showSavePrompt, setShowSavePrompt] = useState(false)
  const [showNotification, setShowNotification] = useState(false)

  // Validar el estado inicial y las ubicaciones
  useEffect(() => {
    console.log('Iniciando validación de ubicaciones:', {
      locationCount: formData.locationCount,
      locationDetails: state.locationDetails
    });

    const count = typeof formData.locationCount === 'number' ? formData.locationCount : 0;

    // Solo expandir la primera ubicación si ninguna está expandida
    if (expandedLocations.length === 0 && count > 0) {
      const firstLocationId = '1';
      console.log('Expandiendo primera ubicación:', firstLocationId);
      setExpandedLocations([firstLocationId]);
    }

  }, [formData.locationCount, expandedLocations]);

  const toggleAccordion = (id: string) => {
    setExpandedLocations(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const handleFieldChange = (setFieldValue: any, field: string, value: any) => {
    console.log('Campo modificado:', {
      field,
      value
    });
    
    setHasUnsavedChanges(true);
    setFieldValue(field, value);
  };

  const handleSave = async (values: FormValues) => {
    try {
      console.log('Guardando detalles de ubicación:', values);
      
      const locationDetails = values.locationDetails.map(location => ({
        ...location,
        phoneNumbers: location.phoneNumbers || [],
        acceptedPaymentMethods: location.acceptedPaymentMethods || [],
        parking: {
          hasParking: location.parking?.hasParking || false,
          parkingType: location.parking?.parkingType,
          pricingDetails: location.parking?.pricingDetails || '',
          location: location.parking?.location || ''
        }
      }));

      await dispatch({ type: 'SET_LOCATION_DETAILS', payload: locationDetails });
      await saveFormData();
      setHasUnsavedChanges(false);
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);
      
      console.log('Detalles guardados exitosamente');
    } catch (error) {
      console.error('Error al guardar los detalles:', error);
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
    <div className="space-y-8 overflow-y-auto max-h-screen pb-20">
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
            : Array(typeof formData.locationCount === 'number' ? formData.locationCount : 0).fill(null).map((_, index) => ({
                ...createEmptyLocation(),
                locationId: String(index + 1)
              }))
        }}
        enableReinitialize={true}
        validationSchema={validationSchema}
        onSubmit={handleNext}
      >
        {({ values, setFieldValue }) => (
          <Form className="space-y-8">
            <SavePrompt values={values} />
            
            {values.locationDetails.map((location: ExtendedLocationDetail, index: number) => (
              <div key={String(index + 1)} className="bg-white shadow rounded-lg overflow-hidden">
                <div 
                  className={`p-4 cursor-pointer flex justify-between items-center ${
                    expandedLocations.includes(String(index)) ? 'bg-gray-50' : 'bg-white'
                  }`}
                  onClick={() => toggleAccordion(String(index))}
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-lg font-medium text-gray-900">
                      {t('location')} {index + 1}
                    </span>
                    {location.selectedLocationName && (
                      <span className="text-sm text-gray-500">
                        ({location.selectedLocationName})
                      </span>
                    )}
                  </div>
                  <ChevronDownIcon
                    className={`w-5 h-5 text-gray-500 transform transition-transform ${
                      expandedLocations.includes(String(index)) ? 'rotate-180' : ''
                    }`}
                  />
                </div>
                
                <div className={`transition-all duration-200 ease-in-out ${
                  expandedLocations.includes(String(index)) 
                    ? 'max-h-none opacity-100' 
                    : 'max-h-0 opacity-0 overflow-hidden'
                }`}>
                  <div className="p-4 space-y-6">
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
                        {(formData.locations || [])
                          .filter(loc => loc.name && loc.nameConfirmed)
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

                    <SectionTitle>Contact Phone Numbers</SectionTitle>
                    <div className="space-y-4">
                      <p className="mt-1 mb-4 text-sm text-gray-500">
                        Add all phone numbers that customers can use to contact this location
                      </p>
                      <FieldArray name={`locationDetails.${index}.phoneNumbers`}>
                        {({ push, remove }) => (
                          <div className="space-y-2">
                            {values.locationDetails[index].phoneNumbers.map((phone: string, phoneIndex: number) => (
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

                    <SectionTitle>Payment Methods</SectionTitle>
                    <div className="mt-2 space-y-4">
                      <p className="mt-1 mb-4 text-sm text-gray-500">
                        Select all payment methods accepted at this location and specify any restrictions
                      </p>
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

                    <SectionTitle>Phone Carrier Settings</SectionTitle>
                    <div className="space-y-4">
                      <p className="mt-1 mb-4 text-sm text-gray-500">
                        Select the phone carrier for this location's phone numbers
                      </p>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Phone Carrier
                        </label>
                        <Field
                          as="select"
                          name={`locationDetails.${index}.phoneCarrier`}
                          className="mt-2 block w-full rounded-md border-gray-300 py-3 px-4 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleFieldChange(setFieldValue, `locationDetails.${index}.phoneCarrier`, e.target.value)}
                        >
                          <option value="">Select a carrier...</option>
                          {PHONE_CARRIERS.map(carrier => (
                            <option key={carrier} value={carrier}>
                              {carrier}
                            </option>
                          ))}
                        </Field>
                      </div>

                      {values.locationDetails[index].phoneCarrier === 'OTHER' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Specify Other Carrier
                          </label>
                          <Field
                            type="text"
                            name={`locationDetails.${index}.otherPhoneCarrier`}
                            className="mt-2 block w-full rounded-md border-gray-300 py-3 px-4 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            placeholder="Enter carrier name"
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                              handleFieldChange(setFieldValue, `locationDetails.${index}.otherPhoneCarrier`, e.target.value);
                            }}
                          />
                        </div>
                      )}

                      {values.locationDetails[index].phoneCarrier && (
                        <div className="mt-4 space-y-4 border border-gray-200 rounded-lg p-4">
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700">
                                Username
                              </label>
                              <Field
                                type="text"
                                name={`locationDetails.${index}.carrierCredentials.username`}
                                className="mt-2 block w-full rounded-md border-gray-300 py-3 px-4 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                placeholder="Enter carrier username"
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                  handleFieldChange(setFieldValue, `locationDetails.${index}.carrierCredentials.username`, e.target.value);
                                }}
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700">
                                Password
                              </label>
                              <Field
                                type="text"
                                name={`locationDetails.${index}.carrierCredentials.password`}
                                className="mt-2 block w-full rounded-md border-gray-300 py-3 px-4 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                placeholder="Enter carrier password"
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                  handleFieldChange(setFieldValue, `locationDetails.${index}.carrierCredentials.password`, e.target.value);
                                }}
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700">
                                PIN
                              </label>
                              <Field
                                type="text"
                                name={`locationDetails.${index}.carrierCredentials.pin`}
                                className="mt-2 block w-full rounded-md border-gray-300 py-3 px-4 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                placeholder="Enter carrier PIN"
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                  handleFieldChange(setFieldValue, `locationDetails.${index}.carrierCredentials.pin`, e.target.value);
                                }}
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                              Transfer Rules (Optional)
                            </label>
                            <p className="mt-1 text-sm text-gray-500">
                              By default, all calls will be transferred to the host. Use these rules only if you want to specify particular cases that should be handled differently. For example, if catering inquiries should go to a different number.
                            </p>
                            <FieldArray name={`locationDetails.${index}.transferRules`}>
                              {({ push, remove }) => (
                                <div className="space-y-2">
                                  {values.locationDetails[index].transferRules.map((rule: TransferRule, ruleIndex: number) => (
                                    <div key={ruleIndex} className="space-y-4 border border-gray-100 rounded p-4">
                                      <div>
                                        <label className="block text-sm font-medium text-gray-700">
                                          Call Type
                                        </label>
                                        <Field
                                          as="select"
                                          name={`locationDetails.${index}.transferRules.${ruleIndex}.type`}
                                          className="mt-2 block w-full rounded-md border-gray-300 py-3 px-4 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                                            handleFieldChange(setFieldValue, `locationDetails.${index}.transferRules.${ruleIndex}.type`, e.target.value);
                                          }}
                                        >
                                          <option value="">Select call type...</option>
                                          {CALL_TYPES.map(type => (
                                            <option key={type.value} value={type.value}>
                                              {type.label}
                                            </option>
                                          ))}
                                        </Field>
                                      </div>

                                      {rule.type === 'other' && (
                                        <div>
                                          <label className="block text-sm font-medium text-gray-700">
                                            Other Type Description
                                          </label>
                                          <Field
                                            type="text"
                                            name={`locationDetails.${index}.transferRules.${ruleIndex}.otherType`}
                                            className="mt-2 block w-full rounded-md border-gray-300 py-3 px-4 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                            placeholder="Describe the call type"
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                              handleFieldChange(setFieldValue, `locationDetails.${index}.transferRules.${ruleIndex}.otherType`, e.target.value);
                                            }}
                                          />
                                        </div>
                                      )}

                                      <div>
                                        <label className="block text-sm font-medium text-gray-700">
                                          Transfer Number
                                        </label>
                                        <Field
                                          type="tel"
                                          name={`locationDetails.${index}.transferRules.${ruleIndex}.number`}
                                          className="mt-2 block w-full rounded-md border-gray-300 py-3 px-4 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                          placeholder="Enter phone number"
                                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                            handleFieldChange(setFieldValue, `locationDetails.${index}.transferRules.${ruleIndex}.number`, e.target.value);
                                          }}
                                        />
                                      </div>

                                      <div>
                                        <label className="block text-sm font-medium text-gray-700">
                                          Description
                                        </label>
                                        <Field
                                          type="text"
                                          name={`locationDetails.${index}.transferRules.${ruleIndex}.description`}
                                          className="mt-2 block w-full rounded-md border-gray-300 py-3 px-4 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                          placeholder="Add any additional notes"
                                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                            handleFieldChange(setFieldValue, `locationDetails.${index}.transferRules.${ruleIndex}.description`, e.target.value);
                                          }}
                                        />
                                      </div>

                                      <button
                                        type="button"
                                        onClick={() => remove(ruleIndex)}
                                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                                      >
                                        Remove Rule
                                      </button>
                                    </div>
                                  ))}
                                  <button
                                    type="button"
                                    onClick={() => push({
                                      type: '',
                                      number: '',
                                      description: '',
                                      index: values.locationDetails[index].transferRules.length
                                    })}
                                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
                                  >
                                    Add Transfer Rule
                                  </button>
                                </div>
                              )}
                            </FieldArray>
                          </div>
                        </div>
                      )}
                    </div>

                    <SectionTitle>Operating Hours</SectionTitle>
                    <div className="space-y-4">
                      <p className="mt-1 mb-4 text-sm text-gray-500">
                        Set the operating hours for this location. For each day, you can specify multiple time slots including service periods (lunch, dinner, etc.) and break/closed periods between services.
                      </p>
                      {DAYS_OF_WEEK.map((day) => (
                        <div key={day} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <Field
                                type="checkbox"
                                name={`locationDetails.${index}.schedule.${day}.enabled`}
                                checked={values.locationDetails[index].schedule[day].enabled}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                  handleFieldChange(
                                    setFieldValue,
                                    `locationDetails.${index}.schedule.${day}.enabled`,
                                    e.target.checked
                                  );
                                  
                                  // Si se está habilitando el día, agregar un time slot por defecto
                                  if (e.target.checked && values.locationDetails[index].schedule[day].timeSlots.length === 0) {
                                    handleFieldChange(
                                      setFieldValue,
                                      `locationDetails.${index}.schedule.${day}.timeSlots`,
                                      [{
                                        start: '11:00',
                                        end: '22:00',
                                        type: 'all-day',
                                        kitchenClosingTime: '21:30'
                                      }]
                                    );
                                  }
                                }}
                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                              />
                              <label className="ml-2 block text-sm font-medium text-gray-700 capitalize">
                                {day}
                              </label>
                            </div>
                          </div>

                          {values.locationDetails[index].schedule[day].enabled && (
                            <div className="mt-4">
                              <FieldArray name={`locationDetails.${index}.schedule.${day}.timeSlots`}>
                                {({ push, remove }) => (
                                  <div className="space-y-4">
                                    {values.locationDetails[index].schedule[day].timeSlots.map((timeSlot: TimeSlot, timeSlotIndex: number) => (
                                      <div key={timeSlotIndex} className="flex items-start space-x-4 border border-gray-100 rounded p-4">
                                        <div className="flex-1 space-y-4">
                                          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                            <div>
                                              <label className="block text-sm font-medium text-gray-700">
                                                Opening Time
                                              </label>
                                              <Field
                                                type="time"
                                                name={`locationDetails.${index}.schedule.${day}.timeSlots.${timeSlotIndex}.start`}
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                                  handleFieldChange(
                                                    setFieldValue,
                                                    `locationDetails.${index}.schedule.${day}.timeSlots.${timeSlotIndex}.start`,
                                                    e.target.value
                                                  );
                                                }}
                                              />
                                            </div>
                                            <div>
                                              <label className="block text-sm font-medium text-gray-700">
                                                Closing Time
                                              </label>
                                              <Field
                                                type="time"
                                                name={`locationDetails.${index}.schedule.${day}.timeSlots.${timeSlotIndex}.end`}
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                                  handleFieldChange(
                                                    setFieldValue,
                                                    `locationDetails.${index}.schedule.${day}.timeSlots.${timeSlotIndex}.end`,
                                                    e.target.value
                                                  );
                                                }}
                                              />
                                            </div>
                                            <div>
                                              <label className="block text-sm font-medium text-gray-700">
                                                Kitchen Closing Time
                                              </label>
                                              <Field
                                                type="time"
                                                name={`locationDetails.${index}.schedule.${day}.timeSlots.${timeSlotIndex}.kitchenClosingTime`}
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                                  handleFieldChange(
                                                    setFieldValue,
                                                    `locationDetails.${index}.schedule.${day}.timeSlots.${timeSlotIndex}.kitchenClosingTime`,
                                                    e.target.value
                                                  );
                                                }}
                                              />
                                            </div>
                                          </div>
                                          <div>
                                            <label className="block text-sm font-medium text-gray-700">
                                              Service Type
                                            </label>
                                            <Field
                                              as="select"
                                              name={`locationDetails.${index}.schedule.${day}.timeSlots.${timeSlotIndex}.type`}
                                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                                                handleFieldChange(
                                                  setFieldValue,
                                                  `locationDetails.${index}.schedule.${day}.timeSlots.${timeSlotIndex}.type`,
                                                  e.target.value
                                                );
                                              }}
                                            >
                                              <option value="">Select service type...</option>
                                              <option value="lunch">Lunch</option>
                                              <option value="dinner">Dinner</option>
                                              <option value="brunch">Brunch</option>
                                              <option value="all-day">All Day</option>
                                              <option value="break">Break/Closed Period</option>
                                            </Field>
                                          </div>
                                        </div>
                                        <button
                                          type="button"
                                          onClick={() => remove(timeSlotIndex)}
                                          className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                                        >
                                          Remove
                                        </button>
                                      </div>
                                    ))}
                                    <button
                                      type="button"
                                      onClick={() => push({
                                        start: '',
                                        end: '',
                                        type: '',
                                        kitchenClosingTime: null
                                      })}
                                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
                                    >
                                      Add Time Slot
                                    </button>
                                  </div>
                                )}
                              </FieldArray>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    <SectionTitle>Wait Times</SectionTitle>
                    <div className="space-y-4">
                      <p className="mt-1 mb-4 text-sm text-gray-500">
                        Set the expected wait times for each time slot during your operating days. This helps customers plan their visits better.
                      </p>
                      {DAYS_OF_WEEK.map((day) => (
                        values.locationDetails[index].schedule[day].enabled && (
                          <div key={day} className="border border-gray-200 rounded-lg p-4">
                            <h4 className="font-medium text-gray-900 capitalize mb-4">{day}</h4>
                            <div className="space-y-4">
                              {TIME_SLOTS.map((timeSlot) => (
                                <div key={timeSlot.id} className="space-y-2">
                                  <label className="block text-sm font-medium text-gray-700">
                                    {timeSlot.label}
                                  </label>
                                  <div className="flex flex-wrap gap-2">
                                    {WAIT_TIME_RANGES.map((range) => (
                                      <button
                                        key={range.value}
                                        type="button"
                                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                          values.locationDetails[index].waitTimes[day]?.[timeSlot.id] === range.value
                                            ? range.color + ' ring-2 ring-indigo-500'
                                            : range.color
                                        }`}
                                        onClick={() => {
                                          const newWaitTimes = {
                                            ...values.locationDetails[index].waitTimes,
                                            [day]: {
                                              ...values.locationDetails[index].waitTimes[day],
                                              [timeSlot.id]: range.value
                                            }
                                          };
                                          handleFieldChange(setFieldValue, `locationDetails.${index}.waitTimes`, newWaitTimes);
                                        }}
                                      >
                                        {range.label}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )
                      ))}
                    </div>

                    <SectionTitle>Reservation Settings</SectionTitle>
                    <div className="space-y-4">
                      <p className="mt-1 mb-4 text-sm text-gray-500">
                        ¿Aceptan reservas en esta locación?
                      </p>
                      <div className="flex items-center space-x-4">
                        <label className="inline-flex items-center">
                          <Field
                            type="radio"
                            name={`locationDetails.${index}.reservationSettings.acceptsReservations`}
                            value={true}
                            checked={values.locationDetails[index].reservationSettings.acceptsReservations === true}
                            onChange={() => handleFieldChange(setFieldValue, `locationDetails.${index}.reservationSettings.acceptsReservations`, true)}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                          />
                          <span className="ml-2 text-sm text-gray-700">Yes</span>
                        </label>
                        <label className="inline-flex items-center">
                          <Field
                            type="radio"
                            name={`locationDetails.${index}.reservationSettings.acceptsReservations`}
                            value={false}
                            checked={values.locationDetails[index].reservationSettings.acceptsReservations === false}
                            onChange={() => handleFieldChange(setFieldValue, `locationDetails.${index}.reservationSettings.acceptsReservations`, false)}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                          />
                          <span className="ml-2 text-sm text-gray-700">No</span>
                        </label>
                      </div>

                      {values.locationDetails[index].reservationSettings.acceptsReservations && (
                        <div className="mt-4 space-y-4 border border-gray-200 rounded-lg p-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                              Reservation Platform
                            </label>
                            <Field
                              as="select"
                              name={`locationDetails.${index}.reservationSettings.platform`}
                              className="mt-2 block w-full rounded-md border-gray-300 py-3 px-4 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
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
                                className="mt-2 block w-full rounded-md border-gray-300 py-3 px-4 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFieldChange(setFieldValue, `locationDetails.${index}.reservationSettings.reservationLink`, e.target.value)}
                              />
                            </div>
                          )}

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
                              className="mt-2 block w-full rounded-md border-gray-300 py-3 px-4 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFieldChange(setFieldValue, `locationDetails.${index}.reservationSettings.gracePeriod`, parseInt(e.target.value))}
                              placeholder="e.g., 15"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <SectionTitle>Parking Information</SectionTitle>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-4">
                        <label className="inline-flex items-center">
                          <Field
                            type="radio"
                            name={`locationDetails.${index}.parking.hasParking`}
                            value={true}
                            checked={values.locationDetails[index].parking.hasParking === true}
                            onChange={() => handleFieldChange(setFieldValue, `locationDetails.${index}.parking.hasParking`, true)}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                          />
                          <span className="ml-2 text-sm text-gray-700">Has Parking</span>
                        </label>
                        <label className="inline-flex items-center">
                          <Field
                            type="radio"
                            name={`locationDetails.${index}.parking.hasParking`}
                            value={false}
                            checked={values.locationDetails[index].parking.hasParking === false}
                            onChange={() => handleFieldChange(setFieldValue, `locationDetails.${index}.parking.hasParking`, false)}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                          />
                          <span className="ml-2 text-sm text-gray-700">No Parking</span>
                        </label>
                      </div>

                      {values.locationDetails[index].parking.hasParking && (
                        <div className="mt-4 space-y-4 border border-gray-200 rounded-lg p-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                              Parking Type
                            </label>
                            <div className="mt-2 space-x-4">
                              <label className="inline-flex items-center">
                                <Field
                                  type="radio"
                                  name={`locationDetails.${index}.parking.parkingType`}
                                  value="free"
                                  checked={values.locationDetails[index].parking.parkingType === 'free'}
                                  onChange={() => handleFieldChange(setFieldValue, `locationDetails.${index}.parking.parkingType`, 'free')}
                                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                                />
                                <span className="ml-2 text-sm text-gray-700">Free</span>
                              </label>
                              <label className="inline-flex items-center">
                                <Field
                                  type="radio"
                                  name={`locationDetails.${index}.parking.parkingType`}
                                  value="paid"
                                  checked={values.locationDetails[index].parking.parkingType === 'paid'}
                                  onChange={() => handleFieldChange(setFieldValue, `locationDetails.${index}.parking.parkingType`, 'paid')}
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
                              <Field
                                type="text"
                                name={`locationDetails.${index}.parking.pricingDetails`}
                                placeholder="e.g., $5 per hour, $20 maximum"
                                className="mt-2 block w-full rounded-md border-gray-300 py-3 px-4 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFieldChange(setFieldValue, `locationDetails.${index}.parking.pricingDetails`, e.target.value)}
                              />
                            </div>
                          )}

                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                              Parking Location
                            </label>
                            <Field
                              type="text"
                              name={`locationDetails.${index}.parking.location`}
                              placeholder="e.g., Behind the restaurant, Street parking available"
                              className="mt-2 block w-full rounded-md border-gray-300 py-3 px-4 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFieldChange(setFieldValue, `locationDetails.${index}.parking.location`, e.target.value)}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <SectionTitle>Corkage Policy</SectionTitle>
                    <div className="space-y-4">
                      <p className="mt-1 mb-4 text-sm text-gray-500">
                        Specify if customers are allowed to bring their own wine and any associated corkage fees
                      </p>
                      <div className="flex items-center space-x-4">
                        <label className="inline-flex items-center">
                          <Field
                            type="radio"
                            name={`locationDetails.${index}.corkage.allowed`}
                            value={true}
                            checked={values.locationDetails[index].corkage.allowed === true}
                            onChange={() => handleFieldChange(setFieldValue, `locationDetails.${index}.corkage.allowed`, true)}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                          />
                          <span className="ml-2 text-sm text-gray-700">Allowed</span>
                        </label>
                        <label className="inline-flex items-center">
                          <Field
                            type="radio"
                            name={`locationDetails.${index}.corkage.allowed`}
                            value={false}
                            checked={values.locationDetails[index].corkage.allowed === false}
                            onChange={() => handleFieldChange(setFieldValue, `locationDetails.${index}.corkage.allowed`, false)}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                          />
                          <span className="ml-2 text-sm text-gray-700">Not Allowed</span>
                        </label>
                      </div>

                      {values.locationDetails[index].corkage.allowed && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Corkage Fee
                          </label>
                          <Field
                            type="text"
                            name={`locationDetails.${index}.corkage.fee`}
                            placeholder="e.g., $25 per bottle"
                            className="mt-2 block w-full rounded-md border-gray-300 py-3 px-4 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFieldChange(setFieldValue, `locationDetails.${index}.corkage.fee`, e.target.value)}
                          />
                        </div>
                      )}
                    </div>

                    <SectionTitle>Special Discounts & Happy Hours</SectionTitle>
                    <div className="space-y-4">
                      <p className="mt-1 mb-4 text-sm text-gray-500">
                        Specify any special discounts, happy hours, or promotional offers available at this location
                      </p>
                      <div className="flex items-center space-x-4">
                        <label className="inline-flex items-center">
                          <Field
                            type="radio"
                            name={`locationDetails.${index}.specialDiscounts.hasDiscounts`}
                            value={true}
                            checked={values.locationDetails[index].specialDiscounts.hasDiscounts === true}
                            onChange={() => handleFieldChange(setFieldValue, `locationDetails.${index}.specialDiscounts.hasDiscounts`, true)}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                          />
                          <span className="ml-2 text-sm text-gray-700">Yes, we offer special discounts</span>
                        </label>
                        <label className="inline-flex items-center">
                          <Field
                            type="radio"
                            name={`locationDetails.${index}.specialDiscounts.hasDiscounts`}
                            value={false}
                            checked={values.locationDetails[index].specialDiscounts.hasDiscounts === false}
                            onChange={() => handleFieldChange(setFieldValue, `locationDetails.${index}.specialDiscounts.hasDiscounts`, false)}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                          />
                          <span className="ml-2 text-sm text-gray-700">No special discounts</span>
                        </label>
                      </div>

                      {values.locationDetails[index].specialDiscounts.hasDiscounts && (
                        <div>
                          <FieldArray name={`locationDetails.${index}.specialDiscounts.details`}>
                            {({ push, remove }) => (
                              <div className="space-y-2">
                                {values.locationDetails[index].specialDiscounts.details.map((detail: string, detailIndex: number) => (
                                  <div key={detailIndex} className="flex gap-2">
                                    <Field
                                      type="text"
                                      name={`locationDetails.${index}.specialDiscounts.details.${detailIndex}`}
                                      placeholder="e.g., Happy Hour Mon-Fri 4-7pm: 50% off appetizers"
                                      className="flex-1 rounded-md border-gray-300 py-3 px-4 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFieldChange(setFieldValue, `locationDetails.${index}.specialDiscounts.details.${detailIndex}`, e.target.value)}
                                    />
                                    <button
                                      type="button"
                                      onClick={() => remove(detailIndex)}
                                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
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
                                  Add Discount/Happy Hour
                                </button>
                              </div>
                            )}
                          </FieldArray>
                        </div>
                      )}
                    </div>

                    <SectionTitle>Birthday Celebrations</SectionTitle>
                    <div className="space-y-4">
                      <p className="mt-1 mb-4 text-sm text-gray-500">
                        Specify your policy regarding birthday celebrations and any special arrangements available
                      </p>
                      <div className="flex items-center space-x-4">
                        <label className="inline-flex items-center">
                          <Field
                            type="radio"
                            name={`locationDetails.${index}.birthdayCelebrations.allowed`}
                            value={true}
                            checked={values.locationDetails[index].birthdayCelebrations.allowed === true}
                            onChange={() => handleFieldChange(setFieldValue, `locationDetails.${index}.birthdayCelebrations.allowed`, true)}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                          />
                          <span className="ml-2 text-sm text-gray-700">Birthday celebrations allowed</span>
                        </label>
                        <label className="inline-flex items-center">
                          <Field
                            type="radio"
                            name={`locationDetails.${index}.birthdayCelebrations.allowed`}
                            value={false}
                            checked={values.locationDetails[index].birthdayCelebrations.allowed === false}
                            onChange={() => handleFieldChange(setFieldValue, `locationDetails.${index}.birthdayCelebrations.allowed`, false)}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                          />
                          <span className="ml-2 text-sm text-gray-700">Not allowed</span>
                        </label>
                      </div>

                      {values.locationDetails[index].birthdayCelebrations.allowed && (
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                              Celebration Details
                            </label>
                            <Field
                              as="textarea"
                              name={`locationDetails.${index}.birthdayCelebrations.details`}
                              placeholder="e.g., Complimentary dessert, special song performance, etc."
                              className="mt-2 block w-full rounded-md border-gray-300 py-3 px-4 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleFieldChange(setFieldValue, `locationDetails.${index}.birthdayCelebrations.details`, e.target.value)}
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                              Restrictions
                            </label>
                            <FieldArray name={`locationDetails.${index}.birthdayCelebrations.restrictions`}>
                              {({ push, remove }) => (
                                <div className="space-y-2">
                                  {values.locationDetails[index].birthdayCelebrations.restrictions.map((restriction: string, restrictionIndex: number) => (
                                    <div key={restrictionIndex} className="flex gap-2">
                                      <Field
                                        type="text"
                                        name={`locationDetails.${index}.birthdayCelebrations.restrictions.${restrictionIndex}`}
                                        placeholder="e.g., Must book at least 24 hours in advance"
                                        className="flex-1 rounded-md border-gray-300 py-3 px-4 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFieldChange(setFieldValue, `locationDetails.${index}.birthdayCelebrations.restrictions.${restrictionIndex}`, e.target.value)}
                                      />
                                      <button
                                        type="button"
                                        onClick={() => remove(restrictionIndex)}
                                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
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
                                    Add Restriction
                                  </button>
                                </div>
                              )}
                            </FieldArray>
                          </div>
                        </div>
                      )}
                    </div>

                    <SectionTitle>Dress Code</SectionTitle>
                    <div className="space-y-4">
                      <p className="mt-1 mb-4 text-sm text-gray-500">
                        Specify if your location has a dress code policy and any exceptions
                      </p>
                      <div className="flex items-center space-x-4">
                        <label className="inline-flex items-center">
                          <Field
                            type="radio"
                            name={`locationDetails.${index}.dressCode.hasDressCode`}
                            value={true}
                            checked={values.locationDetails[index].dressCode.hasDressCode === true}
                            onChange={() => handleFieldChange(setFieldValue, `locationDetails.${index}.dressCode.hasDressCode`, true)}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                          />
                          <span className="ml-2 text-sm text-gray-700">Has dress code</span>
                        </label>
                        <label className="inline-flex items-center">
                          <Field
                            type="radio"
                            name={`locationDetails.${index}.dressCode.hasDressCode`}
                            value={false}
                            checked={values.locationDetails[index].dressCode.hasDressCode === false}
                            onChange={() => handleFieldChange(setFieldValue, `locationDetails.${index}.dressCode.hasDressCode`, false)}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                          />
                          <span className="ml-2 text-sm text-gray-700">No dress code</span>
                        </label>
                      </div>

                      {values.locationDetails[index].dressCode.hasDressCode && (
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                              Dress Code Details
                            </label>
                            <Field
                              as="textarea"
                              name={`locationDetails.${index}.dressCode.details`}
                              placeholder="e.g., Business casual, no shorts or flip-flops"
                              className="mt-2 block w-full rounded-md border-gray-300 py-3 px-4 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleFieldChange(setFieldValue, `locationDetails.${index}.dressCode.details`, e.target.value)}
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                              Exceptions
                            </label>
                            <FieldArray name={`locationDetails.${index}.dressCode.exceptions`}>
                              {({ push, remove }) => (
                                <div className="space-y-2">
                                  {values.locationDetails[index].dressCode.exceptions.map((exception: string, exceptionIndex: number) => (
                                    <div key={exceptionIndex} className="flex gap-2">
                                      <Field
                                        type="text"
                                        name={`locationDetails.${index}.dressCode.exceptions.${exceptionIndex}`}
                                        placeholder="e.g., Dress code relaxed for Sunday brunch"
                                        className="flex-1 rounded-md border-gray-300 py-3 px-4 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFieldChange(setFieldValue, `locationDetails.${index}.dressCode.exceptions.${exceptionIndex}`, e.target.value)}
                                      />
                                      <button
                                        type="button"
                                        onClick={() => remove(exceptionIndex)}
                                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
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
                                    Add Exception
                                  </button>
                                </div>
                              )}
                            </FieldArray>
                          </div>
                        </div>
                      )}
                    </div>

                    <SectionTitle>Age Verification</SectionTitle>
                    <div className="space-y-4">
                      <p className="mt-1 mb-4 text-sm text-gray-500">
                        Select which forms of identification are accepted for age verification
                      </p>
                      <div className="space-y-2">
                        {AGE_VERIFICATION_DOCUMENTS.map(doc => (
                          <div key={doc} className="flex items-center">
                            <Field
                              type="checkbox"
                              name={`locationDetails.${index}.ageVerification.acceptedDocuments`}
                              value={doc}
                              checked={values.locationDetails[index].ageVerification.acceptedDocuments.includes(doc)}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                const currentDocs = [...values.locationDetails[index].ageVerification.acceptedDocuments];
                                if (e.target.checked) {
                                  currentDocs.push(doc);
                                } else {
                                  const idx = currentDocs.indexOf(doc);
                                  if (idx > -1) {
                                    currentDocs.splice(idx, 1);
                                  }
                                }
                                handleFieldChange(setFieldValue, `locationDetails.${index}.ageVerification.acceptedDocuments`, currentDocs);
                              }}
                              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                            />
                            <label className="ml-2 text-sm text-gray-700">
                              {doc.replace(/_/g, ' ')}
                            </label>
                          </div>
                        ))}
                      </div>

                      {values.locationDetails[index].ageVerification.acceptedDocuments.includes('OTHER') && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Other Accepted Documents
                          </label>
                          <Field
                            type="text"
                            name={`locationDetails.${index}.ageVerification.otherDocuments`}
                            placeholder="Specify other accepted forms of ID"
                            className="mt-2 block w-full rounded-md border-gray-300 py-3 px-4 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFieldChange(setFieldValue, `locationDetails.${index}.ageVerification.otherDocuments`, e.target.value)}
                          />
                        </div>
                      )}
                    </div>

                    <SectionTitle>Smoking Area</SectionTitle>
                    <div className="space-y-4">
                      <p className="mt-1 mb-4 text-sm text-gray-500">
                        Specify if your location has a designated smoking area
                      </p>
                      <div className="flex items-center space-x-4">
                        <label className="inline-flex items-center">
                          <Field
                            type="radio"
                            name={`locationDetails.${index}.smokingArea.hasSmokingArea`}
                            value={true}
                            checked={values.locationDetails[index].smokingArea.hasSmokingArea === true}
                            onChange={() => handleFieldChange(setFieldValue, `locationDetails.${index}.smokingArea.hasSmokingArea`, true)}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                          />
                          <span className="ml-2 text-sm text-gray-700">Has smoking area</span>
                        </label>
                        <label className="inline-flex items-center">
                          <Field
                            type="radio"
                            name={`locationDetails.${index}.smokingArea.hasSmokingArea`}
                            value={false}
                            checked={values.locationDetails[index].smokingArea.hasSmokingArea === false}
                            onChange={() => handleFieldChange(setFieldValue, `locationDetails.${index}.smokingArea.hasSmokingArea`, false)}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                          />
                          <span className="ml-2 text-sm text-gray-700">No smoking allowed</span>
                        </label>
                      </div>

                      {values.locationDetails[index].smokingArea.hasSmokingArea && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Smoking Area Details
                          </label>
                          <Field
                            as="textarea"
                            name={`locationDetails.${index}.smokingArea.details`}
                            placeholder="e.g., Outdoor patio with heaters, available until 10 PM"
                            className="mt-2 block w-full rounded-md border-gray-300 py-3 px-4 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleFieldChange(setFieldValue, `locationDetails.${index}.smokingArea.details`, e.target.value)}
                          />
                        </div>
                      )}
                    </div>

                    <SectionTitle>Brunch Menu</SectionTitle>
                    <div className="space-y-4">
                      <p className="mt-1 mb-4 text-sm text-gray-500">
                        Specify if your location offers a brunch menu. We appreciate JPG format files, but PDF is also acceptable. You can also provide a link to your brunch menu if it's available on your website.
                      </p>
                      <div className="flex items-center space-x-4">
                        <label className="inline-flex items-center">
                          <Field
                            type="radio"
                            name={`locationDetails.${index}.brunchMenu.hasBrunchMenu`}
                            value={true}
                            checked={values.locationDetails[index].brunchMenu.hasBrunchMenu === true}
                            onChange={() => handleFieldChange(setFieldValue, `locationDetails.${index}.brunchMenu.hasBrunchMenu`, true)}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                          />
                          <span className="ml-2 text-sm text-gray-700">Has brunch menu</span>
                        </label>
                        <label className="inline-flex items-center">
                          <Field
                            type="radio"
                            name={`locationDetails.${index}.brunchMenu.hasBrunchMenu`}
                            value={false}
                            checked={values.locationDetails[index].brunchMenu.hasBrunchMenu === false}
                            onChange={() => handleFieldChange(setFieldValue, `locationDetails.${index}.brunchMenu.hasBrunchMenu`, false)}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                          />
                          <span className="ml-2 text-sm text-gray-700">No brunch menu</span>
                        </label>
                      </div>

                      {values.locationDetails[index].brunchMenu.hasBrunchMenu && (
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                              Brunch Schedule
                            </label>
                            <Field
                              as="textarea"
                              name={`locationDetails.${index}.brunchMenu.schedule`}
                              placeholder="e.g., Saturdays and Sundays from 10 AM to 3 PM"
                              className="mt-2 block w-full rounded-md border-gray-300 py-3 px-4 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleFieldChange(setFieldValue, `locationDetails.${index}.brunchMenu.schedule`, e.target.value)}
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                              Brunch Menu File
                            </label>
                            <p className="mt-1 text-sm text-gray-500">
                              Upload your brunch menu (JPG preferred, PDF accepted)
                            </p>
                            <input
                              type="file"
                              accept=".jpg,.jpeg,.pdf"
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  handleFieldChange(setFieldValue, `locationDetails.${index}.brunchMenu.menuFile`, file);
                                }
                              }}
                              className="mt-2 block w-full text-sm text-gray-500
                                file:mr-4 file:py-2 file:px-4
                                file:rounded-md file:border-0
                                file:text-sm file:font-medium
                                file:bg-indigo-50 file:text-indigo-700
                                hover:file:bg-indigo-100"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                              Brunch Menu URL
                            </label>
                            <p className="mt-1 text-sm text-gray-500">
                              If your brunch menu is available online, provide the direct link
                            </p>
                            <Field
                              type="url"
                              name={`locationDetails.${index}.brunchMenu.menuUrl`}
                              placeholder="https://..."
                              className="mt-2 block w-full rounded-md border-gray-300 py-3 px-4 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFieldChange(setFieldValue, `locationDetails.${index}.brunchMenu.menuUrl`, e.target.value)}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <SectionTitle>Pickup Settings</SectionTitle>
                    <div className="space-y-4">
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
                                  checked={values.locationDetails[index].pickupSettings.platforms.includes(platform)}
                                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                    const currentPlatforms = [...values.locationDetails[index].pickupSettings.platforms];
                                    if (e.target.checked) {
                                      currentPlatforms.push(platform);
                                    } else {
                                      const idx = currentPlatforms.indexOf(platform);
                                      if (idx > -1) {
                                        currentPlatforms.splice(idx, 1);
                                      }
                                    }
                                    handleFieldChange(setFieldValue, `locationDetails.${index}.pickupSettings.platforms`, currentPlatforms);
                                  }}
                                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                />
                                <label className="ml-2 text-sm text-gray-700">
                                  {platform.replace(/_/g, ' ')}
                                </label>
                              </div>
                            ))}
                            {values.locationDetails[index].pickupSettings.platforms.includes('OTHER') && (
                              <div className="mt-4 pl-6 border-l-2 border-indigo-100">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Especifica la otra plataforma
                                </label>
                                <p className="text-sm text-gray-500 mb-2">
                                  Indica el nombre de la plataforma que utilizas para pedidos de pickup
                                </p>
                                <Field
                                  type="text"
                                  name={`locationDetails.${index}.pickupSettings.otherPlatform`}
                                  placeholder="Ej: Sistema propio de pedidos"
                                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3"
                                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFieldChange(setFieldValue, `locationDetails.${index}.pickupSettings.otherPlatform`, e.target.value)}
                                />
                              </div>
                            )}
                          </div>
                        </div>

                        {values.locationDetails[index].pickupSettings.platforms.length > 0 && (
                          <>
                            <div>
                              <label className="block text-sm font-medium text-gray-700">
                                Preferred Platform
                              </label>
                              <p className="mt-1 text-sm text-gray-500">
                                Select your preferred platform for pickup orders. This will be promoted first by the AI.
                              </p>
                              <Field
                                as="select"
                                name={`locationDetails.${index}.pickupSettings.preferredPlatform`}
                                className="mt-2 block w-full rounded-md border-gray-300 py-3 px-4 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleFieldChange(setFieldValue, `locationDetails.${index}.pickupSettings.preferredPlatform`, e.target.value)}
                              >
                                <option value="">Select preferred platform...</option>
                                {values.locationDetails[index].pickupSettings.platforms.map(platform => (
                                  <option key={platform} value={platform}>
                                    {platform.replace(/_/g, ' ')}
                                  </option>
                                ))}
                              </Field>
                            </div>

                            {values.locationDetails[index].pickupSettings.preferredPlatform && (
                              <div>
                                <label className="block text-sm font-medium text-gray-700">
                                  Preferred Platform Link
                                </label>
                                <p className="mt-1 text-sm text-gray-500">
                                  Enter the direct link to your restaurant on the preferred platform
                                </p>
                                <Field
                                  type="url"
                                  name={`locationDetails.${index}.pickupSettings.preferredPlatformLink`}
                                  placeholder="https://..."
                                  className="mt-2 block w-full rounded-md border-gray-300 py-3 px-4 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFieldChange(setFieldValue, `locationDetails.${index}.pickupSettings.preferredPlatformLink`, e.target.value)}
                                />
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    <SectionTitle>Delivery Settings</SectionTitle>
                    <div className="space-y-4">
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
                                  checked={values.locationDetails[index].deliverySettings.platforms.includes(platform)}
                                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                    const currentPlatforms = [...values.locationDetails[index].deliverySettings.platforms];
                                    if (e.target.checked) {
                                      currentPlatforms.push(platform);
                                    } else {
                                      const idx = currentPlatforms.indexOf(platform);
                                      if (idx > -1) {
                                        currentPlatforms.splice(idx, 1);
                                      }
                                    }
                                    handleFieldChange(setFieldValue, `locationDetails.${index}.deliverySettings.platforms`, currentPlatforms);
                                  }}
                                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                />
                                <label className="ml-2 text-sm text-gray-700">
                                  {platform.replace(/_/g, ' ')}
                                </label>
                              </div>
                            ))}
                            {values.locationDetails[index].deliverySettings.platforms.includes('OTHER') && (
                              <div className="mt-4 pl-6 border-l-2 border-indigo-100">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Especifica la otra plataforma
                                </label>
                                <p className="text-sm text-gray-500 mb-2">
                                  Indica el nombre de la plataforma que utilizas para pedidos de delivery
                                </p>
                                <Field
                                  type="text"
                                  name={`locationDetails.${index}.deliverySettings.otherPlatform`}
                                  placeholder="Ej: Sistema propio de delivery"
                                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3"
                                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFieldChange(setFieldValue, `locationDetails.${index}.deliverySettings.otherPlatform`, e.target.value)}
                                />
                              </div>
                            )}
                          </div>
                        </div>

                        {values.locationDetails[index].deliverySettings.platforms.length > 0 && (
                          <>
                            <div>
                              <label className="block text-sm font-medium text-gray-700">
                                Preferred Platform
                              </label>
                              <p className="mt-1 text-sm text-gray-500">
                                Select your preferred platform for delivery orders. This will be promoted first by the AI.
                              </p>
                              <Field
                                as="select"
                                name={`locationDetails.${index}.deliverySettings.preferredPlatform`}
                                className="mt-2 block w-full rounded-md border-gray-300 py-3 px-4 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleFieldChange(setFieldValue, `locationDetails.${index}.deliverySettings.preferredPlatform`, e.target.value)}
                              >
                                <option value="">Select preferred platform...</option>
                                {values.locationDetails[index].deliverySettings.platforms.map(platform => (
                                  <option key={platform} value={platform}>
                                    {platform.replace(/_/g, ' ')}
                                  </option>
                                ))}
                              </Field>
                            </div>

                            {values.locationDetails[index].deliverySettings.preferredPlatform && (
                              <div>
                                <label className="block text-sm font-medium text-gray-700">
                                  Preferred Platform Link
                                </label>
                                <p className="mt-1 text-sm text-gray-500">
                                  Enter the direct link to your restaurant on the preferred platform
                                </p>
                                <Field
                                  type="url"
                                  name={`locationDetails.${index}.deliverySettings.preferredPlatformLink`}
                                  placeholder="https://..."
                                  className="mt-2 block w-full rounded-md border-gray-300 py-3 px-4 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFieldChange(setFieldValue, `locationDetails.${index}.deliverySettings.preferredPlatformLink`, e.target.value)}
                                />
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
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
  );
}

export default LocationDetails;
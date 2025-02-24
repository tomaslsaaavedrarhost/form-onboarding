import React, { createContext, useContext, useState } from 'react'
import { createEmptyLocation } from '../utils/locationUtils'

// Types
interface Location {
  id: string
  name: string
  nameConfirmed: boolean
}

interface MenuGroup {
  name: string
  locations: string[]
  regularMenu?: File | null
  dietaryMenu?: File | null
  veganMenu?: File | null
  otherMenus?: MenuFile[]
  sharedDishes?: string
  sharedDrinks?: string
  popularAppetizers?: string
  popularMainCourses?: string
  popularDesserts?: string
  popularAlcoholicDrinks?: string
  popularNonAlcoholicDrinks?: string
}

interface MenuFile {
  file: File
  name: string
}

interface MenuConfig {
  regularMenu: File | null
  dietaryMenu: File | null
  veganMenu: File | null
  otherMenus: MenuFile[]
  hasDietaryMenu: boolean
  hasVeganMenu: boolean
  hasOtherMenus: boolean
  sharedDishes: string
  sharedDrinks: string
  popularAppetizers: string
  popularMainCourses: string
  popularDesserts: string
  popularAlcoholicDrinks: string
  popularNonAlcoholicDrinks: string
}

interface TipsPolicy {
  useGroups: boolean
  locationPolicies: {
    [locationId: string]: {
      hasTips: 'yes' | 'no' | 'depends'
      tipDetails: string
      hasServiceCharge: boolean
      serviceChargeDetails: string
    }
  }
  groupPolicies: {
    [groupId: string]: {
      hasTips: 'yes' | 'no' | 'depends'
      tipDetails: string
      hasServiceCharge: boolean
      serviceChargeDetails: string
    }
  }
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

export interface WeeklySchedule {
  [key: string]: DaySchedule
}

interface WaitTimeSlot {
  [key: string]: string // '0-15' | '15-30' | '30-45' | '45-60' | '60+'
}

interface WaitTimes {
  monday: WaitTimeSlot
  tuesday: WaitTimeSlot
  wednesday: WaitTimeSlot
  thursday: WaitTimeSlot
  friday: WaitTimeSlot
  saturday: WaitTimeSlot
  sunday: WaitTimeSlot
}

interface PickupSettings {
  platforms: string[]
  preferredPlatform: string
  preferredPlatformLink: string
}

interface DeliverySettings {
  platforms: string[]
  preferredPlatform: string
  preferredPlatformLink: string
}

interface ParkingDetails {
  hasParking: boolean
  parkingType?: 'free' | 'paid'
  pricingDetails?: string
  location?: string
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

export interface LocationDetail {
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
  carrierCredentials: {
    username: string
    password: string
    pin: string
  }
  schedule: WeeklySchedule
  defaultTransferToHost: boolean
  transferRules: Array<{
    type: string
    number: string
    description?: string
    otherType?: string
    index: number
  }>
  paymentMethodsNotes: string
  reservationSettings: {
    acceptsReservations: boolean
    platform: string
    reservationLink: string
    phoneCarrier: string
    gracePeriod: number
    maxAdvanceTime?: number
    maxAdvanceTimeUnit?: string
    maxPartySize?: number
    parking: {
      hasParking: boolean
      parkingType: string | undefined
      pricingDetails: string
      location: string
    }
    schedule: WeeklySchedule
  }
  waitTimes: {
    [key: string]: {
      [timeSlot: string]: string
    }
  }
  pickupSettings: {
    platforms: string[]
    preferredPlatform: string
    preferredPlatformLink: string
  }
  deliverySettings: {
    platforms: string[]
    preferredPlatform: string
    preferredPlatformLink: string
  }
  parking: {
    hasParking: boolean
    parkingType: string | undefined
    pricingDetails: string
    location: string
  }
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
    events: Array<{
      name: string
      date: string
      description: string
    }>
  }
  specialEvents: {
    hasEvents: boolean
    events: Array<{
      name: string
      date: string
      description: string
    }>
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
  }
}

interface FormState {
  language: string
  locations: Location[]
  locationDetails: LocationDetail[]
  menuGroups: MenuGroup[]
  menuFiles: { [groupId: string]: MenuConfig }
  legalData: {
    legalBusinessName: string
    restaurantType: string
    otherRestaurantType: string
    taxId: string
    irsLetter: File | null
    sameMenuForAll: boolean
  }
  contactInfo: {
    contactName: string
    phone: string
    email: string
    address: string
    city: string
    state: string
    zipCode: string
    sameForAllLocations: boolean
  }
  aiConfig: {
    language: string
    otherLanguage: string
    assistantName: string
    assistantGender: string
    personality: string
    avatar: File | null
    additionalInfo: string
  }
  tipsPolicy: TipsPolicy
  additionalNotes: string
  termsAccepted: boolean
  lastSaved: string
}

// Actions
type FormAction =
  | { type: 'SET_LANGUAGE'; payload: string }
  | { type: 'SET_LOCATIONS'; payload: Location[] }
  | { type: 'SET_LOCATION_DETAILS'; payload: LocationDetail[] }
  | { type: 'SET_MENU_GROUPS'; payload: MenuGroup[] }
  | { type: 'SET_MENU_FILES'; payload: { groupId: string; files: MenuConfig } }
  | { type: 'SET_LEGAL_DATA'; payload: FormState['legalData'] }
  | { type: 'SET_CONTACT_INFO'; payload: FormState['contactInfo'] }
  | { type: 'SET_AI_CONFIG'; payload: FormState['aiConfig'] }
  | { type: 'SET_TIPS_POLICY'; payload: FormState['tipsPolicy'] }
  | { type: 'SET_ADDITIONAL_NOTES'; payload: string }
  | { type: 'SET_TERMS_ACCEPTED'; payload: boolean }
  | { type: 'RESET_FORM' }

// Initial State
const initialState: FormState = {
  language: '',
  locations: [],
  locationDetails: [],
  menuGroups: [],
  menuFiles: {},
  legalData: {
    legalBusinessName: '',
    restaurantType: '',
    otherRestaurantType: '',
    taxId: '',
    irsLetter: null,
    sameMenuForAll: true
  },
  contactInfo: {
    contactName: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    sameForAllLocations: true,
  },
  aiConfig: {
    language: 'en',
    otherLanguage: '',
    assistantName: '',
    assistantGender: '',
    personality: '',
    avatar: null,
    additionalInfo: '',
  },
  tipsPolicy: {
    useGroups: false,
    locationPolicies: {},
    groupPolicies: {},
  },
  additionalNotes: '',
  termsAccepted: false,
  lastSaved: '',
}

// Reducer
function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case 'SET_LANGUAGE':
      return { ...state, language: action.payload }
    case 'SET_LOCATIONS':
      return { ...state, locations: action.payload }
    case 'SET_LOCATION_DETAILS':
      return {
        ...state,
        locationDetails: action.payload,
        lastSaved: new Date().toISOString()
      }
    case 'SET_MENU_GROUPS':
      return { ...state, menuGroups: action.payload }
    case 'SET_MENU_FILES':
      return {
        ...state,
        menuFiles: {
          ...state.menuFiles,
          [action.payload.groupId]: {
            ...state.menuFiles[action.payload.groupId],
            ...action.payload.files,
          },
        },
      }
    case 'SET_LEGAL_DATA':
      return { ...state, legalData: action.payload }
    case 'SET_CONTACT_INFO':
      return {
        ...state,
        contactInfo: {
          ...state.contactInfo,
          ...action.payload
        }
      }
    case 'SET_AI_CONFIG':
      return { ...state, aiConfig: action.payload }
    case 'SET_TIPS_POLICY':
      return { ...state, tipsPolicy: action.payload }
    case 'SET_ADDITIONAL_NOTES':
      return { ...state, additionalNotes: action.payload }
    case 'SET_TERMS_ACCEPTED':
      return { ...state, termsAccepted: action.payload }
    case 'RESET_FORM':
      return initialState
    default:
      return state
  }
}

// Context
export interface FormContextType {
  state: FormState;
  dispatch: React.Dispatch<FormAction>;
}

const FormContext = createContext<FormContextType | undefined>(undefined)

export const FormProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = React.useReducer(formReducer, initialState);

  return (
    <FormContext.Provider value={{ state, dispatch }}>
      {children}
    </FormContext.Provider>
  );
}

export const useForm = () => {
  const context = useContext(FormContext)
  if (!context) {
    throw new Error('useForm must be used within a FormProvider')
  }
  return context
}

export function createEmptySchedule(): WeeklySchedule {
  const schedule: WeeklySchedule = {}
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
  days.forEach(day => {
    schedule[day] = {
      enabled: false,
      timeSlots: []
    }
  })
  return schedule
}

export type { FormState, Location, MenuGroup, MenuFile, MenuConfig } 
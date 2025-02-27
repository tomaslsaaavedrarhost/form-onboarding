import { LocationDetail, WeeklySchedule } from '../context/FormContext'
import type { ExtendedLocationDetail } from '../pages/LocationDetails'

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

export const createEmptyLocation = (): ExtendedLocationDetail => ({
  locationId: '',
  selectedLocationName: '',
  state: '',
  streetAddress: '',
  timeZone: '',
  managerEmail: '',
  additionalEmails: [],
  phoneNumbers: [],
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
  defaultTransferToHost: false,
  transferRules: [],
  paymentMethodsNotes: '',
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
    preferredPlatformLink: '',
    otherPlatform: ''
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
  alcoholPolicy: {
    bottlesToGo: {
      allowed: 'no',
      details: ''
    },
    pickupDelivery: {
      policy: 'none',
      details: ''
    }
  },
  accessibility: {
    hasHighChairs: false,
    hasWheelchairRamps: false,
    hasAccessibleRestrooms: false,
    hasAccessibleParking: false,
    hasAccessibleEntrance: false,
    additionalFeatures: ''
  },
  petPolicy: {
    isPetFriendly: false,
    petRestrictions: '',
    serviceAnimalsOnly: true
  },
  privateEvents: {
    allowsPrivateEvents: false,
    privateEventContact: {
      name: '',
      phone: '',
      email: ''
    },
    privateEventSpaces: [],
    minimumSpend: '',
    maximumCapacity: '',
    advanceBookingRequired: ''
  },
  giftCards: {
    offersGiftCards: false,
    giftCardTypes: [],
    digitalGiftCards: false,
    physicalGiftCards: false,
    giftCardPurchaseOptions: [],
    giftCardRedemptionProcess: '',
    giftCardSystem: ''
  },
  loyaltyProgram: {
    hasLoyaltyProgram: false,
    loyaltyProgramName: '',
    loyaltyProgramDetails: '',
    loyaltyProgramEnrollment: ''
  },
  restaurantTechnology: {
    hasOwnApp: false,
    appName: '',
    appPlatforms: [],
    appFeatures: [],
    hasSelfCheckoutKiosks: false,
    kioskDetails: '',
    hasTableSideOrdering: false,
    tableSideOrderingDetails: ''
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
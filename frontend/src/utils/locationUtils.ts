import { LocationDetail, WeeklySchedule } from '../context/FormContext'

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

export function createEmptyLocation(): LocationDetail {
  const emptySchedule = createEmptySchedule();
  return {
    locationId: '',
    selectedLocationName: '',
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
    schedule: emptySchedule,
    defaultTransferToHost: false,
    transferRules: [],
    paymentMethodsNotes: '',
    reservationSettings: {
      acceptsReservations: false,
      platform: '',
      reservationLink: '',
      phoneCarrier: '',
      gracePeriod: 15,
      maxAdvanceTime: undefined,
      maxAdvanceTimeUnit: 'days',
      maxPartySize: undefined,
      parking: {
        hasParking: false,
        parkingType: undefined,
        pricingDetails: '',
        location: ''
      },
      schedule: emptySchedule
    },
    waitTimes: {},
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
  }
} 
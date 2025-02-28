import { BasicLocationDetail, WeeklySchedule } from '../types/location'

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

export const createEmptyLocation = (): BasicLocationDetail => ({
  locationId: '',
  selectedLocationName: '',
  name: '',
  address: '',
  city: '',
  state: '',
  zipCode: '',
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
  deliverySettings: {
    platforms: [],
    preferredPlatform: '',
    preferredPlatformLink: ''
  }
}) 
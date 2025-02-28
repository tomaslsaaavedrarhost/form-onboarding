// Interfaces básicas para la información de ubicación
export interface TimeSlot {
  start: string;
  end: string;
  type: string;
  kitchenClosingTime?: string | null;
}

export interface DaySchedule {
  enabled: boolean;
  timeSlots: TimeSlot[];
}

export interface WeeklySchedule {
  [key: string]: DaySchedule;
}

export interface ParkingDetails {
  hasParking: boolean;
  parkingType: string | undefined;
  pricingDetails: string;
  location: string;
}

export interface ReservationSettings {
  acceptsReservations: boolean;
  platform: string;
  reservationLink: string;
  phoneCarrier: string;
  gracePeriod: number;
  parking: ParkingDetails;
  schedule: WeeklySchedule;
}

export interface DeliverySettings {
  platforms: string[];
  preferredPlatform: string;
  preferredPlatformLink: string;
  deliveryInstructions?: string;
  deliveryRadius?: string;
  minimumOrderAmount?: string;
  claimsHandling?: {
    handledBy: string;
    restaurantHandledCases: string[];
    additionalDetails: string;
  };
}

export interface BasicLocationDetail {
  locationId: string;
  selectedLocationName: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  reservationSettings: ReservationSettings;
  deliverySettings: DeliverySettings;
} 
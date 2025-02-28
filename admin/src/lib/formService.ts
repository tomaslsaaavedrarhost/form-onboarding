import { collection, getDocs, getDoc, doc, query, orderBy, where, limit, Timestamp } from 'firebase/firestore'
import { db } from './firebase'

// Form submission interface
export interface FormSubmission {
  id: string
  userId: string
  userEmail: string
  createdAt: Date
  updatedAt: Date
  data: {
    // Basic info
    businessName?: string
    legalBusinessName?: string
    restaurantType?: string
    otherRestaurantType?: string
    taxId?: string
    irsLetterUrl?: string
    locationCount?: number
    sameMenuForAll?: boolean
    
    // Locations
    locations?: {
      name: string
      nameConfirmed: boolean
      groupId?: string
    }[]
    
    // Groups
    groups?: {
      id: string
      name: string
      locations: string[]
      nameConfirmed: boolean
    }[]
    
    // Contact info
    contactName?: string
    email?: string
    phone?: string
    address?: string
    city?: string
    state?: string
    zipCode?: string
    sameForAllLocations?: boolean
    
    // Location details
    locationDetails?: {
      locationId: string
      name: string
      streetAddress?: string
      timeZone?: string
      operatingHours?: {
        day: string
        isOpen: boolean
        openTime?: string
        closeTime?: string
      }[]
    }[]
    
    // AI config
    language?: string
    assistantName?: string
    assistantGender?: string
    personality?: string[] | string
    otherPersonality?: string
    additionalInfo?: string
    
    // Menu config
    menuGroups?: {
      locationId: string
      name: string
      menuType: string
      hasOtherMenus: boolean
      otherMenuTypes?: string[]
      menus?: {
        type: string
        sections: {
          name: string
          items: {
            name: string
            description: string
            price: string | number
            options?: {
              name: string
              items: {
                name: string
                price?: string | number
              }[]
            }[]
          }[]
        }[]
      }[]
    }[]
    
    // Any other fields can be added here
    [key: string]: any
  }
}

// Convert Firebase timestamp to Date
export const convertTimestamps = (data: any): any => {
  if (!data) return data
  
  if (data instanceof Timestamp) {
    return data.toDate()
  }
  
  if (typeof data === 'object') {
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        data[key] = convertTimestamps(data[key])
      }
    }
  }
  
  return data
}

// Get all form submissions
export async function getFormSubmissions(): Promise<FormSubmission[]> {
  try {
    const formsCollectionRef = collection(db, 'forms')
    const q = query(formsCollectionRef, orderBy('updatedAt', 'desc'))
    const querySnapshot = await getDocs(q)
    
    const submissions: FormSubmission[] = []
    querySnapshot.forEach((doc) => {
      const data = doc.data()
      submissions.push({
        id: doc.id,
        userId: data.userId,
        userEmail: data.userEmail,
        createdAt: convertTimestamps(data.createdAt),
        updatedAt: convertTimestamps(data.updatedAt),
        data: convertTimestamps(data.data)
      })
    })
    
    return submissions
  } catch (error) {
    console.error('Error getting form submissions:', error)
    throw error
  }
}

// Get a single form submission by ID
export async function getFormSubmission(id: string): Promise<FormSubmission | null> {
  try {
    const docRef = doc(db, 'forms', id)
    const docSnap = await getDoc(docRef)
    
    if (docSnap.exists()) {
      const data = docSnap.data()
      return {
        id: docSnap.id,
        userId: data.userId,
        userEmail: data.userEmail,
        createdAt: convertTimestamps(data.createdAt),
        updatedAt: convertTimestamps(data.updatedAt),
        data: convertTimestamps(data.data)
      }
    }
    
    return null
  } catch (error) {
    console.error('Error getting form submission:', error)
    throw error
  }
} 
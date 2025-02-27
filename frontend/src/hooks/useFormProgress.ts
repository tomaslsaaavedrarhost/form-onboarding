import { useState, useEffect } from 'react';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../lib/firebase';
import { useAuth } from '../lib/AuthContext';
import config from '../config';

export interface FormData {
  // Language
  language?: string;

  // Legal Data
  businessName?: string;
  legalBusinessName?: string;
  restaurantType?: string;
  otherRestaurantType?: string;
  taxId?: string;
  irsLetter?: File | null;
  legalDocuments?: string[];
  locationCount?: number;
  sameMenuForAll?: boolean;
  locations?: {
    name: string;
    nameConfirmed: boolean;
    groupId?: string;
  }[];
  groups?: {
    id: string;
    name: string;
    locations: string[];
  }[];

  // Contact Info
  email?: string;
  phone?: string;
  contactName?: string;
  sameForAllLocations?: boolean;

  // Location Details
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };

  // AI Config
  aiPreferences?: {
    language?: string;
    tone?: string;
    specialties?: string[];
  };

  // Menu Config
  menuItems?: {
    id: string;
    name: string;
    description: string;
    price: number;
    category: string;
    imageUrl?: string;
  }[];
  menuGroups?: {
    name: string;
    locations: string[];
    regularMenu: File | null;
    regularMenuUrl: string;
    hasDietaryMenu: boolean;
    dietaryMenu: File | null;
    dietaryMenuUrl: string;
    hasVeganMenu: boolean;
    veganMenu: File | null;
    veganMenuUrl: string;
    hasOtherMenus: boolean;
    otherMenus: File[];
    otherMenuUrls: string[];
    sharedDishes: string;
    sharedDrinks: string;
    popularAppetizers: string;
    popularMainCourses: string;
    popularDesserts: string;
    popularAlcoholicDrinks: string;
    popularNonAlcoholicDrinks: string;
  }[];

  // Tips Policy
  tipsEnabled?: boolean;
  tipPercentages?: number[];
  tipDistribution?: string;

  // Observations
  additionalNotes?: string;
  specialRequirements?: string[];
  termsAccepted?: boolean;

  // Metadata
  lastUpdated?: Date;
  currentStep?: string;
  isComplete?: boolean;

  // New fields for the new logic
  ownerEmail?: string;
}

export const useFormProgress = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState<FormData>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unsavedChanges, setUnsavedChanges] = useState(false);

  // Load user's form
  useEffect(() => {
    const loadFormData = async () => {
      if (!user) return;

      try {
        // Load own form
        const docRef = doc(db, 'formProgress', user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const ownedForm = docSnap.data() as FormData;
          setFormData(ownedForm);
        }

        setLoading(false);
      } catch (err) {
        console.error('Error loading form data:', err);
        setError('Error al cargar los datos del formulario');
        setLoading(false);
      }
    };

    loadFormData();
  }, [user]);

  // Update form data without saving
  const updateFormData = (newData: Partial<FormData>) => {
    setFormData(current => ({
      ...current,
      ...newData
    }));
    setUnsavedChanges(true);
  };

  // Save form data
  const saveFormData = async () => {
    if (!user) return false;

    try {
      const docId = user.uid;
      await setDoc(doc(db, 'formProgress', docId), {
        ...formData,
        lastUpdated: new Date()
      }, { merge: true });
      
      setUnsavedChanges(false);
      return true;
    } catch (err) {
      console.error('Error saving form data:', err);
      setError('Error al guardar los datos del formulario');
      return false;
    }
  };

  // Update a single field
  const updateField = (fieldName: keyof FormData, value: any) => {
    updateFormData({ [fieldName]: value });
  };

  // Subir archivo
  const uploadFile = async (file: File, path: string): Promise<string> => {
    if (!user) throw new Error('Usuario no autenticado');

    const fileRef = ref(storage, `${user.uid}/${path}/${file.name}`);
    await uploadBytes(fileRef, file);
    return await getDownloadURL(fileRef);
  };

  // Add saveField method
  const saveField = async (fieldName: keyof FormData, value: any): Promise<void> => {
    if (!user) return;
    try {
      const docId = user.uid;
      await setDoc(doc(db, 'formProgress', docId), {
        [fieldName]: value,
        lastUpdated: new Date()
      }, { merge: true });
    } catch (err) {
      console.error('Error saving field:', err);
      setError('Error al guardar el campo');
      throw err;
    }
  };

  return {
    formData,
    loading,
    error,
    unsavedChanges,
    updateField,
    updateFormData,
    saveFormData,
    uploadFile,
    saveField
  };
}; 
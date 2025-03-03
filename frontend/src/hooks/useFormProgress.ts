import { useState, useEffect } from 'react';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../lib/firebase';
import { useAuth } from '../lib/AuthContext';
import config from '../config';
import axios from 'axios';
import { useForm } from '../context/FormContext';

// Clave para almacenar los datos del formulario en localStorage para usuarios demo
const DEMO_FORM_DATA_KEY = 'demoFormData';

// Función para verificar si el usuario es de demostración
const isDemoUser = (user: any): boolean => {
  return user && 'isDemoUser' in user && user.isDemoUser === true;
};

// Función para obtener el ID del usuario (uid para Firebase, email para demo)
const getUserId = (user: any): string => {
  if (isDemoUser(user)) {
    return 'demo-user'; // ID fijo para usuario de demostración
  }
  return user.uid; // ID de Firebase para usuarios reales
};

// Función para cargar datos del formulario desde localStorage
const loadDemoFormData = (): FormData => {
  const storedData = localStorage.getItem(DEMO_FORM_DATA_KEY);
  if (storedData) {
    try {
      return JSON.parse(storedData);
    } catch (e) {
      console.error('Error parsing demo form data from localStorage:', e);
      return {};
    }
  }
  return {};
};

// Function to check if user is in demo mode
const getIsDemo = (user: any): boolean => {
  try {
    return isDemoUser(user);
  } catch (error) {
    console.error("Error checking demo mode:", error);
    return false;
  }
};

// Standalone function to refresh form data from localStorage or API
export async function refreshFormDataWithUser(user: any): Promise<FormData | null> {
  try {
    // Determine if user is in demo mode
    const isDemo = isDemoUser(user);
    
    console.log("Refreshing form data, demo mode:", isDemo);
    
    if (isDemo) {
      // For demo mode, load from localStorage but don't directly update context
      const storedData = window.localStorage.getItem(DEMO_FORM_DATA_KEY);
      console.log("Found demo data in localStorage:", storedData ? "Yes" : "No");
      
      if (storedData) {
        try {
          const parsedData = JSON.parse(storedData);
          console.log("Loaded demo data:", parsedData);
          // Just return the data, let the component decide how to use it
          return parsedData;
        } catch (error) {
          console.error("Error parsing demo data:", error);
        }
      }
    } else {
      try {
        // Define interface for API response
        interface ApiResponse {
          data?: FormData;
          [key: string]: any;
        }
        
        // For real users, load from API
        const response = await axios.get<ApiResponse>('/api/form/data');
        if (response.data && response.data.data) {
          return response.data.data;
        }
      } catch (error) {
        console.error('Error fetching form data:', error);
      }
    }
  } catch (error) {
    console.error('Error in refreshFormData:', error);
  }
  
  return null;
}

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
    nameConfirmed: boolean;
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
    assistantName?: string;
    assistantGender?: string;
    otherPersonality?: string;
    additionalInfo?: string;
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
  tipsPolicy?: {
    policyMode: 'individual' | 'single' | 'grouped';
    locationPolicies: {[key: string]: any};
    groupPolicies: {[key: string]: any};
    locationGroups: {[key: string]: string[]};
  };

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

/**
 * Guardar datos del formulario para un usuario demo en localStorage
 */
function saveDemoFormData(data: Partial<FormData>, combinedWithExisting: boolean = true) {
  try {
    console.log("Saving demo form data:", data);
    
    let formDataToSave: Partial<FormData>;
    
    if (combinedWithExisting) {
      // Obtener datos existentes y combinarlos
      const existingData = loadDemoFormData() || {};
      
      // Special handling for nested objects like aiPreferences
      const aiPreferences = {
        ...(existingData.aiPreferences || {}),
        ...(data.aiPreferences || {})
      };
      
      formDataToSave = {
        ...existingData,
        ...data,
        // Ensure aiPreferences is properly merged
        aiPreferences,
        // Asegurar que campos críticos nunca sean nulos o undefined
        locationCount: data.locationCount ?? existingData.locationCount ?? 1,
        lastUpdated: new Date()
      };
      
      // Log the data being saved for debugging
      console.log("Combined form data to save:", formDataToSave);
    } else {
      // Obtener datos existentes para referencia
      const existingData = loadDemoFormData() || {};
      
      // Usar solo los datos proporcionados
      formDataToSave = {
        ...data,
        // Asegurar que campos críticos nunca sean nulos o undefined 
        locationCount: data.locationCount !== undefined 
                ? data.locationCount 
                : existingData.locationCount !== undefined 
                  ? existingData.locationCount 
                  : localStorage.getItem(DEMO_FORM_DATA_KEY) ? JSON.parse(localStorage.getItem(DEMO_FORM_DATA_KEY)!).locationCount : 1,
        lastUpdated: new Date()
      };
      
      console.log("New form data to save:", formDataToSave);
    }
    
    // Convertir a JSON y guardar
    const jsonData = JSON.stringify(formDataToSave);
    localStorage.setItem(DEMO_FORM_DATA_KEY, jsonData);
    
    // Verificación explícita de guardado
    const savedData = localStorage.getItem(DEMO_FORM_DATA_KEY);
    if (!savedData) {
      console.error('Error: No se pudieron guardar los datos en localStorage');
      return false;
    }
    
    try {
      // Verificar que los datos se guardaron correctamente
      const parsedData = JSON.parse(savedData);
      console.log("Verification of saved data:", parsedData);
      
      // Verify aiPreferences was saved correctly if it exists
      if (data.aiPreferences && (!parsedData.aiPreferences || 
          Object.keys(parsedData.aiPreferences).length === 0)) {
        console.error('Error: aiPreferences no se guardó correctamente', parsedData);
        // Fix and save again
        parsedData.aiPreferences = data.aiPreferences;
        localStorage.setItem(DEMO_FORM_DATA_KEY, JSON.stringify(parsedData));
      }
      
      // Verify locationCount was saved correctly
      if (typeof parsedData.locationCount !== 'number') {
        console.error('Error: locationCount no se guardó correctamente', parsedData);
        // Corregir y guardar nuevamente
        parsedData.locationCount = data.locationCount ?? 1;
        localStorage.setItem(DEMO_FORM_DATA_KEY, JSON.stringify(parsedData));
      }
      
      // Verify contact information fields were saved correctly
      const contactFields = ['contactName', 'phone', 'email', 'address', 'city', 'state', 'zipCode'];
      const missingContactFields = contactFields.filter(field => 
        data[field as keyof FormData] && !parsedData[field as keyof FormData]
      );
      
      if (missingContactFields.length > 0) {
        console.error('Error: campos de contacto no se guardaron correctamente:', missingContactFields, parsedData);
        // Corregir y guardar nuevamente
        missingContactFields.forEach(field => {
          parsedData[field as keyof FormData] = data[field as keyof FormData];
        });
        localStorage.setItem(DEMO_FORM_DATA_KEY, JSON.stringify(parsedData));
      }
    } catch (e) {
      console.error('Error al verificar datos guardados:', e);
    }
    
    return true;
  } catch (error) {
    console.error('Error al guardar datos de formulario demo:', error);
    return false;
  }
}

export const useFormProgress = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState<FormData>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [selectedFormId, setSelectedFormId] = useState<string | null>(null);
  const formContext = useForm();

  // Load user's form
  useEffect(() => {
    const loadFormData = async () => {
      if (!user) return;

      try {
        // Si es un usuario de demostración, cargar desde localStorage
        if (isDemoUser(user)) {
          const demoData = loadDemoFormData();
          setFormData(demoData);
          setLoading(false);
          return;
        }

        // Load own form for real users
        const userId = getUserId(user);
        const docRef = doc(db, 'formProgress', userId);
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
    try {
      if (!user) {
        console.error("No user found");
        return false;
      }

      // No need to get form context here, use the one from the parent component
      if (!formContext) {
        console.error("Form context is not available");
        return false;
      }

      const state = formContext.state;
      
      if (!state) {
        console.error("Form context state not available");
        return false;
      }

      console.log("Saving form data with state:", state);

      // Si es un usuario de demostración, guardar en localStorage
      if (isDemoUser(user)) {
        try {
          // Preparar datos para guardar
          const dataToSave: Partial<FormData> = {
            // Datos básicos
            language: state.language || '',
            
            // Datos legales
            legalBusinessName: state.legalData?.legalBusinessName || '',
            restaurantType: state.legalData?.restaurantType || '',
            otherRestaurantType: state.legalData?.otherRestaurantType || '',
            taxId: state.legalData?.taxId || '',
            sameMenuForAll: state.legalData?.sameMenuForAll ?? true,
            
            // Also save locations and groups
            locations: Array.isArray(state.locations) ? state.locations.map(loc => ({
              name: loc?.name || '',
              nameConfirmed: loc?.nameConfirmed ?? false,
              id: loc?.id || ''
            })) : [],
            
            // Tips Policy data
            tipsPolicy: state.tipsPolicy ? {
              policyMode: state.tipsPolicy.policyMode || 'individual',
              locationPolicies: state.tipsPolicy.locationPolicies || {},
              groupPolicies: state.tipsPolicy.groupPolicies || {},
              locationGroups: state.tipsPolicy.locationGroups || {}
            } : undefined,
            
            groups: Array.isArray(state.menuGroups) ? state.menuGroups.map(group => ({
              id: group?.name || 'default',
              name: group?.name || '',
              locations: Array.isArray(group?.locations) ? group.locations : [],
              nameConfirmed: true
            })) : [],
            
            // Datos de contacto - asegurar que todos los campos estén presentes
            contactName: state.contactInfo?.contactName || '',
            phone: state.contactInfo?.phone || '',
            email: state.contactInfo?.email || '',
            address: state.contactInfo?.address || '',
            city: state.contactInfo?.city || '',
            state: state.contactInfo?.state || '',
            zipCode: state.contactInfo?.zipCode || '',
            sameForAllLocations: state.contactInfo?.sameForAllLocations ?? true,
            
            // Configuración de IA
            aiPreferences: {
              language: state.aiConfig?.language || 'en',
              tone: Array.isArray(state.aiConfig?.personality) 
                ? state.aiConfig.personality.join(',') 
                : '',
              specialties: Array.isArray(state.aiConfig?.personality) 
                ? state.aiConfig.personality 
                : [],
              assistantName: state.aiConfig?.assistantName || '',
              assistantGender: state.aiConfig?.assistantGender || '',
              otherPersonality: state.aiConfig?.otherPersonality || '',
              additionalInfo: state.aiConfig?.additionalInfo || ''
            },
            
            // Notas adicionales
            additionalNotes: state.additionalNotes || '',
            termsAccepted: state.termsAccepted ?? false,
            
            // Metadatos
            lastUpdated: new Date()
          };
          
          console.log("Saving form data to localStorage:", dataToSave);
          return saveDemoFormData(dataToSave);
        } catch (error) {
          console.error("Error preparing demo user data:", error);
          return false;
        }
      }

      // Para usuarios reales, guardar en Firestore
      try {
        const userId = getUserId(user);
        const docRef = doc(db, 'formProgress', userId);
        
        // Preparar datos para guardar
        const dataToSave: Partial<FormData> = {
          // Datos básicos
          language: state.language || '',
          
          // Datos legales
          legalBusinessName: state.legalData?.legalBusinessName || '',
          restaurantType: state.legalData?.restaurantType || '',
          otherRestaurantType: state.legalData?.otherRestaurantType || '',
          taxId: state.legalData?.taxId || '',
          sameMenuForAll: state.legalData?.sameMenuForAll ?? true,
          
          // Also save locations and groups
          locations: Array.isArray(state.locations) ? state.locations.map(loc => ({
            name: loc?.name || '',
            nameConfirmed: loc?.nameConfirmed ?? false,
            id: loc?.id || ''
          })) : [],
          
          // Tips Policy - Add complete tips policy data
          tipsPolicy: state.tipsPolicy ? {
            policyMode: state.tipsPolicy.policyMode || 'individual',
            locationPolicies: state.tipsPolicy.locationPolicies || {},
            groupPolicies: state.tipsPolicy.groupPolicies || {},
            locationGroups: state.tipsPolicy.locationGroups || {}
          } : undefined,
          
          groups: Array.isArray(state.menuGroups) ? state.menuGroups.map(group => ({
            id: group?.name || 'default',
            name: group?.name || '',
            locations: Array.isArray(group?.locations) ? group.locations : [],
            nameConfirmed: true
          })) : [],
          
          // Datos de contacto - asegurar que todos los campos estén presentes
          contactName: state.contactInfo?.contactName || '',
          phone: state.contactInfo?.phone || '',
          email: state.contactInfo?.email || '',
          address: state.contactInfo?.address || '',
          city: state.contactInfo?.city || '',
          state: state.contactInfo?.state || '',
          zipCode: state.contactInfo?.zipCode || '',
          sameForAllLocations: state.contactInfo?.sameForAllLocations ?? true,
          
          // Configuración de IA
          aiPreferences: {
            language: state.aiConfig?.language || 'en',
            tone: Array.isArray(state.aiConfig?.personality) 
              ? state.aiConfig.personality.join(',') 
              : '',
            specialties: Array.isArray(state.aiConfig?.personality) 
              ? state.aiConfig.personality 
              : [],
            assistantName: state.aiConfig?.assistantName || '',
            assistantGender: state.aiConfig?.assistantGender || '',
            otherPersonality: state.aiConfig?.otherPersonality || '',
            additionalInfo: state.aiConfig?.additionalInfo || ''
          },
          
          // Notas adicionales
          additionalNotes: state.additionalNotes || '',
          termsAccepted: state.termsAccepted ?? false,
          
          // Metadatos
          lastUpdated: new Date(),
          ownerEmail: user.email || ''
        };
        
        await setDoc(docRef, dataToSave, { merge: true });
        setUnsavedChanges(false);
        return true;
      } catch (error) {
        console.error("Error saving data to Firestore:", error);
        return false;
      }
    } catch (error) {
      console.error('Error saving form data:', error);
      return false;
    }
  };

  // Function to refresh data without using context directly 
  const refreshData = async () => {
    return await refreshFormDataWithUser(user);
  };

  // Función para guardar un campo específico
  const saveField = async (field: string, value: any) => {
    try {
      if (!user) return false;

      // Si es un usuario de demostración, guardar en localStorage
      if (isDemoUser(user)) {
        const dataToSave: Partial<FormData> = {
          [field]: value,
          lastUpdated: new Date()
        };
        return saveDemoFormData(dataToSave);
      }

      // Para usuarios reales, guardar en Firestore
      const userId = getUserId(user);
      const docRef = doc(db, 'formProgress', userId);
      await setDoc(docRef, { [field]: value, lastUpdated: new Date() }, { merge: true });
      return true;
    } catch (error) {
      console.error(`Error saving field ${field}:`, error);
      return false;
    }
  };

  // Función para actualizar un campo específico
  const updateField = (field: string, value: any) => {
    setFormData(current => ({
      ...current,
      [field]: value
    }));
    setUnsavedChanges(true);
  };

  // Función para subir un archivo
  const uploadFile = async (file: File, path: string): Promise<string> => {
    try {
      if (!user) throw new Error('No user authenticated');

      // Si es un usuario de demostración, simular subida
      if (isDemoUser(user)) {
        console.log('Demo user file upload simulation:', file.name);
        return URL.createObjectURL(file);
      }

      // Para usuarios reales, subir a Firebase Storage
      const userId = getUserId(user);
      const storageRef = ref(storage, `${userId}/${path}/${file.name}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      return downloadURL;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  };

  // Cambiar entre formularios
  const switchForm = async (formId: string) => {
    setSelectedFormId(formId);
    setLoading(true);
    
    try {
      const userId = user ? getUserId(user) : null;
      if (formId === userId) {
        // Use the standalone refreshFormDataWithUser function
        const refreshedData = await refreshFormDataWithUser(user);
        if (refreshedData) {
          setFormData(refreshedData);
        }
      } else {
        // Implementar lógica para formularios compartidos si es necesario
      }
    } catch (err) {
      console.error('Error switching form:', err);
      setError('Error al cambiar de formulario');
    } finally {
      setLoading(false);
    }
  };

  return {
    formData,
    setFormData,
    loading,
    error,
    unsavedChanges,
    selectedFormId,
    updateField,
    updateFormData,
    saveFormData,
    uploadFile,
    saveField,
    refreshData,
    switchForm
  };
};

export default useFormProgress; 
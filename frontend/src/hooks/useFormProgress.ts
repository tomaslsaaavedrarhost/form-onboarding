import { useState, useEffect } from 'react';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../lib/firebase';
import { useAuth } from '../lib/AuthContext';
import config from '../config';

// Clave para almacenar los datos del formulario en localStorage para usuarios demo
const DEMO_FORM_DATA_KEY = 'demoFormData';

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

/**
 * Guardar datos del formulario para un usuario demo en localStorage
 */
function saveDemoFormData(data: Partial<FormData>, combinedWithExisting: boolean = true) {
  try {
    let formDataToSave: Partial<FormData>;
    
    if (combinedWithExisting) {
      // Obtener datos existentes y combinarlos
      const existingData = loadDemoFormData() || {};
      formDataToSave = {
        ...existingData,
        ...data,
        // Asegurar que campos críticos nunca sean nulos o undefined
        locationCount: data.locationCount ?? existingData.locationCount ?? 1,
        lastUpdated: new Date()
      };
    } else {
      // Usar solo los datos proporcionados
      formDataToSave = {
        ...data,
        // Asegurar que campos críticos nunca sean nulos o undefined 
        locationCount: data.locationCount ?? 1,
        lastUpdated: new Date()
      };
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
      // Verificar que locationCount se guardó correctamente
      const parsedData = JSON.parse(savedData);
      if (typeof parsedData.locationCount !== 'number') {
        console.error('Error: locationCount no se guardó correctamente', parsedData);
        // Corregir y guardar nuevamente
        parsedData.locationCount = data.locationCount ?? 1;
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

  // Función para recargar manualmente los datos del formulario
  const refreshFormData = async () => {
    if (!user) return false;
    
    setLoading(true);
    try {
      // Si es un usuario de demostración, cargar desde localStorage
      if (isDemoUser(user)) {
        const demoData = loadDemoFormData();
        setFormData(demoData);
        setLoading(false);
        return true;
      }
      
      console.log('Recargando datos del formulario...');
      const userId = getUserId(user);
      const docRef = doc(db, 'formProgress', userId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const freshData = docSnap.data() as FormData;
        console.log('Datos recargados:', freshData);
        setFormData(freshData);
      } else {
        console.warn('No se encontraron datos para recargar');
      }
      
      setLoading(false);
      return true;
    } catch (err) {
      console.error('Error al recargar los datos:', err);
      setError('Error al recargar los datos del formulario');
      setLoading(false);
      return false;
    }
  };

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
      const updatedData = {
        ...formData,
        lastUpdated: new Date()
      };

      // Si es un usuario de demostración, guardar en localStorage
      if (isDemoUser(user)) {
        saveDemoFormData(updatedData);
        setUnsavedChanges(false);
        return true;
      }

      // Para usuarios reales, guardar en Firestore
      const userId = getUserId(user);
      await setDoc(doc(db, 'formProgress', userId), updatedData, { merge: true });
      
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

    // Para usuarios de demostración, simular una URL de archivo
    if (isDemoUser(user)) {
      return URL.createObjectURL(file); // Crear una URL local para el archivo
    }

    // Para usuarios reales, subir a Firebase Storage
    const userId = getUserId(user);
    const fileRef = ref(storage, `${userId}/${path}/${file.name}`);
    await uploadBytes(fileRef, file);
    return await getDownloadURL(fileRef);
  };

  // Add saveField method
  const saveField = async (fieldName: keyof FormData, value: any): Promise<void> => {
    if (!user) return;
    try {
      // Actualizar el estado local
      setFormData(current => ({
        ...current,
        [fieldName]: value
      }));

      // Si es un usuario de demostración, guardar en localStorage
      if (isDemoUser(user)) {
        const currentData = loadDemoFormData() || {};
        
        // Tratamiento especial para locationCount
        if (fieldName === 'locationCount') {
          // Asegurar que sea un número válido
          const countValue = typeof value === 'number' ? value : parseInt(value);
          if (!isNaN(countValue) && countValue >= 1) {
            console.log(`Demo user: Guardando locationCount: ${countValue}`);
            saveDemoFormData({
              ...currentData,
              [fieldName]: countValue, // Guardar como número
              lastUpdated: new Date()
            });
            
            // Verificación adicional
            setTimeout(() => {
              const savedData = loadDemoFormData();
              console.log(`Demo user: Verificación de locationCount guardado: ${savedData?.locationCount}`);
            }, 100);
          } else {
            console.error(`Demo user: Valor inválido para locationCount: ${value}`);
          }
        } else {
          // Otros campos
          saveDemoFormData({
            ...currentData,
            [fieldName]: value,
            lastUpdated: new Date()
          });
        }
        return;
      }

      // Para usuarios reales, guardar en Firestore
      const userId = getUserId(user);
      await setDoc(doc(db, 'formProgress', userId), {
        [fieldName]: value,
        lastUpdated: new Date()
      }, { merge: true });
    } catch (err) {
      console.error('Error saving field:', err);
      setError('Error al guardar el campo');
      throw err;
    }
  };

  // Cambiar entre formularios
  const switchForm = async (formId: string) => {
    setSelectedFormId(formId);
    setLoading(true);
    
    try {
      const userId = user ? getUserId(user) : null;
      if (formId === userId) {
        await refreshFormData();
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
    loading,
    error,
    unsavedChanges,
    selectedFormId,
    updateField,
    updateFormData,
    saveFormData,
    uploadFile,
    saveField,
    refreshFormData,
    switchForm
  };
}; 
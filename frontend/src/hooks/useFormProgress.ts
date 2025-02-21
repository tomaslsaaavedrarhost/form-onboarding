import { useState, useEffect } from 'react';
import { doc, setDoc, getDoc, collection, query, where, getDocs, addDoc, deleteDoc } from 'firebase/firestore';
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
    regularMenu: File | null;
    dietaryMenu: File | null;
    veganMenu: File | null;
    otherMenus: File[];
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

  // Sharing metadata
  ownerId?: string;
  sharedWith?: string[];
  formId?: string;

  // New field for shared form
  isShared?: boolean;

  // New fields for the new logic
  ownerEmail?: string;
}

interface ShareInvitation {
  formId: string;
  ownerId: string;
  recipientEmail: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: Date;
}

export const useFormProgress = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState<FormData>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sharedForms, setSharedForms] = useState<FormData[]>([]);
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [selectedFormId, setSelectedFormId] = useState<string | null>(null);

  // Load user's forms (both owned and shared)
  useEffect(() => {
    const loadFormData = async () => {
      if (!user) return;

      try {
        // Load shared forms first
        const sharedFormsQuery = query(
          collection(db, 'formProgress'),
          where('sharedWith', 'array-contains', user.email)
        );
        const sharedFormsSnap = await getDocs(sharedFormsQuery);
        const sharedFormsData = sharedFormsSnap.docs.map(doc => ({
          ...doc.data(),
          formId: doc.id,
          isShared: true,
          ownerEmail: doc.data().ownerEmail || 'Unknown'
        })) as FormData[];
        
        setSharedForms(sharedFormsData);

        // Load own form
        const docRef = doc(db, 'formProgress', user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const ownedForm = docSnap.data() as FormData;
          // Si no hay un formulario seleccionado, usar el propio
          if (!selectedFormId) {
            setFormData({ ...ownedForm, ownerId: user.uid });
            setSelectedFormId(user.uid);
          }
        }

        setLoading(false);
      } catch (err) {
        console.error('Error loading form data:', err);
        setError('Error al cargar los datos del formulario');
        setLoading(false);
      }
    };

    loadFormData();
  }, [user, selectedFormId]);

  // Switch to a different form
  const switchForm = async (formId: string) => {
    if (unsavedChanges) {
      if (!window.confirm('Hay cambios sin guardar. ¿Deseas continuar sin guardar?')) {
        return;
      }
    }

    try {
      const docRef = doc(db, 'formProgress', formId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const formData = docSnap.data() as FormData;
        setFormData({
          ...formData,
          formId,
          isShared: formId !== user?.uid
        });
        setSelectedFormId(formId);
        setUnsavedChanges(false);
      }
    } catch (err) {
      console.error('Error switching form:', err);
      setError('Error al cambiar de formulario');
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
    if (!user) return;

    try {
      const docId = formData.isShared && formData.formId ? formData.formId : user.uid;
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

  // Share form with another user
  const shareForm = async (recipientEmail: string): Promise<void> => {
    if (!user) throw new Error('Usuario no autenticado');

    try {
      // Create sharing invitation
      const invitation: ShareInvitation = {
        formId: user.uid,
        ownerId: user.uid,
        recipientEmail,
        status: 'pending',
        createdAt: new Date()
      };

      // First update Firestore
      await addDoc(collection(db, 'shareInvitations'), invitation);

      // Update form data with shared user
      const updatedData = {
        ...formData,
        sharedWith: [...(formData.sharedWith || []), recipientEmail]
      };

      await setDoc(doc(db, 'formProgress', user.uid), updatedData, { merge: true });
      setFormData(updatedData);

      // Send email notification
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/send-share-invitation`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Origin': window.location.origin
        },
        mode: 'cors',
        credentials: 'include',
        body: JSON.stringify({
          recipientEmail,
          ownerEmail: user.email,
          formId: user.uid
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al enviar la invitación por email');
      }

      const data = await response.json();
      console.log('Share invitation sent successfully:', data);
    } catch (err) {
      console.error('Error sharing form:', err);
      // Revert Firestore changes if email sending fails
      try {
        const updatedData = {
          ...formData,
          sharedWith: (formData.sharedWith || []).filter(email => email !== recipientEmail)
        };
        await setDoc(doc(db, 'formProgress', user.uid), updatedData, { merge: true });
        setFormData(updatedData);
      } catch (revertError) {
        console.error('Error reverting changes:', revertError);
      }
      throw new Error('Error al compartir el formulario: ' + (err instanceof Error ? err.message : 'Error desconocido'));
    }
  };

  // Remove sharing access
  const removeSharing = async (recipientEmail: string): Promise<void> => {
    if (!user) throw new Error('Usuario no autenticado');

    try {
      const updatedData = {
        ...formData,
        sharedWith: (formData.sharedWith || []).filter(email => email !== recipientEmail)
      };

      await setDoc(doc(db, 'formProgress', user.uid), updatedData, { merge: true });
      setFormData(updatedData);

      // Remove invitation
      const invitationsQuery = query(
        collection(db, 'shareInvitations'),
        where('formId', '==', user.uid),
        where('recipientEmail', '==', recipientEmail)
      );
      const invitationsSnap = await getDocs(invitationsQuery);
      invitationsSnap.docs.forEach(async (doc) => {
        await deleteDoc(doc.ref);
      });
    } catch (err) {
      setError('Error al remover acceso compartido');
      throw err;
    }
  };

  // Subir archivo
  const uploadFile = async (file: File, path: string): Promise<string> => {
    if (!user) throw new Error('Usuario no autenticado');

    const fileRef = ref(storage, `${user.uid}/${path}/${file.name}`);
    await uploadBytes(fileRef, file);
    return await getDownloadURL(fileRef);
  };

  return {
    formData,
    sharedForms,
    loading,
    error,
    unsavedChanges,
    selectedFormId,
    updateField,
    updateFormData,
    saveFormData,
    switchForm,
    shareForm,
    removeSharing,
    uploadFile
  };
}; 
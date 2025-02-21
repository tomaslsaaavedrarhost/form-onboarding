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

  // Tips Policy
  tipsEnabled?: boolean;
  tipPercentages?: number[];
  tipDistribution?: string;

  // Observations
  additionalNotes?: string;
  specialRequirements?: string[];

  // Metadata
  lastUpdated?: Date;
  currentStep?: string;
  isComplete?: boolean;

  // Sharing metadata
  ownerId?: string;
  sharedWith?: string[];
  formId?: string;
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

  // Load user's forms (both owned and shared)
  useEffect(() => {
    const loadFormData = async () => {
      if (!user) return;

      try {
        // Load owned form
        const docRef = doc(db, 'formProgress', user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const ownedForm = docSnap.data() as FormData;
          setFormData({ ...ownedForm, ownerId: user.uid });
        }

        // Load shared forms
        const sharedFormsQuery = query(
          collection(db, 'formProgress'),
          where('sharedWith', 'array-contains', user.email)
        );
        const sharedFormsSnap = await getDocs(sharedFormsQuery);
        const sharedFormsData = sharedFormsSnap.docs.map(doc => ({
          ...doc.data(),
          formId: doc.id
        })) as FormData[];
        setSharedForms(sharedFormsData);

        setLoading(false);
      } catch (err) {
        setError('Error al cargar los datos del formulario');
        setLoading(false);
      }
    };

    loadFormData();
  }, [user]);

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
        credentials: 'include',
        body: JSON.stringify({
          recipientEmail,
          ownerEmail: user.email,
          formId: user.uid
        })
      });

      if (!response.ok) {
        throw new Error('Error al enviar la invitación por email');
      }
    } catch (err) {
      console.error('Error sharing form:', err);
      setError('Error al compartir el formulario');
      throw err;
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

  // Save form data with real-time updates
  const saveFormData = async (newData: Partial<FormData>) => {
    if (!user) return;

    try {
      const updatedData = {
        ...formData,
        ...newData,
        lastUpdated: new Date(),
      };

      await setDoc(doc(db, 'formProgress', user.uid), updatedData, { merge: true });
      setFormData(updatedData);

      // If this is a shared form, notify other users of the update
      if (formData.sharedWith?.length) {
        await fetch(`${config.apiUrl}/api/notify-form-update`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            formId: user.uid,
            updatedBy: user.email,
            sharedWith: formData.sharedWith
          })
        });
      }
    } catch (err) {
      setError('Error al guardar los datos del formulario');
    }
  };

  // Subir archivo
  const uploadFile = async (file: File, path: string): Promise<string> => {
    if (!user) throw new Error('Usuario no autenticado');

    const fileRef = ref(storage, `${user.uid}/${path}/${file.name}`);
    await uploadBytes(fileRef, file);
    return await getDownloadURL(fileRef);
  };

  // Guardar campo individual
  const saveField = async (fieldName: keyof FormData, value: any, file?: File) => {
    try {
      let fieldValue = value;

      // Si hay un archivo, súbelo primero
      if (file) {
        const fileUrl = await uploadFile(file, fieldName);
        fieldValue = fileUrl;
      }

      await saveFormData({ [fieldName]: fieldValue });
    } catch (err) {
      setError(`Error al guardar el campo ${fieldName}`);
    }
  };

  return {
    formData,
    sharedForms,
    loading,
    error,
    saveField,
    saveFormData,
    uploadFile,
    shareForm,
    removeSharing
  };
}; 
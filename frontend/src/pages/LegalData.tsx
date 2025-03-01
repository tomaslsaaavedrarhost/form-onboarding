import React, { useEffect, useState, useCallback, useRef, useMemo, memo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useFormProgress } from '../hooks/useFormProgress'
import { useTranslation } from '../hooks/useTranslation'
import { TrashIcon, MapPinIcon, InformationCircleIcon } from '@heroicons/react/24/solid'

interface Location {
  name: string
  nameConfirmed: boolean
  groupId?: string
}

interface Group {
  id: string
  name: string
  locations: string[]
  nameConfirmed: boolean
}

interface FormState {
  businessName: string
  legalBusinessName: string
  restaurantType: string
  otherRestaurantType: string
  taxId: string
  irsLetter: File | null
  legalDocuments: string[]
  locationCount: number
  sameMenuForAll: boolean
  locations: Location[]
  groups: Group[]
}

const restaurantTypes = [
  { value: 'sports_bar', label: 'Sports Bar' },
  { value: 'fine_dining', label: 'Fine Dining' },
  { value: 'casual_dining', label: 'Casual Dining' },
  { value: 'fast_casual', label: 'Fast Casual' },
  { value: 'bistro', label: 'Bistro' },
  { value: 'steakhouse', label: 'Steakhouse' },
  { value: 'seafood', label: 'Seafood Restaurant' },
  { value: 'italian', label: 'Italian Restaurant' },
  { value: 'asian_fusion', label: 'Asian Fusion' },
  { value: 'pub', label: 'Pub & Brewery' },
  { value: 'other', label: 'Other' },
]

// Gradient card colors for groups
const gradientColors = [
  'from-pink-400 to-orange-400', // Pink to Orange
  'from-purple-400 to-blue-500', // Purple to Blue
  'from-green-400 to-teal-500',  // Green to Teal
  'from-yellow-400 to-amber-500', // Yellow to Amber
  'from-red-400 to-rose-500',    // Red to Rose
]

// Componente de notificación personalizado
const Notification = ({ message, onClose }: { message: string; onClose: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose()
    }, 3000)
    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div className="fixed bottom-4 right-4 bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded shadow-md">
      <div className="flex">
        <div className="py-1">
          <svg
            className="h-6 w-6 text-green-500 mr-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <div>
          <p className="font-bold">{message}</p>
        </div>
      </div>
    </div>
  )
}

// Extraer los componentes de entrada en componentes memorizados para evitar re-renderizados
const MemoizedTextInput = memo(({ 
  label, 
  id, 
  value, 
  onChange, 
  placeholder 
}: { 
  label: string; 
  id: string; 
  value: string; 
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; 
  placeholder: string;
}) => {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <input
        type="text"
        id={id}
        value={value}
        onChange={onChange}
        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-400 focus:border-transparent transition duration-200 shadow-sm"
        placeholder={placeholder}
      />
    </div>
  );
});
MemoizedTextInput.displayName = 'MemoizedTextInput';

const MemoizedSelect = memo(({ 
  label, 
  id, 
  value, 
  onChange, 
  options 
}: { 
  label: string; 
  id: string; 
  value: string | undefined; 
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void; 
  options: { value: string; label: string }[];
}) => {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <div className="relative">
        <select
          id={id}
          value={value || ''}
          onChange={onChange}
          className="w-full appearance-none px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-400 focus:border-transparent transition duration-200 shadow-sm pr-10"
        >
          <option value="">Selecciona un tipo</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
          </svg>
        </div>
      </div>
    </div>
  );
});
MemoizedSelect.displayName = 'MemoizedSelect';

const LegalData = () => {
  const navigate = useNavigate()
  const { formData, updateField, saveFormData, uploadFile, refreshData } = useFormProgress()
  const { t } = useTranslation()
  const [localFormData, setLocalFormData] = useState<FormState>({
    businessName: '',
    legalBusinessName: '',
    restaurantType: '',
    otherRestaurantType: '',
    taxId: '',
    irsLetter: null,
    legalDocuments: [],
    locationCount: 1,
    sameMenuForAll: true,
    locations: [{ name: '', nameConfirmed: false }],
    groups: []
  })
  const [showNotification, setShowNotification] = useState(false)
  const [notificationMessage, setNotificationMessage] = useState('')
  const [validationErrors, setValidationErrors] = useState<Partial<Record<keyof FormState, string>>>({})
  const [showSavePrompt, setShowSavePrompt] = useState(false)
  const [hasFormChanged, setHasFormChanged] = useState(false)
  // Add state for temporary location count input
  const [locationCountInput, setLocationCountInput] = useState<string>('1')
  // Add state for group warning
  const [showGroupWarning, setShowGroupWarning] = useState(false)
  // Add state for save in progress
  const [saveInProgress, setSaveInProgress] = useState(false)
  // Add state for which group is being added
  const [addingGroupIndex, setAddingGroupIndex] = useState<number | null>(null)

  // Valores locales para los campos con problemas de rendimiento
  const [legalBusinessNameInput, setLegalBusinessNameInput] = useState('');
  const [taxIdInput, setTaxIdInput] = useState('');
  
  // Referencia al temporizador de auto-guardado
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Referencia para rastrear la última actualización de legalDocuments
  const lastLegalDocsUpdateRef = useRef<string[]>([]);
  // Flag para deshabilitar temporalmente la sincronización después de una actualización de documentos
  const disableSyncAfterDocsUpdateRef = useRef<boolean>(false);

  // Agregar estado para manejar errores de ubicaciones
  const [locationErrors, setLocationErrors] = useState<{ [key: number]: string }>({});
  
  // Estado para errores de validación global
  const [validationMessages, setValidationMessages] = useState<string[]>([]);

  // Estados para el drag and drop
  const [isDragging, setIsDragging] = useState(false);

  // Estado para rastrear grupos recién creados
  const [newlyCreatedGroups, setNewlyCreatedGroups] = useState<string[]>([]);

  // Funciones memorizadas para evitar recreaciones en cada renderizado
  const handleLegalBusinessNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setLegalBusinessNameInput(e.target.value);
  }, []);
  
  const handleTaxIdChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setTaxIdInput(e.target.value);
  }, []);
  
  const handleRestaurantTypeChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    handleFieldChange('restaurantType', e.target.value);
  }, []);
  
  // Optimizar el useEffect para el auto-guardado
  useEffect(() => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }
    
    // Solo marcar los cambios si realmente han cambiado
    if (legalBusinessNameInput !== formData.legalBusinessName || taxIdInput !== formData.taxId) {
      setHasFormChanged(true);
    }
    
    // Solo configurar el temporizador si hay cambios
    if (legalBusinessNameInput !== formData.legalBusinessName || taxIdInput !== formData.taxId) {
      autoSaveTimerRef.current = setTimeout(() => {
        const updates = [];
        
        if (legalBusinessNameInput !== formData.legalBusinessName) {
          updates.push(updateField('legalBusinessName', legalBusinessNameInput));
        }
        
        if (taxIdInput !== formData.taxId) {
          updates.push(updateField('taxId', taxIdInput));
        }
        
        // Ejecutar todos los updates en paralelo para mejorar el rendimiento
        if (updates.length > 0) {
          Promise.all(updates).catch(err => console.error('Error al guardar campos:', err));
        }
      }, 1000);
    }
    
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [legalBusinessNameInput, taxIdInput, formData.legalBusinessName, formData.taxId, updateField]);

  // Memorizar restaurantTypes para evitar recreación en cada renderizado
  const restaurantTypeOptions = useMemo(() => restaurantTypes, []);

  // Función para verificar si un nombre de ubicación está duplicado
  const isDuplicateLocationName = (name: string, currentIndex: number): boolean => {
    return (formData?.locations || []).some(
      (location, index) => 
        index !== currentIndex && 
        location.name.trim().toLowerCase() === name.trim().toLowerCase()
    );
  };

  // Cargar datos existentes
  useEffect(() => {
    if (formData) {
      // Asegurarse de que locationCount siempre sea un número válido
      let locationCount = 1; // Valor predeterminado
      
      if (typeof formData.locationCount === 'number' && !isNaN(formData.locationCount) && formData.locationCount >= 1) {
        locationCount = formData.locationCount;
      } else if (typeof formData.locationCount === 'string') {
        // Intentar convertir de string a número si es necesario
        const parsedCount = parseInt(formData.locationCount);
        if (!isNaN(parsedCount) && parsedCount >= 1) {
          locationCount = parsedCount;
          // Actualizar el valor correcto en el formData
          updateField('locationCount', locationCount);
        }
      } else if (formData.locationCount === undefined || formData.locationCount === null) {
        // Si no existe, inicializar con 1
        updateField('locationCount', 1);
      }
      
      // Inicializar el valor de entrada
      setLocationCountInput(locationCount.toString());
      
      // Actualizar el estado local
      setLocalFormData(prev => ({
        ...prev,
        legalBusinessName: formData.businessName || '',
        taxId: formData.taxId || '',
        restaurantType: formData.restaurantType || '',
        otherRestaurantType: formData.otherRestaurantType || '',
        locationCount: locationCount,
        sameMenuForAll: formData.sameMenuForAll ?? true,
        locations: formData.locations || Array(locationCount).fill(null).map(() => ({ name: '', nameConfirmed: false })),
        groups: formData.groups || []
      }));
      
      // Inicializar campos locales desde formData
      setLegalBusinessNameInput(formData.legalBusinessName || '');
      setTaxIdInput(formData.taxId || '');
    }
  }, [formData])

  // Optimizamos el useEffect para que solo actualice cuando realmente cambie formData
  useEffect(() => {
    if (!formData) return;
    
    console.log('Verificando cambios en formData:', {
      currentLocations: formData.locations,
      newLocations: formData.locations,
      locationCount: formData.locationCount
    });
    
    // Verificar si estamos en un período de bloqueo después de una actualización de documentos
    if (disableSyncAfterDocsUpdateRef.current) {
      console.log('Sincronización bloqueada temporalmente después de actualizar documentos');
      disableSyncAfterDocsUpdateRef.current = false;
      return;
    }
    
    const hasChanges = Object.entries(formData).some(([key, value]) => {
      // Caso especial para legalDocuments - comprobamos contra nuestra referencia
      if (key === 'legalDocuments') {
        // Si acabamos de actualizar legalDocuments, no lo tratamos como un cambio
        const currentDocs = formData.legalDocuments || [];
        const lastDocs = lastLegalDocsUpdateRef.current;
        
        // Comparar los arrays
        const docsChanged = JSON.stringify(currentDocs) !== JSON.stringify(lastDocs);
        
        if (docsChanged) {
          console.log('Detectados cambios en legalDocuments:', {
            current: currentDocs,
            lastKnown: lastDocs
          });
        }
        
        return docsChanged;
      }
      
      // Para las ubicaciones, necesitamos una comparación más profunda
      if (key === 'locations') {
        const currentLocations = formData.locations || [];
        const newLocations = value as Location[] || [];
        const hasLocationChanges = JSON.stringify(currentLocations) !== JSON.stringify(newLocations);
        
        if (hasLocationChanges) {
          console.log('Detectados cambios en ubicaciones:', {
            current: currentLocations,
            new: newLocations
          });
        }
        
        return hasLocationChanges;
      }
      // Para los grupos, también necesitamos una comparación más profunda
      if (key === 'groups') {
        const currentGroups = formData.groups || [];
        const newGroups = value as Group[] || [];
        return JSON.stringify(currentGroups) !== JSON.stringify(newGroups);
      }
      return formData[key as keyof FormState] !== value;
    });

    if (!hasChanges) {
      console.log('No se detectaron cambios en formData');
      return;
    }

    const locationCount = typeof formData.locationCount === 'number' ? formData.locationCount : 1;
    console.log('Actualizando estado local con nuevo locationCount:', locationCount);
    
    // Update locationCountInput when locationCount changes
    setLocationCountInput(locationCount.toString());
    
    // Preservar las ubicaciones existentes y agregar nuevas si es necesario
    const updatedLocations = Array(locationCount).fill(null).map((_, index) => {
      // Intentar mantener la ubicación existente si existe
      const existingLocation = formData.locations?.[index] || formData.locations?.[index];
      if (existingLocation) {
        console.log(`Manteniendo ubicación existente ${index}:`, existingLocation);
        return existingLocation;
      }
      // Crear nueva ubicación si no existe
      console.log(`Creando nueva ubicación ${index}`);
      return { name: '', nameConfirmed: false };
    });

    // Preservar legalDocuments si acabamos de actualizarlo
    if (lastLegalDocsUpdateRef.current.length > 0) {
      console.log('Preservando legalDocuments recién actualizados durante sincronización');
      setLocalFormData(prev => ({
        ...prev,
        ...formData,
        locationCount,
        locations: updatedLocations,
        legalDocuments: lastLegalDocsUpdateRef.current // Usar nuestra referencia más actual
      }));
    } else {
      setLocalFormData(prev => ({
        ...prev,
        ...formData,
        locationCount,
        locations: updatedLocations
      }));
    }

    // Check if we need to show the group warning
    setShowGroupWarning(!formData.sameMenuForAll && (formData.groups || []).length < 2);

    // Resetear el estado de cambios sin guardar cuando se actualiza desde formData
    setHasFormChanged(false);
    if (window.onFormStateChange) {
      window.onFormStateChange(false);
    }
  }, [formData]);

  // Efecto para limpiar el estado de cambios sin guardar cuando se desmonta el componente
  useEffect(() => {
    return () => {
      // Limpiar el estado de cambios sin guardar al desmontar el componente
      if (window.onFormStateChange) {
        window.onFormStateChange(false);
      }
    };
  }, []);

  // Agregar useEffect para validar la consistencia de datos
  useEffect(() => {
    console.log('Validando consistencia de datos:', {
      locationCount: formData?.locationCount,
      actualLocations: formData?.locations?.length,
      locations: formData?.locations
    });

    // Validar que la cantidad de ubicaciones coincida con locationCount
    if (formData?.locationCount !== formData?.locations?.length) {
      console.warn('Inconsistencia detectada: locationCount no coincide con el número de ubicaciones');
      
      // Ajustar el array de ubicaciones para que coincida con locationCount
      const newLocations = Array(formData?.locationCount || 1).fill(null).map((_, index) => {
        return (formData?.locations || [])[index] || { name: '', nameConfirmed: false };
      });
      
      console.log('Ajustando array de ubicaciones:', newLocations);
      
      setLocalFormData(prev => ({
        ...prev,
        locations: newLocations
      }));
      
      // Actualizar el estado global
      updateField('locations', newLocations);
    }

    // Validar que no haya ubicaciones vacías si están confirmadas
    const hasInvalidLocations = (formData?.locations || []).some(
      location => location.nameConfirmed && !location.name.trim()
    );

    if (hasInvalidLocations) {
      console.error('Se detectaron ubicaciones confirmadas sin nombre:', 
        (formData?.locations || []).filter(loc => loc.nameConfirmed && !loc.name.trim())
      );
    }

    // Validar que todas las ubicaciones tengan un estado válido
    (formData?.locations || []).forEach((location, index) => {
      if (location.nameConfirmed && !location.name.trim()) {
        console.error(`Ubicación ${index} está confirmada pero no tiene nombre`);
      }
      if (!location.nameConfirmed && location.name.trim()) {
        console.warn(`Ubicación ${index} tiene nombre pero no está confirmada`);
      }
    });

  }, [formData?.locationCount, formData?.locations]);

  // Add this function to auto-confirm all existing groups
  const autoConfirmGroups = useCallback(() => {
    if (!formData?.groups || formData.groups.length === 0) return;
    
    console.log("Auto-confirming all groups:", formData.groups);
    
    // Check if any groups need confirmation
    const hasUnconfirmedGroups = formData.groups.some(group => group.nameConfirmed === false);
    
    if (hasUnconfirmedGroups) {
      // Create new groups array with all groups confirmed
      const confirmedGroups = formData.groups.map(group => ({
        ...group,
        nameConfirmed: true
      }));
      
      console.log("Updated groups with confirmation:", confirmedGroups);
      
      // Update both local and global state
      setLocalFormData(prev => ({ ...prev, groups: confirmedGroups }));
      updateField('groups', confirmedGroups);
      
      // Save the changes without refreshing to prevent flickering
      setTimeout(() => {
        console.log("Saving auto-confirmed groups");
        saveFormData().then(() => {
          console.log("Auto-confirmation saved successfully");
          // Don't refresh form data to prevent flickering
        });
      }, 500);
    }
  }, [formData?.groups, updateField, saveFormData]);

  // Add an effect to run the auto-confirmation when the component mounts or when groups change
  useEffect(() => {
    autoConfirmGroups();
  }, [autoConfirmGroups, formData?.groups]);

  // Modificar handleFieldChange para marcar cambios sin guardar
  const handleFieldChange = (
    fieldName: keyof FormState,
    value: any
  ) => {
    setHasFormChanged(true);
    
    // Comunicar al componente padre que hay cambios sin guardar
    if (window.onFormStateChange) {
      window.onFormStateChange(true);
    }
    
    // Special handling for sameMenuForAll toggle
    if (fieldName === 'sameMenuForAll' && value === false) {
      console.log("sameMenuForAll changed to false, creating default groups");
      
      // Create two default groups with nameConfirmed set to true
      const defaultGroups = [
        { 
          id: `group_${Date.now()}`, 
          name: generateGroupName(0), 
          locations: [], 
          nameConfirmed: true  // Auto-confirm group name
        },
        { 
          id: `group_${Date.now() + 1}`, 
          name: generateGroupName(1), 
          locations: [], 
          nameConfirmed: true  // Auto-confirm group name
        }
      ];
      
      console.log("Created default confirmed groups:", defaultGroups);
      
      // Update local state with both the toggle value and the new groups
      setLocalFormData(prev => ({ 
        ...prev, 
        [fieldName]: value,
        groups: defaultGroups
      }));
      
      // Update global state and save
      updateField('groups', defaultGroups);
      updateField(fieldName, value);
      
      // Save the changes without refreshing to prevent flickering
      setTimeout(() => {
        console.log("Saving after sameMenuForAll change");
        saveFormData().then(() => {
          console.log("Changes saved after sameMenuForAll toggle");
          // Don't refresh form data to prevent flickering
        });
      }, 500);
      
      return;
    }
    
    // Standard handling for other fields
    setLocalFormData(prev => ({ ...prev, [fieldName]: value }));
    
    if (typeof value === 'string' && ['otherRestaurantType'].includes(fieldName)) {
      if ((window as any).fieldUpdateTimeout) {
        clearTimeout((window as any).fieldUpdateTimeout);
      }
      (window as any).fieldUpdateTimeout = setTimeout(() => {
        updateField(fieldName, value);
      }, 500);
      return;
    }
    
    updateField(fieldName, value);
  };

  // Manejar subida de archivos
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      try {
        // Mostrar notificación de carga
        setNotificationMessage("Subiendo archivo...");
        setShowNotification(true);
        
        // Actualizar estado local primero para feedback inmediato y mantener referencia al archivo
        setLocalFormData(prev => ({ ...prev, irsLetter: file }));
        
        // Marcar que hay cambios sin guardar
        setHasFormChanged(true);
        
        console.log("Iniciando carga de archivo:", file.name);
        
        // Subir el archivo
        const fileUrl = await uploadFile(file, 'legalDocuments');
        console.log("Archivo subido exitosamente, URL:", fileUrl);
        
        // Obtener la lista actual de documentos y agregar el nuevo
        const currentDocs = Array.isArray(formData?.legalDocuments) ? [...formData.legalDocuments] : [];
        console.log("Documentos existentes:", currentDocs);
        
        // Agregar el nuevo documento a la lista
        const updatedDocs = [...currentDocs, fileUrl];
        console.log("Lista actualizada de documentos:", updatedDocs);
        
        // Actualizar nuestra referencia para rastrear la lista más reciente
        lastLegalDocsUpdateRef.current = updatedDocs;
        
        // Activar el bloqueo de sincronización para prevenir sobrescritura
        disableSyncAfterDocsUpdateRef.current = true;
        
        // Actualizar el estado local inmediatamente para feedback visual
        setLocalFormData(prev => ({ 
          ...prev, 
          legalDocuments: updatedDocs,
          irsLetter: null // Resetear después de subir con éxito
        }));
        
        // Actualizar el campo legalDocuments con la URL del archivo
        await updateField('legalDocuments', updatedDocs);
        console.log("Campo legalDocuments actualizado");
        
        // Guardar los cambios inmediatamente
        const saveResult = await saveFormData();
        console.log("Resultado de guardado:", saveResult ? "Éxito" : "Fallido");
        
        // Refrescar los datos para asegurar que todo está sincronizado
        // pero sin sobreescribir la lista de documentos local
        await refreshData();
        
        // Resetear el indicador de cambios sin guardar ya que se guardó correctamente
        setHasFormChanged(false);
        
        // Comunicar al componente padre que no hay cambios sin guardar
        if (window.onFormStateChange) {
          window.onFormStateChange(false);
        }
        
        // Mostrar notificación de éxito
        setNotificationMessage("Archivo subido correctamente");
        setShowNotification(true);
        setTimeout(() => setShowNotification(false), 3000);
      } catch (err) {
        console.error('Error al subir el archivo:', err);
        setNotificationMessage("Error al subir el archivo. Intenta de nuevo.");
        setShowNotification(true);
        setTimeout(() => setShowNotification(false), 3000);
      }
    }
  };

  // Función para guardar los cambios
  const handleSave = useCallback(async () => {
    console.log("Saving all form data...");
    console.log("Current locations before saving:", formData?.locations);
    console.log("Current groups before saving:", formData?.groups);
    
    // Set saving in progress
    setSaveInProgress(true);
    
    try {
      // Verificar si hay un archivo seleccionado que aún no se ha subido
      const pendingFile = localFormData.irsLetter;
      if (pendingFile && pendingFile instanceof File && 
          (!formData?.legalDocuments || !formData.legalDocuments.some(doc => doc.includes(pendingFile.name)))) {
        console.log("Detectado archivo pendiente de subida:", pendingFile.name);
        
        try {
          setNotificationMessage("Subiendo archivo antes de guardar...");
          setShowNotification(true);
          
          // Subir el archivo primero
          const fileUrl = await uploadFile(pendingFile, 'legalDocuments');
          console.log("Archivo subido exitosamente, URL:", fileUrl);
          
          // Obtener la lista actual de documentos y agregar el nuevo
          const currentDocs = Array.isArray(formData?.legalDocuments) ? [...formData.legalDocuments] : [];
          
          // Agregar el nuevo documento a la lista
          const updatedDocs = [...currentDocs, fileUrl];
          
          // Actualizar nuestra referencia para rastrear la lista más reciente
          lastLegalDocsUpdateRef.current = updatedDocs;
          
          // Activar el bloqueo de sincronización para prevenir sobrescritura
          disableSyncAfterDocsUpdateRef.current = true;
          
          // Actualizar el estado local inmediatamente para feedback visual
          setLocalFormData(prev => ({ 
            ...prev, 
            legalDocuments: updatedDocs,
            irsLetter: null // Resetear después de subir
          }));
          
          // Actualizar el campo legalDocuments con la URL del archivo
          await updateField('legalDocuments', updatedDocs);
        } catch (err) {
          console.error('Error al subir el archivo durante el guardado:', err);
          setNotificationMessage("Error al subir el archivo. Continuando con el resto del guardado...");
          setShowNotification(true);
          // Continuamos con el resto del guardado aunque falle la subida del archivo
        }
      }
      
      // Guardar primero los valores de los campos de texto locales
      if (legalBusinessNameInput !== formData.legalBusinessName) {
        await updateField('legalBusinessName', legalBusinessNameInput);
      }
      
      if (taxIdInput !== formData.taxId) {
        await updateField('taxId', taxIdInput);
      }
      
      // Explicitly update locations first to ensure they're saved
      if (formData?.locations && formData.locations.length > 0) {
        console.log("Explicitly updating locations before final save:", formData.locations);
        await updateField('locations', formData.locations);
      }
      
      // Make sure we specifically update groups before saving all data
      if (formData?.groups && formData.groups.length > 0) {
        console.log("Explicitly updating groups before final save:", formData.groups);
        await updateField('groups', formData.groups);
      }
      
      // Save all form data
      const result = await saveFormData();
      
      // Refresh data to verify what was saved
      await refreshData();
      console.log("Data after refresh - locations:", formData?.locations);
      console.log("Data after refresh - groups:", formData?.groups);
      
      setHasFormChanged(false);
      // Communicate to parent component that there are no unsaved changes
      if (window.onFormStateChange) {
        window.onFormStateChange(false);
      }
      
      setShowNotification(true);
      setNotificationMessage("Cambios guardados correctamente");
      setTimeout(() => setShowNotification(false), 3000);
      
      // Indicate success
      setSaveInProgress(false);
      return true;
    } catch (error) {
      console.error("Error saving form data:", error);
      setShowNotification(true);
      setNotificationMessage("Error al guardar los cambios. Intenta de nuevo.");
      setTimeout(() => setShowNotification(false), 3000);
      
      // Indicate failure
      setSaveInProgress(false);
      return false;
    }
  }, [formData, legalBusinessNameInput, taxIdInput, saveFormData, updateField, refreshData, localFormData, uploadFile]);

  // Exponer la función handleSave a través de window.saveCurrentFormData
  useEffect(() => {
    window.saveCurrentFormData = handleSave
    
    return () => {
      delete window.saveCurrentFormData
    }
  }, [handleSave])

  // Manejadores para el drag and drop
  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) {
      setIsDragging(true);
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      
      // Verificar el tipo de archivo
      const validTypes = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png'];
      const fileType = file.type;
      const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      
      if (!validTypes.includes(fileType) && !validTypes.includes(fileExtension)) {
        setNotificationMessage("Tipo de archivo no válido. Por favor, sube un PDF, DOC, DOCX, JPG o PNG.");
        setShowNotification(true);
        setTimeout(() => setShowNotification(false), 3000);
        return;
      }
      
      // Verificar el tamaño del archivo (10MB máximo)
      if (file.size > 10 * 1024 * 1024) {
        setNotificationMessage("El archivo es demasiado grande. El tamaño máximo es 10MB.");
        setShowNotification(true);
        setTimeout(() => setShowNotification(false), 3000);
        return;
      }
      
      try {
        // Mostrar notificación de carga
        setNotificationMessage("Subiendo archivo...");
        setShowNotification(true);
        
        // Actualizar estado local primero para feedback inmediato
        setLocalFormData(prev => ({ ...prev, irsLetter: file }));
        
        // Marcar que hay cambios sin guardar
        setHasFormChanged(true);
        
        console.log("Iniciando carga de archivo (drag & drop):", file.name);
        
        // Subir el archivo
        const fileUrl = await uploadFile(file, 'legalDocuments');
        console.log("Archivo subido exitosamente, URL:", fileUrl);
        
        // Obtener la lista actual de documentos y agregar el nuevo
        const currentDocs = Array.isArray(formData?.legalDocuments) ? [...formData.legalDocuments] : [];
        console.log("Documentos existentes:", currentDocs);
        
        // Agregar el nuevo documento a la lista
        const updatedDocs = [...currentDocs, fileUrl];
        console.log("Lista actualizada de documentos:", updatedDocs);
        
        // Actualizar nuestra referencia para rastrear la lista más reciente
        lastLegalDocsUpdateRef.current = updatedDocs;
        
        // Activar el bloqueo de sincronización para prevenir sobrescritura
        disableSyncAfterDocsUpdateRef.current = true;
        
        // Actualizar el estado local inmediatamente para feedback visual
        setLocalFormData(prev => ({ 
          ...prev, 
          legalDocuments: updatedDocs,
          irsLetter: null // Resetear después de subir con éxito
        }));
        
        // Actualizar el campo legalDocuments con la URL del archivo
        await updateField('legalDocuments', updatedDocs);
        console.log("Campo legalDocuments actualizado");
        
        // Guardar los cambios inmediatamente
        const saveResult = await saveFormData();
        console.log("Resultado de guardado:", saveResult ? "Éxito" : "Fallido");
        
        // Refrescar los datos para asegurar que todo está sincronizado
        // pero sin sobreescribir la lista de documentos local
        await refreshData();
        
        // Resetear el indicador de cambios sin guardar ya que se guardó correctamente
        setHasFormChanged(false);
        
        // Comunicar al componente padre que no hay cambios sin guardar
        if (window.onFormStateChange) {
          window.onFormStateChange(false);
        }
        
        // Mostrar notificación de éxito
        setNotificationMessage("Archivo subido correctamente");
        setShowNotification(true);
        setTimeout(() => setShowNotification(false), 3000);
      } catch (err) {
        console.error('Error al subir el archivo:', err);
        setNotificationMessage("Error al subir el archivo. Intenta de nuevo.");
        setShowNotification(true);
        setTimeout(() => setShowNotification(false), 3000);
      }
    }
  };

  // Manejar cambios en las ubicaciones
  const handleLocationChange = (index: number, value: string) => {
    console.log('Modificando ubicación:', {
      index,
      newValue: value,
      currentLocation: (formData?.locations || [])[index],
      allLocations: formData?.locations
    });

    const newLocations = [...(formData?.locations || [])];
    if (!newLocations[index]) {
      newLocations[index] = { name: '', nameConfirmed: false };
    }

    // Verificar duplicados
    if (value.trim() !== '' && isDuplicateLocationName(value, index)) {
      console.warn('Nombre de ubicación duplicado detectado:', value);
      setLocationErrors(prev => ({
        ...prev,
        [index]: 'Este nombre de ubicación ya existe'
      }));
    } else {
      setLocationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[index];
        return newErrors;
      });
    }

    // Marcar que hay cambios sin guardar si el valor es diferente
    if (newLocations[index].name !== value) {
      setHasFormChanged(true);
      
      // Notify parent component that there are unsaved changes
      if (window.onFormStateChange) {
        window.onFormStateChange(true);
      }
    }

    // Update the location name
    newLocations[index].name = value;
    
    // Desconfirmar la ubicación si se cambia el nombre
    newLocations[index].nameConfirmed = false;
    
    // Update local state
    setLocalFormData(prev => ({ ...prev, locations: newLocations }));
    
    // Clear any existing timeout for this location
    if ((window as any).locationUpdateTimeout) {
      clearTimeout((window as any).locationUpdateTimeout);
    }
    
    // Debounce the update to the global state
    (window as any).locationUpdateTimeout = setTimeout(() => {
      console.log('Actualizando ubicaciones en el estado global:', newLocations);
      updateField('locations', newLocations);
      
      // No need to save immediately here - this is just updating the field
      // The user will need to click "Confirm" to officially confirm the location
    }, 500);
  };

  // Manejar confirmación de nombres de ubicación
  const handleLocationConfirm = (index: number) => {
    console.log('Confirmando ubicación:', {
      index,
      location: (formData?.locations || [])[index]
    });

    // No permitir confirmar si hay un error
    if (locationErrors[index]) {
      console.warn('No se puede confirmar ubicación con errores:', locationErrors[index]);
      return;
    }

    // No permitir confirmar si el nombre está vacío
    if (!(formData?.locations || [])[index]?.name.trim()) {
      console.warn('No se puede confirmar ubicación sin nombre');
      return;
    }

    const newLocations = [...(formData?.locations || [])];
    newLocations[index].nameConfirmed = true;
    
    console.log('Actualizando estado de confirmación:', newLocations[index]);
    
    // Update local state
    setLocalFormData(prev => ({ ...prev, locations: newLocations }));
    
    // Update global state
    updateField('locations', newLocations);
    
    // Mark that there are unsaved changes
    setHasFormChanged(true);
    
    // Save changes immediately to ensure they persist
    console.log('Guardando ubicación confirmada...');
    setSaveInProgress(true);
    
    // Use setTimeout to ensure state updates are processed before saving
    setTimeout(() => {
      saveFormData().then(() => {
        console.log('Ubicación confirmada guardada correctamente');
        setSaveInProgress(false);
      }).catch(err => {
        console.error('Error al guardar la ubicación confirmada:', err);
        setSaveInProgress(false);
      });
    }, 100);
  };

  // Manejar cambios en grupos
  const handleGroupChange = (index: number, field: string, value: any) => {
    const newGroups = [...(formData?.groups || [])];
    if (!newGroups[index]) {
      newGroups[index] = { id: Date.now().toString(), name: '', locations: [], nameConfirmed: true }
    }

    if (field === 'locations') {
      const locationName = value[value.length - 1] // La ubicación que se está agregando/quitando
      const isAdding = newGroups[index].locations.length < value.length // true si estamos agregando, false si estamos quitando

      if (isAdding) {
        // Remover la ubicación de otros grupos
        newGroups.forEach((group, i) => {
          if (i !== index) {
            group.locations = group.locations.filter((loc: string) => loc !== locationName)
          }
        })
        
        console.log(`Agregando ubicación '${locationName}' al grupo ${index}:`, newGroups[index].name);
      } else {
        console.log(`Quitando ubicación del grupo ${index}:`, newGroups[index].name);
      }
    }

    // Marcar que hay cambios sin guardar cuando se modifican los grupos
    setHasFormChanged(true);
    
    // Actualizar el campo del grupo de manera segura
    if (field === 'name') {
      newGroups[index].name = value;
    } else if (field === 'locations') {
      newGroups[index].locations = value;
    } else if (field === 'nameConfirmed') {
      newGroups[index].nameConfirmed = value;
    }
    
    // Update local state
    setLocalFormData(prev => ({ ...prev, groups: newGroups }));
    
    // Update global state
    updateField('groups', newGroups);
    
    // Save changes immediately to ensure they persist
    console.log('Guardando cambios en grupos...');
    setSaveInProgress(true);
    
    // Use setTimeout to ensure state updates are processed before saving
    setTimeout(() => {
      saveFormData().then(() => {
        console.log('Cambios en grupos guardados correctamente', newGroups);
        setSaveInProgress(false);
      }).catch(err => {
        console.error('Error al guardar los cambios en grupos:', err);
        setSaveInProgress(false);
      });
    }, 100);
  }

  // Generar nombre de grupo automáticamente
  const generateGroupName = (index: number) => {
    const names = ['Grupo A', 'Grupo B', 'Grupo C', 'Grupo D']
    return names[index] || `Grupo ${index + 1}`
  }

  // Función para manejar la navegación
  const handleNext = () => {
    console.log("handleNext called, hasFormChanged:", hasFormChanged);
    console.log("Current locations:", formData?.locations);
    console.log("Current groups:", formData?.groups);
    
    // Usar la función de validación global
    if (!window.validateCurrentStep?.()) {
      return;
    }
    
    if (hasFormChanged) {
      console.log("Form has changed, showing SavePrompt");
      setShowSavePrompt(true);
    } else {
      console.log("Form has not changed, navigating directly");
      navigate('/onboarding/contact-info');
    }
  };

  // Componente para el modal de confirmación
  const SavePrompt = () => {
    console.log("Rendering SavePrompt, showSavePrompt:", showSavePrompt);
    if (!showSavePrompt) return null;

    // Verificar si hay ubicaciones con nombre pero sin confirmar
    const hasUnconfirmedLocations = (formData?.locations || []).some(
      location => location.name.trim() !== '' && !location.nameConfirmed
    );

    // Verificar si hay grupos sin confirmar cuando no se usa el mismo menú
    const hasUnconfirmedGroups = !formData?.sameMenuForAll && 
      (formData?.groups || []).some(group => !group.nameConfirmed && group.locations.length > 0);

    const handleContinueWithoutSaving = () => {
      console.log("Continue without saving clicked");
      // Ya hemos validado todo antes de mostrar el modal, así que podemos continuar directamente
      console.log("Navigating without saving");
      setShowSavePrompt(false);
      navigate('/onboarding/contact-info');
    };

    const handleSaveAndContinue = async () => {
      console.log("Save and continue clicked");
      console.log("Saving before navigation");
      const success = await handleSave();
      if (success) {
        console.log("Save successful, navigating");
        setShowSavePrompt(false);
        navigate('/onboarding/contact-info');
      } else {
        setShowSavePrompt(false);
        setValidationMessages(prev => [...prev, "Error al guardar los datos. Por favor intenta nuevamente."]);
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 shadow-2xl">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Cambios sin guardar
          </h3>
          <p className="text-gray-600 mb-6">
            Tienes cambios sin guardar. ¿Qué deseas hacer?
          </p>
          <div className="flex justify-end space-x-4">
            <button
              onClick={handleContinueWithoutSaving}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Continuar sin guardar
            </button>
            <button
              onClick={handleSaveAndContinue}
              className="px-6 py-2 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-lg hover:opacity-90 transition-colors shadow-md"
            >
              Guardar y continuar
            </button>
          </div>
        </div>
      </div>
    );
  };

  const handleAddGroup = () => {
    setHasFormChanged(true);
    
    // Track which group is being added
    const newIndex = (formData?.groups || []).length;
    setAddingGroupIndex(newIndex);
    
    // Add debug logs
    console.log("Adding new group. Current groups:", formData?.groups || []);
    
    // Generate a unique ID for the group
    const groupId = `group_${Date.now()}`;
    
    // Create the new group with all required fields - autoconfirm the name
    const newGroup = {
      id: groupId, 
      name: generateGroupName((formData?.groups || []).length), 
      locations: [],
      nameConfirmed: true  // Auto-confirm group name
    };
    
    // Agregar a la lista de grupos recién creados para mejora de UX
    setNewlyCreatedGroups(prev => [...prev, groupId]);
    setTimeout(() => {
      setNewlyCreatedGroups(prev => prev.filter(id => id !== groupId));
    }, 3000);
    
    console.log("New group created:", newGroup);
    
    // Create the updated groups array
    const newGroups = [...(formData?.groups || []), newGroup];
    
    // Update local state
    setLocalFormData(prev => ({ ...prev, groups: newGroups }));
    
    // Update global state
    console.log("Updating global state with new groups:", newGroups);
    updateField('groups', newGroups);
    
    // Set saving in progress
    setSaveInProgress(true);
    
    // Save changes immediately and ensure they persist
    // Use a small timeout to ensure the updateField has completed
    setTimeout(() => {
      console.log("Saving all form data...");
      saveFormData().then(() => {
        console.log("Changes saved after adding group");
        
        // Don't refresh form data immediately after saving as it may cause flickering
        // Instead, just reset the saving states
        setSaveInProgress(false);
        setAddingGroupIndex(null);
        
      }).catch(err => {
        console.error("Error saving new group:", err);
        // Reset saving state on error
        setSaveInProgress(false);
        setAddingGroupIndex(null);
      });
    }, 500);
  };

  // Verificar si una ubicación está huérfana (no asignada a ningún grupo)
  const isLocationOrphaned = (locationName: string): boolean => {
    // Si se usa el mismo menú para todas, no hay huérfanos
    if (formData?.sameMenuForAll) return false;
    
    // Si no hay grupos o no hay suficientes grupos, no verificamos
    if (!formData?.groups || formData.groups.length < 2) return false;
    
    // Verificar si la ubicación está asignada a algún grupo
    return !(formData.groups || []).some(group => 
      (group.locations || []).includes(locationName)
    );
  };

  useEffect(() => {
    // Limpiar la función global al desmontar el componente
    return () => {
      window.onFormStateChange = undefined;
      window.saveCurrentFormData = undefined;
      window.validateCurrentStep = undefined;
    };
  }, []);

  // Configurar la función de validación global
  useEffect(() => {
    // Implementar la función de validación para este componente
    window.validateCurrentStep = () => {
      console.log("Ejecutando validateCurrentStep en LegalData");
      // Limpiar mensajes de validación anteriores
      setValidationMessages([]);
      
      // Validación: Campo de nombre legal del negocio es obligatorio
      if (!legalBusinessNameInput?.trim()) {
        setValidationMessages(prev => [...prev, "El nombre legal del negocio es obligatorio."]);
        console.log("Validación fallida: El nombre legal del negocio es obligatorio");
        return false;
      }
      
      // Validación: Campo de cantidad de ubicaciones es obligatorio
      if (!formData?.locationCount || formData?.locationCount < 1) {
        setValidationMessages(prev => [...prev, "La cantidad de ubicaciones es obligatoria y debe ser al menos 1."]);
        console.log("Validación fallida: La cantidad de ubicaciones es obligatoria");
        return false;
      }
      
      // Verificar si hay ubicaciones con nombre pero sin confirmar
      const hasUnconfirmedLocations = (formData?.locations || []).some(
        location => location.name.trim() !== '' && !location.nameConfirmed
      );

      if (hasUnconfirmedLocations) {
        setValidationMessages(prev => [...prev, "Debes confirmar todas las ubicaciones que hayas nombrado."]);
        console.log("Validación fallida: Hay ubicaciones sin confirmar");
        return false;
      }
      
      // Verificar que la cantidad de ubicaciones confirmadas coincida con locationCount
      const confirmedLocationsCount = (formData?.locations || []).filter(
        location => location.nameConfirmed
      ).length;
      
      if (confirmedLocationsCount !== formData?.locationCount) {
        setValidationMessages(prev => [...prev, `Debes confirmar exactamente ${formData?.locationCount} ubicación(es). Actualmente tienes ${confirmedLocationsCount} confirmada(s).`]);
        console.log(`Validación fallida: Número de ubicaciones confirmadas (${confirmedLocationsCount}) no coincide con locationCount (${formData?.locationCount})`);
        return false;
      }

      // Verificar si se requieren grupos confirmados (cuando no se usa el mismo menú)
      if (formData && !formData.sameMenuForAll) {
        // Verificar que haya al menos 2 grupos
        if ((formData?.groups || []).length < 2) {
          setValidationMessages(prev => [...prev, "Debes tener al menos dos grupos cuando no uses el mismo menú para todas las ubicaciones."]);
          setShowGroupWarning(true);
          console.log("Validación fallida: Se requieren al menos dos grupos");
          return false;
        }
        
        // Verificar que todos los grupos tengan ubicaciones asignadas
        const emptyGroups = (formData?.groups || []).filter(group => !group.locations || group.locations.length === 0);
        if (emptyGroups.length > 0) {
          // Mostrar mensaje más específico indicando cuáles grupos están vacíos
          const emptyGroupNames = emptyGroups.map(group => group.name).join(', ');
          setValidationMessages(prev => [
            ...prev, 
            `Los siguientes grupos no tienen ubicaciones asignadas: ${emptyGroupNames}. Cada grupo debe tener al menos una ubicación seleccionada.`
          ]);
          console.log(`Validación fallida: Grupos vacíos: ${emptyGroupNames}`);
          return false;
        }
        
        // Verificar que todas las ubicaciones confirmadas estén asignadas a al menos un grupo
        const confirmedLocations = (formData?.locations || []).filter(location => location.nameConfirmed);
        const assignedLocations = new Set();
        
        // Recopilar todas las ubicaciones que están asignadas a algún grupo
        (formData?.groups || []).forEach(group => {
          (group.locations || []).forEach(locationName => {
            assignedLocations.add(locationName);
          });
        });
        
        // Buscar ubicaciones no asignadas
        const unassignedLocations = confirmedLocations.filter(
          location => !assignedLocations.has(location.name)
        );
        
        if (unassignedLocations.length > 0) {
          // Mostrar mensaje de error con las ubicaciones no asignadas
          const unassignedLocationNames = unassignedLocations.map(location => location.name).join(', ');
          setValidationMessages(prev => [
            ...prev,
            `Las siguientes ubicaciones no están asignadas a ningún grupo: ${unassignedLocationNames}. Todas las ubicaciones deben pertenecer a al menos un grupo.`
          ]);
          console.log(`Validación fallida: Ubicaciones no asignadas: ${unassignedLocationNames}`);
          return false;
        }
      }
       
      // Resetear el error si no hay ubicaciones sin confirmar
      setLocationErrors({});
      setShowGroupWarning(false);
      
      // Si llegamos aquí, todas las validaciones pasaron
      console.log("Validación exitosa en LegalData");
      return true;
    };
    
    // Limpiar la función al desmontar
    return () => {
      window.validateCurrentStep = undefined;
    };
  }, [formData, legalBusinessNameInput]);

  // Configurar las funciones globales para guardar datos y notificar cambios
  useEffect(() => {
    // Asignar la función para guardar datos
    window.saveCurrentFormData = saveFormData;
    
    // Asignar la función para notificar cambios
    window.onFormStateChange = (hasChanges) => {
      setHasFormChanged(hasChanges);
    };
  }, [saveFormData]);

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="space-y-10">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-red-500 to-purple-600 mb-4">Datos Legales</h2>
          <p className="text-gray-600 max-w-2xl mx-auto text-lg">
            Por favor, ingresa los datos legales de tu negocio para continuar con el proceso de onboarding.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8">
          <div className="bg-white rounded-2xl shadow-xl p-8 transform transition-all duration-300 hover:shadow-2xl">
            <div className="space-y-6">
              <div className="flex-1">
                <label 
                  htmlFor="legalBusinessName" 
                  className="block text-sm font-medium text-gray-700 mb-1 flex items-center"
                >
                  Nombre Legal del Negocio
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <div className="relative">
                  <input
                    id="legalBusinessName"
                    type="text"
                    value={legalBusinessNameInput}
                    onChange={handleLegalBusinessNameChange}
                    className={`block w-full px-4 py-3 rounded-lg border ${!legalBusinessNameInput.trim() ? 'border-red-300 ring-1 ring-red-300' : 'border-gray-300'} shadow-sm focus:border-indigo-500 focus:ring-indigo-500 transition-colors duration-200`}
                    placeholder="Nombre legal registrado"
                  />
                  {!legalBusinessNameInput.trim() && (
                    <p className="mt-2 text-sm text-red-600">Este campo es obligatorio</p>
                  )}
                </div>
              </div>

              <MemoizedSelect
                label="Tipo de Restaurante"
                id="restaurantType"
                value={formData.restaurantType}
                onChange={handleRestaurantTypeChange}
                options={restaurantTypeOptions}
              />

              {formData.restaurantType === 'other' && (
                <div className="animate-fadeIn">
                  <label htmlFor="otherRestaurantType" className="block text-sm font-medium text-gray-700 mb-1">
                    Especifica el tipo de restaurante
                  </label>
                  <input
                    type="text"
                    id="otherRestaurantType"
                    value={formData.otherRestaurantType}
                    onChange={(e) => handleFieldChange('otherRestaurantType', e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-400 focus:border-transparent transition duration-200 shadow-sm"
                    placeholder="Describe el tipo de restaurante"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8 transform transition-all duration-300 hover:shadow-2xl">
            <div className="space-y-6">
              <div className="flex-1">
                <label 
                  htmlFor="taxId" 
                  className="block text-sm font-medium text-gray-700 mb-1 flex items-center"
                >
                  Número de Identificación Fiscal (NIF/CIF)
                </label>
                <div className="relative">
                  <input
                    id="taxId"
                    type="text"
                    value={taxIdInput}
                    onChange={handleTaxIdChange}
                    className="block w-full px-4 py-3 rounded-lg border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 transition-colors duration-200"
                    placeholder="Ingresa el NIF/CIF de tu negocio"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  EIN Confirmation Letter: IRS approval letter for your company
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 transition-all duration-200 hover:border-orange-300"
                  onDragEnter={handleDragEnter}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  style={{
                    borderColor: isDragging ? '#f97316' : '',
                    backgroundColor: isDragging ? 'rgba(249, 115, 22, 0.05)' : ''
                  }}
                >
                  <div className="space-y-4 text-center">
                    <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                      <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4h-12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    
                    <div className="flex flex-col items-center">
                      <span className="text-orange-500 font-medium text-lg mb-2">EIN Confirmation Letter (IRS approval letter)</span>
                      <p className="text-sm text-gray-500 mb-2">PDF, DOC, DOCX, JPG, PNG hasta 10MB</p>
                      <input
                        type="file"
                        onChange={handleFileUpload}
                        className="relative block w-full min-w-0 flex-auto rounded-xl border border-gray-200 bg-white/95 px-4 py-3 text-base text-gray-700 transition-all duration-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:bg-gradient-to-r file:from-orange-400 file:to-pink-500 file:text-white hover:shadow-md focus:border-orange-400 focus:outline-none"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      />
                    </div>
                  </div>
                </div>
                {(formData?.legalDocuments || []).length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Documentos cargados:</h4>
                    <div className="bg-gray-50 rounded-xl p-3">
                      <ul className="text-sm text-gray-500 space-y-2">
                        {(formData?.legalDocuments || []).map((doc, index) => (
                          <li key={index} className="flex items-center justify-between bg-white p-3 rounded-lg shadow-sm">
                            <div className="flex items-center overflow-hidden">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span className="truncate max-w-xs">{doc.split('/').pop() || doc}</span>
                            </div>
                            <button 
                              onClick={async () => {
                                try {
                                  // Mostrar notificación
                                  setNotificationMessage("Eliminando documento...");
                                  setShowNotification(true);
                                  
                                  console.log(`Eliminando documento en índice ${index}`);
                                  
                                  // Obtener la lista actual de documentos
                                  const currentDocs = Array.isArray(formData?.legalDocuments) 
                                    ? [...formData.legalDocuments] 
                                    : [];
                                  
                                  console.log("Lista actual de documentos:", currentDocs);
                                  
                                  // Filtrar el documento a eliminar
                                  const updatedDocs = currentDocs.filter((_, i) => i !== index);
                                  
                                  console.log("Lista de documentos después de eliminar:", updatedDocs);
                                  
                                  // Actualizar nuestra referencia para rastrear la lista más reciente
                                  lastLegalDocsUpdateRef.current = updatedDocs;
                                  
                                  // Activar el bloqueo de sincronización para prevenir sobrescritura
                                  disableSyncAfterDocsUpdateRef.current = true;
                                  
                                  // Marcar que hay cambios sin guardar
                                  setHasFormChanged(true);
                                  
                                  // Comunicar al componente padre que hay cambios sin guardar
                                  if (window.onFormStateChange) {
                                    window.onFormStateChange(true);
                                  }
                                  
                                  // Actualizar el estado local inmediatamente para feedback visual
                                  setLocalFormData(prev => ({ 
                                    ...prev, 
                                    legalDocuments: updatedDocs 
                                  }));
                                  
                                  // Actualizar el campo legalDocuments sin el documento eliminado
                                  await updateField('legalDocuments', updatedDocs);
                                  console.log("Campo legalDocuments actualizado tras eliminación");
                                  
                                  // Guardar los cambios
                                  const saveResult = await saveFormData();
                                  console.log("Resultado de guardado tras eliminación:", saveResult ? "Éxito" : "Fallido");
                                  
                                  // Refrescar los datos, asegurando mantener la lista actualizada
                                  await refreshData();
                                  
                                  // Resetear el indicador de cambios sin guardar ya que se guardó correctamente
                                  setHasFormChanged(false);
                                  
                                  // Comunicar al componente padre que no hay cambios sin guardar
                                  if (window.onFormStateChange) {
                                    window.onFormStateChange(false);
                                  }
                                  
                                  // Mostrar notificación de éxito
                                  setNotificationMessage("Documento eliminado correctamente");
                                  setShowNotification(true);
                                  setTimeout(() => setShowNotification(false), 3000);
                                } catch (err) {
                                  console.error('Error al eliminar el documento:', err);
                                  setNotificationMessage("Error al eliminar el documento");
                                  setShowNotification(true);
                                  setTimeout(() => setShowNotification(false), 3000);
                                }
                              }}
                              className="text-red-500 hover:text-red-700 transition-colors duration-200"
                              aria-label="Eliminar documento"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 transform transition-all duration-300 hover:shadow-2xl mt-8">
          <div className="space-y-6">
            <div>
              <label htmlFor="locationCount" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                Cantidad de Ubicaciones
                <span className="text-red-500 ml-1">*</span>
              </label>
              <div className="relative mt-1">
                <input
                  type="text"
                  id="locationCount"
                  value={locationCountInput}
                  onChange={(e) => {
                    // Allow any input temporarily, including empty string
                    setLocationCountInput(e.target.value);
                    
                    // Only update formData when valid number is entered
                    const val = parseInt(e.target.value);
                    if (!isNaN(val) && val >= 1 && val <= 50) {
                      handleFieldChange('locationCount', val);
                    }
                  }}
                  onBlur={() => {
                    // Validate on blur
                    const val = parseInt(locationCountInput);
                    if (isNaN(val) || val < 1 || val > 50) {
                      // Reset to a valid value
                      const defaultValue = formData?.locationCount || 1;
                      setLocationCountInput(String(defaultValue));
                    }
                  }}
                  className={`block w-full px-4 py-3 rounded-lg border ${!locationCountInput || parseInt(locationCountInput) < 1 ? 'border-red-300 ring-1 ring-red-300' : 'border-gray-300'} shadow-sm focus:border-indigo-500 focus:ring-indigo-500 transition-colors duration-200`}
                  placeholder="Número de ubicaciones"
                />
                {(!locationCountInput || parseInt(locationCountInput) < 1) && (
                  <p className="mt-2 text-sm text-red-600">Este campo es obligatorio</p>
                )}
              </div>
            </div>

            {/* Mostrar checkbox solo si hay más de una ubicación */}
            {(formData?.locationCount || 1) > 1 && (
              <div className="mt-4 bg-orange-50 p-4 rounded-xl border border-orange-100 animate-fadeIn">
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={formData.sameMenuForAll}
                    onChange={(e) => handleFieldChange('sameMenuForAll', e.target.checked)}
                    className="h-5 w-5 rounded border-orange-300 text-orange-500 focus:ring-orange-400"
                  />
                  <span className="text-gray-700 font-medium">Mismo menú para todas las ubicaciones</span>
                </label>
              </div>
            )}
          </div>
        </div>

        {/* Sección de ubicaciones */}
        {(formData?.locationCount || 1) > 1 && (
          <div className="bg-white rounded-2xl shadow-xl p-8 transform transition-all duration-300 hover:shadow-2xl animate-fadeIn">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Ubicaciones</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(formData?.locations || []).map((location, index) => (
                <div 
                  key={index} 
                  className="p-5 border border-gray-200 rounded-xl transition-all duration-200 hover:border-orange-300 hover:shadow-md bg-gradient-to-br from-white to-gray-50 relative group"
                >
                  {/* Delete button that appears on hover */}
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => {
                        // Remove the location
                        const newLocations = [...(formData?.locations || [])];
                        newLocations.splice(index, 1);
                        
                        // Mark that there are unsaved changes
                        setHasFormChanged(true);
                        
                        // Notify parent component that there are unsaved changes
                        if (window.onFormStateChange) {
                          window.onFormStateChange(true);
                        }
                        
                        // Update locations and decrease location count
                        const newCount = Math.max(1, (formData?.locationCount || 1) - 1);
                        setLocalFormData(prev => ({
                          ...prev, 
                          locations: newLocations,
                          locationCount: newCount
                        }));
                        
                        // Update global form state
                        updateField('locations', newLocations);
                        updateField('locationCount', newCount);
                        
                        // Update the input display
                        setLocationCountInput(newCount.toString());
                      }}
                      className="h-6 w-6 rounded-full bg-red-500 text-white flex items-center justify-center shadow-sm hover:bg-red-600"
                      aria-label="Eliminar ubicación"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center">
                      <div className="bg-orange-100 text-orange-600 h-7 w-7 rounded-full flex items-center justify-center mr-2 font-medium text-sm">
                        {index + 1}
                      </div>
                      <label className="text-sm font-medium text-gray-700">
                        Ubicación {index + 1}
                      </label>
                    </div>
                    {location.nameConfirmed && (
                      <span className="text-xs bg-green-100 text-green-800 py-1 px-3 rounded-full font-medium animate-pulse">
                        Confirmado
                      </span>
                    )}
                  </div>
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={location.name}
                      onChange={(e) => handleLocationChange(index, e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-400 focus:border-transparent transition duration-200 shadow-sm"
                      placeholder={`Nombre de la ubicación ${index + 1}`}
                    />
                    {!location.nameConfirmed && (
                      <div className="flex justify-start">
                        <button
                          onClick={() => handleLocationConfirm(index)}
                          className="px-3 py-1.5 text-white bg-gradient-to-r from-orange-500 to-pink-500 rounded-xl hover:opacity-90 transition-all duration-300 shadow-sm hover:shadow-md"
                        >
                          Confirmar
                        </button>
                      </div>
                    )}
                  </div>
                  {locationErrors[index] && (
                    <p className="mt-2 text-sm text-red-600">
                      {locationErrors[index]}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sección de grupos (solo si hay más de una ubicación y no es el mismo menú para todos) */}
        {(formData?.locationCount || 1) > 1 && !formData?.sameMenuForAll && (
          <div className="animate-fadeIn">
            <div className="mb-2 flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-pink-600 mb-3">Grupos de Menús</h3>
              </div>
              {/* Contador de ubicaciones huérfanas */}
              {formData && !formData.sameMenuForAll && formData.locations && formData.locations.filter(loc => loc.nameConfirmed && isLocationOrphaned(loc.name)).length > 0 && (
                <div className="bg-amber-50 text-amber-800 px-4 py-2 rounded-lg border border-amber-200 flex items-center animate-pulse">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span className="text-sm font-medium">
                    {formData.locations.filter(loc => loc.nameConfirmed && isLocationOrphaned(loc.name)).length} ubicaciones sin asignar
                  </span>
                </div>
              )}
            </div>
            <button
              onClick={handleAddGroup}
              className="px-3 py-2 text-white bg-gradient-to-r from-orange-500 to-pink-500 rounded-lg hover:opacity-90 transition-all duration-300 shadow-sm flex items-center text-sm mb-4"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Agregar Grupo
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(formData?.groups || []).map((group, index) => (
                <div 
                  key={group.id} 
                  className={`relative rounded-2xl overflow-hidden shadow-lg transition-all duration-300 hover:shadow-2xl ${
                    addingGroupIndex === index ? 'animate-pulse' : ''
                  } ${
                    validationMessages.length > 0 && (!group.locations || group.locations.length === 0) && !newlyCreatedGroups.includes(group.id) ? 'ring-2 ring-amber-400 ring-offset-2' : ''
                  }`}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${gradientColors[index % gradientColors.length]} opacity-90`}></div>
                  <div className="relative p-6 z-10">
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <h4 className="text-xl font-bold text-white">{group.name}</h4>
                        {(!newlyCreatedGroups.includes(group.id)) && (validationMessages.length > 0) && (!group.locations || group.locations.length === 0) && (
                          <span className="inline-block mt-1 text-sm bg-white bg-opacity-20 text-white px-2 py-0.5 rounded-full flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Pendiente asignar ubicaciones
                          </span>
                        )}
                      </div>
                      {((formData?.groups || []).length > 2) && (
                        <button
                          onClick={() => {
                            const newGroups = [...(formData?.groups || [])];
                            newGroups.splice(index, 1);
                            handleFieldChange('groups', newGroups);
                          }}
                          className="text-white bg-white bg-opacity-20 h-8 w-8 rounded-full flex items-center justify-center hover:bg-opacity-30 transition-all"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                    
                    <div className="mt-4 mb-2">
                      <h5 className="text-white text-sm font-semibold mb-3 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Ubicaciones
                      </h5>
                      <div className="max-h-56 overflow-y-auto pr-1 space-y-2 custom-scrollbar">
                        {(formData?.locations || [])
                          .filter(location => location.nameConfirmed)
                          .map(location => (
                            <div key={location.name} className={`flex items-center space-x-2 bg-white ${
                              isLocationOrphaned(location.name) ? 'bg-opacity-30 border border-amber-300' : 'bg-opacity-20'
                            } rounded-lg p-3 hover:bg-opacity-30 transition-all`}>
                              <input
                                type="checkbox"
                                checked={group.locations.includes(location.name)}
                                onChange={(e) => {
                                  const newLocations = e.target.checked
                                    ? [...group.locations, location.name]
                                    : group.locations.filter(loc => loc !== location.name);
                                  handleGroupChange(index, 'locations', newLocations);
                                }}
                                className="h-4 w-4 rounded border-white text-orange-500 focus:ring-orange-400 bg-white bg-opacity-30"
                              />
                              <span className="text-white text-sm font-medium">{location.name}</span>
                              {isLocationOrphaned(location.name) && (
                                <span className="inline-flex items-center ml-auto">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-amber-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                  </svg>
                                </span>
                              )}
                            </div>
                          ))
                        }
                        {(formData?.locations || []).filter(location => location.nameConfirmed).length === 0 && (
                          <div className="text-white text-sm opacity-80 text-center py-2">
                            No hay ubicaciones confirmadas
                          </div>
                        )}
                        
                        {/* Mensaje informativo para grupos sin ubicaciones */}
                        {(formData?.locations || []).filter(location => location.nameConfirmed).length > 0 && 
                         (!group.locations || group.locations.length === 0) && (
                          <div className="bg-red-100 bg-opacity-25 border border-red-200 rounded-lg p-3 mt-2">
                            <p className="text-white text-sm">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline-block mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                              </svg>
                              Selecciona al menos una ubicación para este grupo
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <div className="flex items-center">
                        <span className="bg-white bg-opacity-30 text-white px-3 py-1 rounded-full text-xs font-medium">
                          {Array.isArray(group.locations) 
                            ? group.locations.filter(loc => {
                                // Solo contar ubicaciones que:
                                // 1. No son vacías
                                // 2. Existen realmente en la lista de ubicaciones confirmadas
                                const exists = (formData?.locations || [])
                                  .some(location => location.nameConfirmed && location.name === loc);
                                return loc && loc.trim() !== '' && exists;
                              }).length 
                            : 0
                          }
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {showGroupWarning && !formData?.sameMenuForAll && (formData?.groups || []).length < 2 && (
          <div className="mt-6 bg-orange-50 border-l-4 border-orange-500 p-4 rounded-r-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-orange-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-orange-700">
                  Debes tener al menos dos grupos cuando no uses el mismo menú para todas las ubicaciones.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Añadir más margen aquí para crear más espacio después de las tarjetas de grupos */}
        <div className="mb-12"></div>

        {/* Botones de navegación */}
        <div className="fixed bottom-0 left-0 right-0 bg-white shadow-lg z-30">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <div>
              {hasFormChanged ? (
                <div className="flex items-center space-x-2 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 px-4 py-2 rounded-lg border border-indigo-200 shadow-sm transform transition-all duration-300 hover:shadow-md relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 via-purple-500/5 to-pink-500/5 animate-pulse"></div>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-500 animate-spin-slow group-hover:text-purple-500 transition-colors duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="relative">
                    <span className="text-sm font-medium bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 group-hover:from-purple-500 group-hover:to-indigo-500 transition-all duration-300">
                      Cambios sin guardar
                    </span>
                    <span className="block text-xs text-indigo-400 group-hover:text-purple-400 transition-colors duration-300">
                      Recuerda guardar tus cambios
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center space-x-2 bg-gradient-to-r from-green-50 to-emerald-50 px-4 py-2 rounded-lg border border-green-200 transition-all duration-300 hover:shadow-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
                  </svg>
                  <div>
                    <span className="text-sm font-medium text-green-600">
                      Cambios guardados
                    </span>
                    <span className="block text-xs text-green-500">
                      Todo está al día
                    </span>
                  </div>
                </div>
              )}
            </div>
            <div className="flex space-x-4">
              <button
                onClick={handleSave}
                className={`px-8 py-3 rounded-full transition-all duration-200 ${
                  hasFormChanged 
                    ? "bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-md hover:opacity-90" 
                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                }`}
                disabled={!hasFormChanged || saveInProgress}
              >
                {saveInProgress 
                  ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Guardando...
                      </span>
                    ) 
                  : (hasFormChanged ? "Guardar cambios" : "Cambios guardados")
                }
              </button>
              <button
                onClick={handleNext}
                className="px-8 py-3 text-white bg-gradient-to-r from-orange-500 to-pink-500 rounded-full hover:opacity-90 transition-all duration-300 shadow-md flex items-center space-x-2"
                disabled={!legalBusinessNameInput || (!formData?.sameMenuForAll && (formData?.groups || []).length < 2)}
              >
                <span>Continuar</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
            </div>
          </div>
          
          {/* Mensajes de validación */}
          {validationMessages.length > 0 && (
            <div className="max-w-7xl mx-auto px-4 py-4 bg-red-50 rounded-t-xl border-t-2 border-red-500 shadow-inner animate-fadeIn">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-red-700">
                    No puedes continuar por los siguientes motivos:
                  </h3>
                  <ul className="mt-2 text-sm text-red-600 list-disc list-inside pl-2 space-y-1">
                    {validationMessages.map((message, index) => (
                      <li key={index}>{message}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {showNotification && (
        <Notification
          message={notificationMessage}
          onClose={() => setShowNotification(false)}
        />
      )}

      {showSavePrompt && <SavePrompt />}
    </div>
  );
};

export default LegalData 
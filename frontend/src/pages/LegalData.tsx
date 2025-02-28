import React, { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useFormProgress } from '../hooks/useFormProgress'
import { useTranslation } from '../hooks/useTranslation'

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

const LegalData = () => {
  const navigate = useNavigate()
  const { formData, updateField, saveFormData, uploadFile } = useFormProgress()
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

  // Agregar estado para manejar errores de ubicaciones
  const [locationErrors, setLocationErrors] = useState<{ [key: number]: string }>({});

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
    
    const hasChanges = Object.entries(formData).some(([key, value]) => {
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

    setLocalFormData(prev => ({
      ...prev,
      ...formData,
      locationCount,
      locations: updatedLocations
    }));

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

  // Modificar handleFieldChange para marcar cambios sin guardar
  const handleFieldChange = (
    fieldName: keyof FormState,
    value: any
  ) => {
    setHasFormChanged(true)
    // Comunicar al componente padre que hay cambios sin guardar
    if (window.onFormStateChange) {
      window.onFormStateChange(true)
    }
    
    setLocalFormData(prev => ({ ...prev, [fieldName]: value }))

    if (typeof value === 'string' && ['legalBusinessName', 'taxId', 'otherRestaurantType'].includes(fieldName)) {
      if ((window as any).fieldUpdateTimeout) {
        clearTimeout((window as any).fieldUpdateTimeout)
      }
      (window as any).fieldUpdateTimeout = setTimeout(() => {
        updateField(fieldName, value)
      }, 500)
      return
    }

    updateField(fieldName, value)
  }

  // Función para guardar los cambios
  const handleSave = useCallback(async () => {
    await saveFormData()
    setHasFormChanged(false)
    // Comunicar al componente padre que no hay cambios sin guardar
    if (window.onFormStateChange) {
      window.onFormStateChange(false)
    }
    setShowNotification(true)
    setTimeout(() => setShowNotification(false), 3000)
    return true // Indicar que el guardado fue exitoso
  }, [saveFormData, setHasFormChanged, setShowNotification])

  // Exponer la función handleSave a través de window.saveCurrentFormData
  useEffect(() => {
    window.saveCurrentFormData = handleSave
    
    return () => {
      delete window.saveCurrentFormData
    }
  }, [handleSave])

  // Manejar subida de archivos
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      try {
        setLocalFormData(prev => ({ ...prev, irsLetter: file }))
        const fileUrl = await uploadFile(file, 'legalDocuments')
        updateField('legalDocuments', [fileUrl])
      } catch (err) {
        console.error('Error al subir el archivo:', err)
      }
    }
  }

  // Optimizamos los inputs para evitar re-renders innecesarios
  const renderInput = (
    fieldName: keyof FormState,
    placeholder: string,
    label: string
  ) => (
    <div className="form-group">
      <label htmlFor={fieldName} className="form-label">
        {label}
      </label>
      <input
        type="text"
        id={fieldName}
        value={formData[fieldName] as string}
        onChange={(e) => handleFieldChange(fieldName, e.target.value)}
        className="input-field"
        placeholder={placeholder}
      />
    </div>
  );

  // Manejar cambios en las ubicaciones
  const handleLocationChange = (index: number, value: string) => {
    console.log('Modificando ubicación:', {
      index,
      newValue: value,
      currentLocation: (formData?.locations || [])[index]
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
    }

    newLocations[index].name = value;
    // Desconfirmar la ubicación si se cambia el nombre
    newLocations[index].nameConfirmed = false;
    
    setLocalFormData(prev => ({ ...prev, locations: newLocations }));
    
    if ((window as any).locationUpdateTimeout) {
      clearTimeout((window as any).locationUpdateTimeout);
    }
    (window as any).locationUpdateTimeout = setTimeout(() => {
      console.log('Actualizando ubicaciones en el estado global:', newLocations);
      updateField('locations', newLocations);
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
    
    setLocalFormData(prev => ({ ...prev, locations: newLocations }));
    updateField('locations', newLocations);
    setHasFormChanged(true);
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
    
    setLocalFormData(prev => ({ ...prev, groups: newGroups }))
    updateField('groups', newGroups)
  }

  // Generar nombre de grupo automáticamente
  const generateGroupName = (index: number) => {
    const names = ['Grupo A', 'Grupo B', 'Grupo C', 'Grupo D']
    return names[index] || `Grupo ${index + 1}`
  }

  // Función para manejar la navegación
  const handleNext = () => {
    // Verificar si hay ubicaciones con nombre pero sin confirmar
    const hasUnconfirmedLocations = (formData?.locations || []).some(
      location => location.name.trim() !== '' && !location.nameConfirmed
    );

    if (hasUnconfirmedLocations) {
      setLocationErrors(prev => ({
        ...prev,
        locations: 'Debes confirmar todas las ubicaciones antes de continuar'
      }));
      return;
    }

    // Verificar si se requieren grupos confirmados (cuando no se usa el mismo menú)
    if (!formData?.sameMenuForAll) {
      // Verificar que haya al menos 2 grupos
      if ((formData?.groups || []).length < 2) {
        // Replace alert with styled notification
        setNotificationMessage("Debes tener al menos dos grupos cuando no uses el mismo menú para todas las ubicaciones.");
        setShowNotification(true);
        setShowGroupWarning(true);
        setTimeout(() => setShowNotification(false), 5000);
        return;
      }
      
      // Verificar que todos los grupos tengan ubicaciones asignadas
      const emptyGroups = (formData?.groups || []).filter(group => group.locations.length === 0);
      if (emptyGroups.length > 0) {
        setNotificationMessage("Todos los grupos deben tener al menos una ubicación asignada.");
        setShowNotification(true);
        setTimeout(() => setShowNotification(false), 5000);
        return;
      }
      
      // Verificar que todos los grupos estén confirmados
      const unconfirmedGroups = (formData?.groups || []).filter(group => !group.nameConfirmed);
      if (unconfirmedGroups.length > 0) {
        setNotificationMessage("Debes confirmar todos los grupos antes de continuar.");
        setShowNotification(true);
        setTimeout(() => setShowNotification(false), 5000);
        return;
      }
    }

    // Resetear el error si no hay ubicaciones sin confirmar
    setLocationErrors({});
    setShowGroupWarning(false);

    if (hasFormChanged) {
      setShowSavePrompt(true)
    } else {
      navigate('/onboarding/contact-info')
    }
  }

  // Componente para el modal de confirmación
  const SavePrompt = () => {
    if (!showSavePrompt) return null

    // Verificar si hay ubicaciones con nombre pero sin confirmar
    const hasUnconfirmedLocations = (formData?.locations || []).some(
      location => location.name.trim() !== '' && !location.nameConfirmed
    );

    // Verificar si hay grupos sin confirmar cuando no se usa el mismo menú
    const hasUnconfirmedGroups = !formData?.sameMenuForAll && 
      (formData?.groups || []).some(group => !group.nameConfirmed && group.locations.length > 0);

    const handleContinueWithoutSaving = () => {
      if (hasUnconfirmedLocations) {
        setShowSavePrompt(false);
        setLocationErrors(prev => ({
          ...prev,
          locations: 'Debes confirmar todas las ubicaciones antes de continuar'
        }));
        setTimeout(() => setLocationErrors({}), 3000);
        return;
      }
      
      if (hasUnconfirmedGroups) {
        setShowSavePrompt(false);
        alert("Debes confirmar todos los grupos antes de continuar.");
        return;
      }
      
      setShowSavePrompt(false);
      navigate('/onboarding/contact-info');
    };

    const handleSaveAndContinue = async () => {
      if (hasUnconfirmedLocations) {
        setShowSavePrompt(false);
        setLocationErrors(prev => ({
          ...prev,
          locations: 'Debes confirmar todas las ubicaciones antes de continuar'
        }));
        setTimeout(() => setLocationErrors({}), 3000);
        return;
      }
      
      if (hasUnconfirmedGroups) {
        setShowSavePrompt(false);
        alert("Debes confirmar todos los grupos antes de continuar.");
        return;
      }
      
      const success = await handleSave();
      if (success) {
        setShowSavePrompt(false);
        navigate('/onboarding/contact-info');
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Cambios sin guardar
          </h3>
          <p className="text-gray-600 mb-6">
            Tienes cambios sin guardar. ¿Qué deseas hacer?
          </p>
          <div className="flex justify-end space-x-4">
            <button
              onClick={handleContinueWithoutSaving}
              className="btn-secondary"
            >
              Continuar sin guardar
            </button>
            <button
              onClick={handleSaveAndContinue}
              className="btn-primary"
            >
              Guardar y continuar
            </button>
          </div>
        </div>
      </div>
    )
  }

  const handleAddGroup = () => {
    setHasFormChanged(true);
    
    // Añadir logs para depuración
    console.log("Añadiendo nuevo grupo. Grupos actuales:", formData.groups);
    
    // Generar un ID único para el grupo
    const groupId = `group_${Date.now()}`;
    
    // Crear el nuevo grupo con todos los campos necesarios, marcándolo como NO confirmado inicialmente
    const newGroup = { 
      id: groupId, 
      name: generateGroupName((formData?.groups || []).length), 
      locations: [], 
      nameConfirmed: false  // Requerimos confirmación explícita
    };
    
    console.log("Nuevo grupo creado:", newGroup);
    
    // Actualizar el estado local
    const newGroups = [...(formData?.groups || []), newGroup];
    setLocalFormData(prev => ({ ...prev, groups: newGroups }));
    
    // Actualizar el estado global con los nuevos grupos
    console.log("Actualizando estado global con los nuevos grupos:", newGroups);
    updateField('groups', newGroups);
    
    // Guardar los cambios inmediatamente para asegurar que se persistan
    setTimeout(() => {
      saveFormData().then(() => {
        console.log("Cambios guardados después de añadir el grupo");
      });
    }, 500);
  }

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
              <div>
                <label htmlFor="legalBusinessName" className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre Legal del Negocio
                </label>
                <input
                  type="text"
                  id="legalBusinessName"
                  value={formData.legalBusinessName}
                  onChange={(e) => handleFieldChange('legalBusinessName', e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-400 focus:border-transparent transition duration-200 shadow-sm"
                  placeholder="Ingresa el nombre legal de tu negocio"
                />
              </div>

              <div>
                <label htmlFor="restaurantType" className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Restaurante
                </label>
                <div className="relative">
                  <select
                    id="restaurantType"
                    value={formData.restaurantType}
                    onChange={(e) => handleFieldChange('restaurantType', e.target.value)}
                    className="w-full appearance-none px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-400 focus:border-transparent transition duration-200 shadow-sm pr-10"
                  >
                    <option value="">Selecciona un tipo</option>
                    {restaurantTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                    </svg>
                  </div>
                </div>
                {validationErrors.restaurantType && (
                  <p className="mt-1 text-sm text-red-600">
                    {validationErrors.restaurantType}
                  </p>
                )}
              </div>

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
              <div>
                <label htmlFor="taxId" className="block text-sm font-medium text-gray-700 mb-1">
                  EIN Number
                </label>
                <input
                  type="text"
                  id="taxId"
                  value={formData.taxId}
                  onChange={(e) => handleFieldChange('taxId', e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-400 focus:border-transparent transition duration-200 shadow-sm"
                  placeholder="Ingresa tu EIN Number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  EIN Confirmation Letter: IRS approval letter for your company
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 transition-all duration-200 hover:border-orange-300">
                  <div className="space-y-4 text-center">
                    <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                      <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4h-12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    
                    <div className="flex flex-col items-center">
                      <span className="text-orange-500 font-medium text-lg mb-2">Subir EIN Letter</span>
                      <p className="text-sm text-gray-500 mb-2">o arrastra y suelta</p>
                      <p className="text-xs text-gray-400">PDF, DOC, DOCX hasta 10MB</p>
                      <label
                        htmlFor="file-upload"
                        className="cursor-pointer bg-gradient-to-r from-orange-400 to-pink-500 mt-3 inline-block px-4 py-2 rounded-lg text-white shadow-sm hover:shadow-md transition-all duration-200"
                      >
                        Seleccionar Archivo
                        <input
                          id="file-upload"
                          name="file-upload"
                          type="file"
                          className="sr-only"
                          onChange={handleFileUpload}
                          accept=".pdf,.doc,.docx"
                        />
                      </label>
                    </div>
                  </div>
                </div>
                {(formData?.legalDocuments || []).length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Documentos cargados:</h4>
                    <div className="bg-gray-50 rounded-xl p-3">
                      <ul className="text-sm text-gray-500 space-y-2">
                        {(formData?.legalDocuments || []).map((doc, index) => (
                          <li key={index} className="flex items-center bg-white p-2 rounded-lg shadow-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="truncate">{doc}</span>
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
              <label htmlFor="locationCount" className="block text-sm font-medium text-gray-700 mb-1">
                Cantidad de Ubicaciones
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
                    // Validate and correct on blur
                    let val = parseInt(locationCountInput);
                    if (isNaN(val) || val < 1) {
                      val = 1;
                    } else if (val > 50) {
                      val = 50;
                    }
                    setLocationCountInput(val.toString());
                    handleFieldChange('locationCount', val);
                  }}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-400 focus:border-transparent transition duration-200 shadow-sm"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-8">
                  <span className="text-gray-400 text-sm">ubicaciones</span>
                </div>
              </div>
              {validationErrors.locationCount && (
                <p className="mt-1 text-sm text-red-600">
                  {validationErrors.locationCount}
                </p>
              )}
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
                          className="px-3 py-1.5 text-sm text-white bg-gradient-to-r from-orange-500 to-pink-500 rounded-xl hover:opacity-90 transition-all duration-300 shadow-sm hover:shadow-md"
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
            <div className="mb-2">
              <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-pink-600 mb-3">Grupos de Menús</h3>
              <button
                onClick={handleAddGroup}
                className="px-3 py-2 text-white bg-gradient-to-r from-orange-500 to-pink-500 rounded-lg hover:opacity-90 transition-all duration-300 shadow-sm flex items-center text-sm mb-4"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Agregar Grupo
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(formData?.groups || []).map((group, index) => (
                <div 
                  key={group.id} 
                  className="relative rounded-2xl overflow-hidden shadow-lg transition-all duration-300 hover:shadow-2xl hover:scale-105"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${gradientColors[index % gradientColors.length]} opacity-90`}></div>
                  <div className="relative p-6 z-10">
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <h4 className="text-xl font-bold text-white">{group.name}</h4>
                        {!group.nameConfirmed && (
                          <button 
                            onClick={() => handleGroupChange(index, 'nameConfirmed', true)}
                            className="text-xs text-white bg-white bg-opacity-20 px-2 py-1 rounded-lg mt-1 hover:bg-opacity-30 transition-all">
                            Confirmar nombre
                          </button>
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
                            <div key={location.name} className="flex items-center space-x-2 bg-white bg-opacity-20 rounded-lg p-3 hover:bg-opacity-30 transition-all">
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
                            </div>
                          ))
                        }
                        {(formData?.locations || []).filter(location => location.nameConfirmed).length === 0 && (
                          <div className="text-white text-sm opacity-80 text-center py-2">
                            No hay ubicaciones confirmadas
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
                disabled={!hasFormChanged}
              >
                {hasFormChanged ? "Guardar cambios" : "Cambios guardados"}
              </button>
              <button
                onClick={handleNext}
                className="px-8 py-3 text-white bg-gradient-to-r from-orange-500 to-pink-500 rounded-full hover:opacity-90 transition-all duration-300 shadow-md"
                disabled={
                  !formData.legalBusinessName || 
                  !formData.taxId || 
                  (!formData.sameMenuForAll && (formData.groups || []).length < 2)
                }
              >
                Continuar
              </button>
            </div>
          </div>
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
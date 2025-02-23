import React, { useEffect, useState } from 'react'
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

// Componente de notificación personalizado
const Notification = ({ message, onClose }: { message: string; onClose: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-4 right-4 z-50 animate-fade-in">
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 flex items-center space-x-3">
        <div className="flex-shrink-0">
          <div className="w-8 h-8 rounded-full bg-gradient-brand flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
        <p className="text-gray-800">{message}</p>
        <button
          onClick={onClose}
          className="flex-shrink-0 text-gray-400 hover:text-gray-600"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};

const LegalData = () => {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { formData, updateField, updateFormData, uploadFile, saveFormData } = useFormProgress()
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [showSavePrompt, setShowSavePrompt] = useState(false)
  const [showNotification, setShowNotification] = useState(false)
  const [localData, setLocalData] = useState<FormState>({
    businessName: formData.businessName || '',
    legalBusinessName: formData.legalBusinessName || '',
    restaurantType: formData.restaurantType || '',
    otherRestaurantType: formData.otherRestaurantType || '',
    taxId: formData.taxId || '',
    irsLetter: formData.irsLetter || null,
    legalDocuments: formData.legalDocuments || [],
    locationCount: formData.locationCount || 1,
    sameMenuForAll: formData.sameMenuForAll ?? true,
    locations: formData.locations || [{ name: '', nameConfirmed: false }],
    groups: formData.groups || []
  })

  // Agregar estado para manejar errores de ubicaciones
  const [locationErrors, setLocationErrors] = useState<{ [key: number]: string }>({});

  // Función para verificar si un nombre de ubicación está duplicado
  const isDuplicateLocationName = (name: string, currentIndex: number): boolean => {
    return localData.locations.some(
      (location, index) => 
        index !== currentIndex && 
        location.name.trim().toLowerCase() === name.trim().toLowerCase()
    );
  };

  // Optimizamos el useEffect para que solo actualice cuando realmente cambie formData
  useEffect(() => {
    if (!formData) return;
    
    const hasChanges = Object.entries(formData).some(([key, value]) => {
      // Para las ubicaciones, necesitamos una comparación más profunda
      if (key === 'locations') {
        const currentLocations = localData.locations || [];
        const newLocations = value as Location[] || [];
        return JSON.stringify(currentLocations) !== JSON.stringify(newLocations);
      }
      // Para los grupos, también necesitamos una comparación más profunda
      if (key === 'groups') {
        const currentGroups = localData.groups || [];
        const newGroups = value as Group[] || [];
        return JSON.stringify(currentGroups) !== JSON.stringify(newGroups);
      }
      return localData[key as keyof FormState] !== value;
    });

    if (!hasChanges) return;

    const locationCount = typeof formData.locationCount === 'number' ? formData.locationCount : 1;
    setLocalData(prev => ({
      ...prev,
      ...formData,
      locationCount,
      locations: formData.locations || Array(locationCount).fill(null).map(() => ({ name: '', nameConfirmed: false }))
    }));

    // Resetear el estado de cambios sin guardar cuando se actualiza desde formData
    setHasUnsavedChanges(false);
  }, [formData]);

  // Función para guardar los cambios
  const handleSave = async () => {
    await saveFormData()
    setHasUnsavedChanges(false)
    setShowNotification(true)
    setTimeout(() => setShowNotification(false), 3000)
  }

  // Modificar handleFieldChange para marcar cambios sin guardar
  const handleFieldChange = (
    fieldName: keyof FormState,
    value: any
  ) => {
    setHasUnsavedChanges(true)
    setLocalData(prev => ({ ...prev, [fieldName]: value }))

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

  // Manejar subida de archivos
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      try {
        setLocalData(prev => ({ ...prev, irsLetter: file }))
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
        value={localData[fieldName] as string}
        onChange={(e) => handleFieldChange(fieldName, e.target.value)}
        className="input-field"
        placeholder={placeholder}
      />
    </div>
  );

  // Manejar cambios en las ubicaciones
  const handleLocationChange = (index: number, value: string) => {
    const newLocations = [...localData.locations];
    if (!newLocations[index]) {
      newLocations[index] = { name: '', nameConfirmed: false };
    }

    // Verificar duplicados
    if (value.trim() !== '' && isDuplicateLocationName(value, index)) {
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
      setHasUnsavedChanges(true);
    }

    newLocations[index].name = value;
    setLocalData(prev => ({ ...prev, locations: newLocations }));
    
    if ((window as any).locationUpdateTimeout) {
      clearTimeout((window as any).locationUpdateTimeout);
    }
    (window as any).locationUpdateTimeout = setTimeout(() => {
      updateField('locations', newLocations);
    }, 500);
  };

  // Manejar confirmación de nombres de ubicación
  const handleLocationConfirm = (index: number) => {
    // No permitir confirmar si hay un error
    if (locationErrors[index]) {
      return;
    }

    const newLocations = [...localData.locations];
    // Marcar que hay cambios sin guardar si estamos confirmando una ubicación
    if (!newLocations[index].nameConfirmed) {
      setHasUnsavedChanges(true);
    }
    newLocations[index].nameConfirmed = true;
    setLocalData(prev => ({ ...prev, locations: newLocations }));
    updateField('locations', newLocations);
  };

  // Manejar cambios en grupos
  const handleGroupChange = (index: number, field: keyof Group, value: any) => {
    const newGroups = [...localData.groups]
    if (!newGroups[index]) {
      newGroups[index] = { id: Date.now().toString(), name: '', locations: [] }
    }

    if (field === 'locations') {
      const locationName = value[value.length - 1] // La ubicación que se está agregando/quitando
      const isAdding = newGroups[index].locations.length < value.length // true si estamos agregando, false si estamos quitando

      if (isAdding) {
        // Remover la ubicación de otros grupos
        newGroups.forEach((group, i) => {
          if (i !== index) {
            group.locations = group.locations.filter(loc => loc !== locationName)
          }
        })
      }
    }

    // Marcar que hay cambios sin guardar cuando se modifican los grupos
    setHasUnsavedChanges(true);
    newGroups[index][field] = value
    setLocalData(prev => ({ ...prev, groups: newGroups }))
    updateField('groups', newGroups)
  }

  // Generar nombre de grupo automáticamente
  const generateGroupName = (index: number) => {
    const names = ['Grupo A', 'Grupo B', 'Grupo C', 'Grupo D']
    return names[index] || `Grupo ${index + 1}`
  }

  // Función para manejar la navegación
  const handleNext = () => {
    if (hasUnsavedChanges) {
      setShowSavePrompt(true)
    } else {
      navigate('/onboarding/contact-info')
    }
  }

  // Componente para el modal de confirmación
  const SavePrompt = () => {
    if (!showSavePrompt) return null

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
              onClick={() => {
                setShowSavePrompt(false)
                navigate('/onboarding/contact-info')
              }}
              className="btn-secondary"
            >
              Continuar sin guardar
            </button>
            <button
              onClick={async () => {
                await handleSave()
                setShowSavePrompt(false)
                navigate('/onboarding/contact-info')
              }}
              className="btn-primary"
            >
              Guardar y continuar
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {showNotification && (
        <Notification
          message="Los cambios han sido guardados correctamente"
          onClose={() => setShowNotification(false)}
        />
      )}
      <SavePrompt />
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Datos Legales</h2>
        <p className="text-gray-600">
          Por favor, ingresa los datos legales de tu negocio.
        </p>
      </div>

      <div className="form-section">
        {renderInput(
          'legalBusinessName',
          'Ingresa el nombre legal de tu negocio',
          'Nombre Legal del Negocio'
        )}

        <div className="form-group">
          <label htmlFor="restaurantType" className="form-label">
            Tipo de Restaurante
          </label>
          <select
            id="restaurantType"
            value={localData.restaurantType}
            onChange={(e) => handleFieldChange('restaurantType', e.target.value)}
            className="select-brand"
          >
            <option value="">Selecciona un tipo</option>
            {restaurantTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        {localData.restaurantType === 'other' && 
          renderInput(
            'otherRestaurantType',
            'Describe el tipo de restaurante',
            'Especifica el tipo de restaurante'
          )
        }

        {renderInput(
          'taxId',
          'Ingresa tu EIN Number',
          'EIN Number'
        )}

        <div className="form-group">
          <label className="form-label">
            EIN Confirmation Letter: IRS approval letter for your company
          </label>
          <div className="mt-1">
            <div className="flex items-center justify-center w-full">
              <label
                htmlFor="file-upload"
                className="file-upload-field"
              >
                <span className="text-brand-purple">Subir EIN Letter</span>
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
          {formData.legalDocuments && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-900">Documentos cargados:</h4>
              <ul className="mt-2 text-sm text-gray-500">
                {formData.legalDocuments.map((doc, index) => (
                  <li key={index} className="py-1">{doc}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="locationCount" className="form-label">
            Cantidad de Ubicaciones
          </label>
          <input
            type="number"
            id="locationCount"
            min="1"
            max="50"
            value={localData.locationCount}
            onChange={(e) => {
              const val = parseInt(e.target.value);
              if (!isNaN(val) && val >= 1 && val <= 50) {
                setLocalData(prev => ({
                  ...prev,
                  locationCount: val
                }));
                
                clearTimeout((window as any).locationUpdateTimeout);
                (window as any).locationUpdateTimeout = setTimeout(() => {
                  handleFieldChange('locationCount', val);
                }, 300);
              }
            }}
            className="input-field"
          />
        </div>

        {localData.locationCount > 1 && (
          <div className="form-group">
            <label className="form-label flex items-center space-x-3">
              <input
                type="checkbox"
                checked={localData.sameMenuForAll}
                onChange={(e) => handleFieldChange('sameMenuForAll', e.target.checked)}
                className="checkbox-brand"
              />
              <span>Mismo menú para todas las ubicaciones</span>
            </label>
            {!localData.sameMenuForAll && (
              <div className="mt-2 pl-8 space-y-1">
                <p className="text-sm text-red-600">
                  Debes tener al menos dos grupos cuando no uses el mismo menú para todas las ubicaciones.
                </p>
                <p className="text-sm text-gray-600">
                  Puedes configurar la cantidad de grupos en la sección siguiente.
                </p>
              </div>
            )}
          </div>
        )}

        {Array.from({ length: localData.locationCount }).map((_, index) => (
          <div key={index} className="form-group">
            <label className="form-label">
              Nombre de la Ubicación {index + 1}
            </label>
            <div className="space-y-2">
              <div className="flex space-x-3">
                <input
                  type="text"
                  value={localData.locations[index]?.name || ''}
                  onChange={(e) => handleLocationChange(index, e.target.value)}
                  className={`input-field ${locationErrors[index] ? 'ring-red-500' : ''}`}
                  placeholder={`Nombre de la ubicación ${index + 1}`}
                />
                {!localData.locations[index]?.nameConfirmed && (
                  <button
                    onClick={() => handleLocationConfirm(index)}
                    className="btn-secondary whitespace-nowrap"
                    disabled={!!locationErrors[index] || !localData.locations[index]?.name.trim()}
                  >
                    Confirmar
                  </button>
                )}
              </div>
              {locationErrors[index] && (
                <p className="text-sm text-red-600">
                  {locationErrors[index]}
                </p>
              )}
            </div>
          </div>
        ))}

        {localData.locationCount > 1 && !localData.sameMenuForAll && (
          <div className="space-y-6">
            <div className="space-y-2">
              <h3 className="text-lg font-medium text-gray-900">Grupos de Ubicaciones</h3>
              <p className="text-sm text-gray-600">
                Aquí puedes agrupar las ubicaciones que comparten el mismo menú. Esto te permitirá configurar los menús de forma más eficiente, 
                ya que todas las ubicaciones dentro de un mismo grupo compartirán la misma configuración de menú.
              </p>
            </div>
            <button
              onClick={() => {
                const newGroups = [
                  ...localData.groups, 
                  { 
                    id: Date.now().toString(), 
                    name: generateGroupName(localData.groups.length), 
                    locations: [] 
                  }
                ]
                setLocalData(prev => ({ ...prev, groups: newGroups }))
                updateField('groups', newGroups)
              }}
              className="btn-secondary mb-4"
            >
              Agregar Grupo
            </button>

            {localData.groups.map((group, index) => (
              <div key={group.id} className="card">
                <div className="flex justify-between items-center mb-4">
                  <div className="text-lg font-medium text-gray-900">{generateGroupName(index)}</div>
                  {localData.groups.length > 2 && (
                    <button
                      onClick={() => {
                        const newGroups = localData.groups.filter((_, i) => i !== index);
                        setLocalData(prev => ({ ...prev, groups: newGroups }));
                        updateField('groups', newGroups);
                      }}
                      className="text-red-600 hover:text-red-800 transition-colors duration-200"
                    >
                      Eliminar grupo
                    </button>
                  )}
                </div>
                <div className="space-y-3">
                  <label className="form-label">Ubicaciones en este grupo</label>
                  {localData.locations
                    .filter(location => location.name.trim() !== '') // Solo mostramos ubicaciones con nombre
                    .map((location) => (
                    <div key={location.name} className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={group.locations.includes(location.name)}
                        onChange={(e) => {
                          const newLocations = e.target.checked
                            ? [...group.locations, location.name]
                            : group.locations.filter(loc => loc !== location.name)
                          handleGroupChange(index, 'locations', newLocations)
                        }}
                        className="checkbox-brand"
                      />
                      <span>{location.name}</span>
                    </div>
                  ))}
                  {localData.locations.filter(location => location.name.trim() !== '').length === 0 && (
                    <p className="text-sm text-gray-500 italic">
                      No hay ubicaciones confirmadas disponibles
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-between space-x-4">
        <button
          type="button"
          onClick={handleSave}
          className={hasUnsavedChanges ? 'btn-unsaved' : 'btn-saved'}
          disabled={!hasUnsavedChanges}
        >
          {hasUnsavedChanges ? 'Guardar cambios' : 'Cambios guardados'}
        </button>
        <div className="flex space-x-4">
          <button
            type="button"
            onClick={handleNext}
            className="btn-primary"
          >
            {t('continue')}
          </button>
        </div>
      </div>
    </div>
  )
}

export default LegalData 
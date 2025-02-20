import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from '../lib/FormContext'
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
  legalBusinessName: string
  restaurantType: string
  otherRestaurantType: string
  taxId: string
  irsLetter: File | null
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

const LegalData = () => {
  const navigate = useNavigate()
  const { formData, saveField, loading, error } = useForm()
  const [localData, setLocalData] = useState<FormState>({
    legalBusinessName: '',
    restaurantType: '',
    otherRestaurantType: '',
    taxId: '',
    irsLetter: null,
    locationCount: 1,
    sameMenuForAll: true,
    locations: [],
    groups: []
  })
  const { t } = useTranslation()

  // Cargar datos existentes
  useEffect(() => {
    if (formData) {
      const locationCount = typeof formData.locationCount === 'number' ? formData.locationCount : 1;
      setLocalData(prev => ({
        ...prev,
        legalBusinessName: formData.businessName || '',
        taxId: formData.taxId || '',
        restaurantType: formData.restaurantType || '',
        otherRestaurantType: formData.otherRestaurantType || '',
        locationCount: locationCount,
        sameMenuForAll: formData.sameMenuForAll ?? true,
        locations: formData.locations || Array(locationCount).fill(null).map(() => ({ name: '', nameConfirmed: false })),
        groups: formData.groups || []
      }))
    }
  }, [formData])

  // Manejar cambios en los campos con debounce
  const handleFieldChange = async (
    fieldName: keyof FormState,
    value: any
  ) => {
    if (fieldName === 'locationCount') {
      const newValue = parseInt(value);
      if (isNaN(newValue) || newValue < 1 || newValue > 50) return;

      // Primero actualizamos el estado local
      const updatedLocations = newValue === 1 
        ? localData.locations.slice(0, 1).map(loc => ({ ...loc, groupId: undefined }))
        : [
            ...localData.locations.slice(0, newValue),
            ...Array(Math.max(0, newValue - localData.locations.length))
              .fill(null)
              .map(() => ({ name: '', nameConfirmed: false }))
          ];

      const updatedData = {
        ...localData,
        locationCount: newValue,
        locations: updatedLocations,
        ...(newValue === 1 ? {
          sameMenuForAll: true,
          groups: []
        } : {})
      };

      // Actualizamos el estado local inmediatamente
      setLocalData(updatedData);

      try {
        // Guardamos en Firebase de manera atómica
        await Promise.all([
          saveField('locationCount', newValue),
          saveField('locations', updatedLocations),
          ...(newValue === 1 ? [
            saveField('sameMenuForAll', true),
            saveField('groups', [])
          ] : [])
        ]);
      } catch (error) {
        console.error('Error al guardar los cambios:', error);
        // Revertir cambios locales si hay error
        setLocalData(localData);
      }
    } else if (fieldName === 'sameMenuForAll' && value === false) {
      // Si se desmarca "mismo menú para todas", crear dos grupos por defecto
      const defaultGroups = [
        { 
          id: Date.now().toString(), 
          name: generateGroupName(0), 
          locations: [] 
        },
        { 
          id: (Date.now() + 1).toString(), 
          name: generateGroupName(1), 
          locations: [] 
        }
      ];
      setLocalData(prev => ({ 
        ...prev, 
        [fieldName]: value,
        groups: defaultGroups
      }));
      await saveField('groups', defaultGroups);
      await saveField('sameMenuForAll', value);
    } else {
      setLocalData(prev => ({ ...prev, [fieldName]: value }));
      
      // Guardar después de 500ms de inactividad
      const timeoutId = setTimeout(() => {
        saveField(fieldName, value);
      }, 500);

      return () => clearTimeout(timeoutId);
    }
  }

  // Manejar subida de archivos
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      try {
        setLocalData(prev => ({ ...prev, irsLetter: file }))
        await saveField('legalDocuments', [file.name], file)
      } catch (err) {
        console.error('Error al subir el archivo:', err)
      }
    }
  }

  // Manejar cambios en las ubicaciones
  const handleLocationChange = (index: number, value: string) => {
    const newLocations = [...localData.locations]
    if (!newLocations[index]) {
      newLocations[index] = { name: '', nameConfirmed: false }
    }
    newLocations[index].name = value
    setLocalData(prev => ({ ...prev, locations: newLocations }))
    saveField('locations', newLocations)
  }

  // Manejar confirmación de nombres de ubicación
  const handleLocationConfirm = (index: number) => {
    const newLocations = [...localData.locations]
    newLocations[index].nameConfirmed = true
    setLocalData(prev => ({ ...prev, locations: newLocations }))
    saveField('locations', newLocations)
  }

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

    newGroups[index][field] = value
    setLocalData(prev => ({ ...prev, groups: newGroups }))
    saveField('groups', newGroups)
  }

  // Generar nombre de grupo automáticamente
  const generateGroupName = (index: number) => {
    const numbers = ['Primer', 'Segundo', 'Tercer', 'Cuarto', 'Quinto', 'Sexto', 'Séptimo', 'Octavo', 'Noveno', 'Décimo']
    return `${numbers[index] || `Grupo ${index + 1}`} grupo`
  }

  const handleNext = () => {
    navigate('/onboarding/contact-info')
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-purple"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Datos Legales</h2>
        <p className="text-gray-600 mb-6">
          Por favor, ingresa los datos legales de tu negocio.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label htmlFor="legalBusinessName" className="form-label">
            Nombre Legal del Negocio
          </label>
          <input
            type="text"
            id="legalBusinessName"
            value={localData.legalBusinessName}
            onChange={(e) => handleFieldChange('legalBusinessName', e.target.value)}
            className="input-field"
            placeholder="Ingresa el nombre legal de tu negocio"
          />
        </div>

        <div>
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

        {localData.restaurantType === 'other' && (
          <div>
            <label htmlFor="otherRestaurantType" className="form-label">
              Especifica el tipo de restaurante
            </label>
            <input
              type="text"
              id="otherRestaurantType"
              value={localData.otherRestaurantType}
              onChange={(e) => handleFieldChange('otherRestaurantType', e.target.value)}
              className="input-field"
              placeholder="Describe el tipo de restaurante"
            />
          </div>
        )}

        <div>
          <label htmlFor="taxId" className="form-label">
            EIN Number
          </label>
          <input
            type="text"
            id="taxId"
            value={localData.taxId}
            onChange={(e) => handleFieldChange('taxId', e.target.value)}
            className="input-field"
            placeholder="Ingresa tu EIN Number"
          />
        </div>

        <div>
          <label className="form-label">
            EIN Letter (opcional)
          </label>
          <div className="mt-1">
            <div className="flex items-center justify-center w-full">
              <label
                htmlFor="file-upload"
                className="w-full flex flex-col items-center px-4 py-6 border-2 border-gray-300 border-dashed rounded-md cursor-pointer hover:border-brand-purple"
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
            <div className="mt-2">
              <h4 className="text-sm font-medium text-gray-900">Documentos cargados:</h4>
              <ul className="mt-1 text-sm text-gray-500">
                {formData.legalDocuments.map((doc, index) => (
                  <li key={index}>{doc}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div>
          <label htmlFor="locationCount" className="form-label">
            Número de Ubicaciones
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
                // Actualizar el estado local inmediatamente para mejor respuesta UI
                setLocalData(prev => ({
                  ...prev,
                  locationCount: val
                }));
                
                // Usar setTimeout para dar tiempo a que el usuario termine de ajustar
                clearTimeout((window as any).locationUpdateTimeout);
                (window as any).locationUpdateTimeout = setTimeout(() => {
                  handleFieldChange('locationCount', val);
                }, 300);
              }
            }}
            onBlur={(e) => {
              const val = parseInt(e.target.value);
              if (!isNaN(val) && val >= 1 && val <= 50) {
                handleFieldChange('locationCount', val);
              }
            }}
            className="input-field"
          />
        </div>

        {/* Mostrar checkbox solo si hay más de una ubicación */}
        {localData.locationCount > 1 && (
          <div>
            <label className="form-label flex items-center space-x-2">
              <input
                type="checkbox"
                checked={localData.sameMenuForAll}
                onChange={(e) => handleFieldChange('sameMenuForAll', e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-brand-purple focus:ring-brand-orange checked:bg-gradient-brand-reverse"
              />
              <span>Mismo menú para todas las ubicaciones</span>
            </label>
          </div>
        )}

        {/* Sección de ubicaciones */}
        {Array.from({ length: localData.locationCount }).map((_, index) => (
          <div key={index} className="space-y-2">
            <label className="form-label">
              Nombre de la Ubicación {index + 1}
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={localData.locations[index]?.name || ''}
                onChange={(e) => handleLocationChange(index, e.target.value)}
                className="input-field"
                placeholder={`Nombre de la ubicación ${index + 1}`}
              />
              {!localData.locations[index]?.nameConfirmed && (
                <button
                  onClick={() => handleLocationConfirm(index)}
                  className="btn-secondary whitespace-nowrap"
                >
                  Confirmar
                </button>
              )}
            </div>
          </div>
        ))}

        {/* Sección de grupos (solo si hay más de una ubicación y no es el mismo menú para todos) */}
        {localData.locationCount > 1 && !localData.sameMenuForAll && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Grupos de Ubicaciones</h3>
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
                saveField('groups', newGroups)
              }}
              className="btn-secondary"
            >
              Agregar Grupo
            </button>

            {localData.groups.map((group, index) => (
              <div key={group.id} className="card space-y-4">
                <div className="flex justify-between items-center">
                  <div className="text-lg font-medium text-gray-900">{generateGroupName(index)}</div>
                  {localData.groups.length > 2 && (
                    <button
                      onClick={() => {
                        const newGroups = localData.groups.filter((_, i) => i !== index);
                        setLocalData(prev => ({ ...prev, groups: newGroups }));
                        saveField('groups', newGroups);
                      }}
                      className="text-red-600 hover:text-red-800 transition-colors duration-200"
                    >
                      Eliminar grupo
                    </button>
                  )}
                </div>
                <div>
                  <label className="form-label">Ubicaciones en este grupo</label>
                  {localData.locations.map((location) => (
                    <div key={location.name} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={group.locations.includes(location.name)}
                        onChange={(e) => {
                          const newLocations = e.target.checked
                            ? [...group.locations, location.name]
                            : group.locations.filter(loc => loc !== location.name)
                          handleGroupChange(index, 'locations', newLocations)
                        }}
                        className="h-4 w-4 rounded border-gray-300 text-brand-purple focus:ring-brand-orange checked:bg-gradient-brand-reverse"
                      />
                      <span>{location.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-end mt-8">
        <button
          onClick={handleNext}
          className="btn-primary"
          disabled={
            !localData.legalBusinessName || 
            !localData.taxId || 
            (!localData.sameMenuForAll && localData.groups.length < 2)
          }
        >
          Siguiente
        </button>
      </div>

      {!localData.sameMenuForAll && localData.groups.length < 2 && (
        <p className="text-red-600 text-sm mt-2">
          Debes tener al menos dos grupos cuando no uses el mismo menú para todas las ubicaciones.
        </p>
      )}
    </div>
  )
}

export default LegalData 
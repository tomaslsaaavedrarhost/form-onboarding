import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Field, Form, Formik, FormikProps } from 'formik';
import * as Yup from 'yup';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { useTranslation } from '../hooks/useTranslation';
import { useFormProgress } from '../hooks/useFormProgress';
import { useForm } from '../lib/FormContext';
import SectionTitle from '../components/ui/SectionTitle';
import Notification from '../components/ui/Notification';
import { BasicLocationDetail } from '../types/location';

// Declaraciones globales
declare global {
  interface Window {
    onFormStateChange?: (hasChanges: boolean) => void;
    saveCurrentFormData?: () => Promise<boolean>;
  }
}

// Interfaces básicas
interface ParkingDetails {
  hasParking: boolean;
  parkingType: string | undefined;
  pricingDetails: string;
  location: string;
}

interface TimeSlot {
  start: string;
  end: string;
  type: string;
  kitchenClosingTime?: string | null;
}

interface DaySchedule {
  enabled: boolean;
  timeSlots: TimeSlot[];
}

interface WeeklySchedule {
  [key: string]: DaySchedule;
}

interface ReservationSettings {
  acceptsReservations: boolean;
  platform: string;
  reservationLink: string;
  phoneCarrier: string;
  gracePeriod: number;
  parking: ParkingDetails;
  schedule: WeeklySchedule;
}

interface LocationDetail {
  locationId: string;
  // Agregar otros campos básicos que sean necesarios
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  reservationSettings: ReservationSettings;
  selectedLocationName: string;
  // Agregar campos para delivery y gestión de reclamos
  deliverySettings: {
    platforms: string[];
    preferredPlatform: string;
    preferredPlatformLink: string;
    deliveryInstructions: string;
    deliveryRadius: string;
    minimumOrderAmount: string;
    claimsHandling: {
      handledBy: string; // 'platform', 'restaurant', 'depends'
      restaurantHandledCases: string[];
      additionalDetails: string;
    };
  };
}

export interface ExtendedLocationDetail extends BasicLocationDetail {
  // Ya no necesitamos redefinir selectedLocationName aquí porque está en BasicLocationDetail
}

interface FormValues {
  locationDetails: ExtendedLocationDetail[];
}

// Interfaz para la ubicación en formData.locations
interface Location {
  name: string;
  nameConfirmed: boolean;
  groupId?: string;
}

// Función para crear una ubicación vacía
const createEmptyLocation = (): LocationDetail => {
  return {
    locationId: '',
    name: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    selectedLocationName: '',
    reservationSettings: {
      acceptsReservations: false,
      platform: '',
      reservationLink: '',
      phoneCarrier: '',
      gracePeriod: 15,
      parking: {
        hasParking: false,
        parkingType: undefined,
        pricingDetails: '',
        location: ''
      },
      schedule: createEmptySchedule()
    },
    deliverySettings: {
      platforms: [],
      preferredPlatform: '',
      preferredPlatformLink: '',
      deliveryInstructions: '',
      deliveryRadius: '',
      minimumOrderAmount: '',
      claimsHandling: {
        handledBy: '',
        restaurantHandledCases: [],
        additionalDetails: ''
      }
    }
  };
};

// Crear un horario semanal vacío
export const createEmptySchedule = (): WeeklySchedule => {
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const emptySchedule: WeeklySchedule = {};
  
  days.forEach(day => {
    emptySchedule[day] = {
      enabled: false,
      timeSlots: [{ start: '09:00', end: '17:00', type: 'regularHours' }]
    };
  });
  
  return emptySchedule;
};

// Esquema de validación básico
const validationSchema = Yup.object().shape({
  locationDetails: Yup.array().of(
    Yup.object().shape({
      state: Yup.string().required('State is required'),
      // Otras validaciones según sea necesario
    })
  )
});

// Lista de estados de EE. UU. para el selector de estados
const US_STATES = [
  { value: 'AL', label: 'Alabama' },
  { value: 'AK', label: 'Alaska' },
  { value: 'AZ', label: 'Arizona' },
  // Agrega más estados según sea necesario
  { value: 'WY', label: 'Wyoming' }
];

// Componente principal
const LocationDetails: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { formData, saveFormData } = useForm();
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [expandedLocations, setExpandedLocations] = useState<string[]>([]);
  const formikRef = useRef<FormikProps<FormValues>>(null);
  const [locationDetails, setLocationDetails] = useState<ExtendedLocationDetail[]>([]);

  // Efectos para manejar cambios y guardar datos
  useEffect(() => {
    window.onFormStateChange = setHasUnsavedChanges;
    window.saveCurrentFormData = async () => {
      if (formikRef.current) {
        return await handleSave(formikRef.current.values);
      }
      return false;
    };

    return () => {
      window.onFormStateChange = undefined;
      window.saveCurrentFormData = undefined;
    };
  }, []);

  useEffect(() => {
    // Cargar datos iniciales desde el formulario
    // Si hay datos almacenados anteriormente, los utilizamos
    if (formData && formData.address) {
      // Intentamos construir los detalles de ubicación basados en los datos del formulario
      const constructedLocationDetails: ExtendedLocationDetail[] = [];
      const count = typeof formData.locationCount === 'number' ? formData.locationCount : 1;
      
      for (let i = 0; i < count; i++) {
        const locationDetail = createEmptyLocation();
        
        // Si hay una ubicación confirmada, usamos su nombre
        const confirmedLocation = (formData.locations || [])
          .filter((loc: Location) => loc.nameConfirmed && loc.name)[i];
        
        if (confirmedLocation) {
          locationDetail.selectedLocationName = confirmedLocation.name;
        } else {
          // Asegurar que selectedLocationName siempre tenga un valor
          locationDetail.selectedLocationName = `Location ${i + 1}`;
        }
        
        // Si es el primer elemento, completamos con la información general
        if (i === 0) {
          locationDetail.address = formData.address || '';
          locationDetail.city = formData.city || '';
          locationDetail.state = formData.state || '';
          locationDetail.zipCode = formData.zipCode || '';
        }
        
        constructedLocationDetails.push(locationDetail as ExtendedLocationDetail);
      }
      
      setLocationDetails(constructedLocationDetails);
      
      // Inicializar el primer acordeón abierto por defecto
      setExpandedLocations(['0']);
    }
  }, [formData]);

  // Manejadores de eventos
  const handleFieldChange = (setFieldValue: any, field: string, value: any) => {
    setHasUnsavedChanges(true);
    setFieldValue(field, value);
  };

  const handleNext = (values: FormValues) => {
    // Guardar y navegar al siguiente paso
    handleSave(values).then(() => {
      navigate('/onboarding/observations');
    });
  };

  const handleSave = async (values: FormValues) => {
    try {
      // Actualizar el estado con los nuevos valores
      // Extractamos los datos de los detalles de la ubicación para guardarlos en el formData
      const firstLocation = values.locationDetails[0] || {};
      
      await saveFormData();
      setShowNotification(true);
      setHasUnsavedChanges(false);
      setTimeout(() => setShowNotification(false), 3000);
      return true;
    } catch (error) {
      console.error('Error saving form data:', error);
      return false;
    }
  };

  const toggleAccordion = (id: string) => {
    setExpandedLocations(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Componente para mostrar notificación de guardado
  const SavePrompt = ({ values }: { values: any }) => {
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-white p-4 shadow-md border-t z-10">
        <div className="container mx-auto flex justify-between items-center">
          <button
            type="button"
            onClick={() => handleSave(values)}
            className={hasUnsavedChanges ? 'btn-unsaved' : 'btn-saved'}
            disabled={!hasUnsavedChanges}
          >
            {hasUnsavedChanges ? 'Guardar cambios' : 'Cambios guardados'}
          </button>
          <div className="space-x-4">
            <button
              type="button"
              onClick={() => navigate('/onboarding/contact-info')}
              className="btn-secondary"
            >
              {t('back')}
            </button>
            <button
              type="button"
              onClick={() => handleNext(values)}
              className="btn-primary"
            >
              {t('continue')}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8 mb-24">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{t('locationDetails')}</h1>
      <p className="text-gray-600 mb-8">
        {t('locationDetailsDescription')}
      </p>

      <Formik
        initialValues={{
          locationDetails: locationDetails.length > 0 
            ? locationDetails 
            : Array((() => {
                // Determine the number of accordions to show
                const confirmedLocations = (formData?.locations || []).filter((loc: Location) => loc.nameConfirmed && loc.name);
                // If we have confirmed locations, use that count, otherwise fall back to locationCount
                return confirmedLocations.length > 0 
                  ? confirmedLocations.length 
                  : (typeof formData?.locationCount === 'number' ? formData.locationCount : 0);
              })()).fill(null).map((_, index) => {
                // Try to match with a confirmed location name if available
                const confirmedLocation = (formData?.locations || [])
                  .filter((loc: Location) => loc.nameConfirmed && loc.name)
                  [index];
                  
                return {
                  ...createEmptyLocation(),
                  locationId: String(index + 1),
                  selectedLocationName: confirmedLocation?.name || ''
                };
              })
        }}
        enableReinitialize={true}
        validationSchema={validationSchema}
        innerRef={formikRef}
        onSubmit={handleNext}
      >
        {({ values, setFieldValue }) => (
          <Form className="space-y-8" data-formik-values={JSON.stringify(values)}>
            {showNotification && (
              <Notification
                message="Los cambios han sido guardados correctamente"
                onClose={() => setShowNotification(false)}
              />
            )}
            
            {values.locationDetails.map((location: ExtendedLocationDetail, index: number) => (
              <div key={String(index + 1)} className="bg-white shadow rounded-lg overflow-hidden">
                <div 
                  className={`p-4 cursor-pointer flex justify-between items-center ${
                    expandedLocations.includes(String(index)) ? 'bg-gray-50' : 'bg-white'
                  }`}
                  onClick={() => toggleAccordion(String(index))}
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-lg font-medium text-gray-900">
                      Location: {location.selectedLocationName || `Location ${index + 1}`}
                    </span>
                  </div>
                  <ChevronDownIcon
                    className={`w-5 h-5 text-gray-500 transform transition-transform ${
                      expandedLocations.includes(String(index)) ? 'rotate-180' : ''
                    }`}
                  />
                </div>
                
                <div className={`transition-all duration-200 ease-in-out ${
                  expandedLocations.includes(String(index)) 
                    ? 'max-h-none opacity-100' 
                    : 'max-h-0 opacity-0 overflow-hidden'
                }`}>
                  <div className="p-4 space-y-6">
                    <SectionTitle>Basic Location Information</SectionTitle>
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                      <div>
                        <label htmlFor={`locationDetails.${index}.state`} className="block text-sm font-medium text-gray-700">
                          State
                        </label>
                        <p className="mt-1 text-sm text-gray-500">
                          Select the state where this location operates
                        </p>
                        <Field
                          as="select"
                          name={`locationDetails.${index}.state`}
                          className="mt-2 block w-full rounded-md border-gray-300 py-3 px-4 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleFieldChange(setFieldValue, `locationDetails.${index}.state`, e.target.value)}
                        >
                          <option value="">Select a state...</option>
                          {US_STATES.map(state => (
                            <option key={state.value} value={state.value}>
                              {state.label}
                            </option>
                          ))}
                        </Field>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <div className="flex justify-between">
              <button
                type="button"
                onClick={() => handleSave(values)}
                className={hasUnsavedChanges ? 'btn-unsaved' : 'btn-saved'}
                disabled={!hasUnsavedChanges}
              >
                {hasUnsavedChanges ? 'Guardar cambios' : 'Cambios guardados'}
              </button>
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => navigate('/onboarding/contact-info')}
                  className="btn-secondary"
                >
                  {t('back')}
                </button>
                <button 
                  type="button"
                  onClick={() => handleNext(values)}
                  className="btn-primary"
                >
                  {t('continue')}
                </button>
              </div>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
};

export default LocationDetails;
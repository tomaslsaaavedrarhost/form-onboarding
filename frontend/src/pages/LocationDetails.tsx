import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Field, Form, Formik, FormikProps } from 'formik';
import * as Yup from 'yup';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
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

  return (
    <div className="space-y-8 overflow-y-auto max-h-screen pb-24">
      <Formik
        initialValues={{
          locationDetails: locationDetails.length > 0 
            ? locationDetails 
            : Array((() => {
                // Determine the number of accordions to show
                const confirmedLocations = (formData.locations || []).filter(loc => loc.nameConfirmed && loc.name);
                // If we have confirmed locations, use that count, otherwise fall back to locationCount
                return confirmedLocations.length > 0 
                  ? confirmedLocations.length 
                  : (typeof formData.locationCount === 'number' ? formData.locationCount : 0);
              })()).fill(null).map((_, index) => {
                // Try to match with a confirmed location name if available
                const confirmedLocations = (formData.locations || [])
                  .filter(loc => loc.nameConfirmed && loc.name);
                
                const confirmedLocation = confirmedLocations[index];
                
                console.log(`Initializing location ${index + 1} with name:`, confirmedLocation?.name);
                  
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
        {({ values, setFieldValue, handleSubmit }) => {
          // Detectar cambios en el formulario y actualizar el estado
          useEffect(() => {
            // Solo marcar como "con cambios" si los valores son diferentes del estado original
            const isFormDirty = JSON.stringify(values.locationDetails) !== JSON.stringify(locationDetails);
            
            if (isFormDirty !== hasUnsavedChanges) {
              console.log('Estado de cambios sin guardar actualizado:', isFormDirty);
              setHasUnsavedChanges(isFormDirty);
            }
          }, [values.locationDetails, locationDetails, hasUnsavedChanges]);

          return (
            <Form className="space-y-8" data-formik-values={JSON.stringify(values)}>
              {showNotification && (
                <Notification
                  message="Los cambios han sido guardados correctamente"
                  onClose={() => setShowNotification(false)}
                />
              )}
              
              {values.locationDetails.map((location: ExtendedLocationDetail, index: number) => (
                <div key={String(index + 1)} className="bg-white shadow-lg rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl">
                  <div 
                    className="p-5 cursor-pointer flex justify-between items-center border-b border-gray-100"
                    onClick={() => toggleAccordion(String(index))}
                  >
                    <div className="flex items-center space-x-2">
                      <span className="text-xl font-bold bg-gradient-to-r from-brand-orange to-brand-purple bg-clip-text text-transparent">
                        Location: {location.selectedLocationName || `Location ${index + 1}`}
                      </span>
                    </div>
                    <button 
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleAccordion(String(index));
                      }}
                      aria-label={expandedLocations.includes(String(index)) ? 'Cerrar sección' : 'Abrir sección'}
                      className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-r from-brand-orange to-brand-purple text-white shadow-md focus:outline-none transition-transform duration-300 transform hover:scale-105"
                    >
                      {expandedLocations.includes(String(index)) ? (
                        <ChevronUpIcon className="h-5 w-5" />
                      ) : (
                        <ChevronDownIcon className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                  
                  <div className={`transition-all duration-300 ease-in-out ${
                    expandedLocations.includes(String(index)) 
                      ? 'max-h-[2000px] opacity-100' 
                      : 'max-h-0 opacity-0 overflow-hidden'
                  }`}>
                    <div className="p-6 space-y-6">
                      <div className="flex items-center mb-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-brand-orange to-brand-purple flex items-center justify-center mr-4 shadow-md">
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                          </svg>
                        </div>
                        <h3 className="text-xl font-semibold bg-gradient-to-r from-brand-orange to-brand-purple bg-clip-text text-transparent">
                          Basic Location Information
                        </h3>
                      </div>

                      <div className="pl-16">
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                          <div>
                            <label htmlFor={`locationDetails.${index}.state`} className="block text-base font-medium text-gray-700 mb-1">
                              State
                            </label>
                            <p className="text-sm text-gray-500 mb-2">
                              Select the state where this location operates
                            </p>
                            <Field
                              as="select"
                              name={`locationDetails.${index}.state`}
                              className="block w-full rounded-xl border-gray-300 py-3 px-4 shadow-sm focus:border-brand-orange focus:ring-brand-orange bg-gradient-to-br from-orange-50/30 to-purple-50/30"
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
                </div>
              ))}

              {/* Barra fija de botones en la parte inferior */}
              <div className="fixed bottom-0 left-0 right-0 py-4 px-6 bg-white border-t border-gray-200 flex justify-between items-center z-10">
                {!hasUnsavedChanges ? (
                  <div className="flex items-center bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded-lg">
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                    </svg>
                    <div>
                      <div className="font-medium">Cambios guardados</div>
                      <div className="text-xs text-green-600">Todo está al día</div>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => navigate('/onboarding/contact-info')}
                    className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    {t('back')}
                  </button>
                )}

                <div className="flex space-x-4">
                  {hasUnsavedChanges ? (
                    <button
                      type="button"
                      onClick={() => handleSave(values)}
                      className="px-6 py-3 bg-white border border-brand-orange text-brand-orange font-medium rounded-lg hover:bg-orange-50 transition-colors"
                    >
                      Guardar cambios
                    </button>
                  ) : (
                    <div className="px-6 py-3 bg-gray-100 text-gray-500 font-medium rounded-lg">
                      Cambios guardados
                    </div>
                  )}
                  <button 
                    type="submit"
                    className="px-6 py-3 bg-gradient-to-r from-brand-orange to-brand-purple text-white font-medium rounded-lg hover:opacity-90 transition-colors"
                  >
                    {t('continue')}
                  </button>
                </div>
              </div>
            </Form>
          );
        }}
      </Formik>
    </div>
  );
};

export default LocationDetails;
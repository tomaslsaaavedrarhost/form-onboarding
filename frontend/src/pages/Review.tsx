import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useFormProgress, FormData } from '../hooks/useFormProgress'
import { useForm } from '../context/FormContext'
import { XMarkIcon } from '@heroicons/react/24/outline'

// Extendemos la interfaz FormData para incluir campos adicionales que sabemos que existen
interface ExtendedFormData extends FormData {
  // Campos de políticas de propinas que no están en FormData pero existen en la aplicación
  hasTips?: 'yes' | 'no' | 'depends';
  tipDistribution?: string;
  suggestedTipPercentages?: string[];
  hasServiceCharge?: boolean;
  serviceChargePercentage?: number;
  largeGroupPolicy?: string;
  
  // Políticas de propinas a nivel de proyecto
  tipsPolicy?: {
    locationPolicies: {
      [locationId: string]: {
        hasTips: 'yes' | 'no' | 'depends';
        tipDetails: string;
        hasServiceCharge: boolean;
        serviceChargeDetails: string;
        tipDistribution: string;
        suggestedTipPercentages: string[];
        largeGroupPolicy: string;
        largeGroupMinSize: number;
        largeGroupTipPercentage: number;
        eventCateringPolicy: string;
        cardVsCashPolicy: string;
      };
    };
  };
  
  // Campos específicos para la información legal y datos de ubicación
  locationDetails?: any[];
  locationPolicies?: {[locationId: string]: any};
  irsLetter?: File | null;
  legalDocuments?: string[];
  
  // Configuración del asistente virtual
  aiConfig?: {
    language?: string;
    otherLanguage?: string;
    assistantName?: string;
    assistantGender?: string;
    personality?: string[];
    otherPersonality?: string;
    avatar?: File | null;
    additionalInfo?: string;
  };
}

// Interfaces para la información específica de ubicaciones
interface LocationSpecificData {
  locationId: string;
  locationName: string;
  noData?: boolean; // Indicador de que no hay datos disponibles
  creditCardExclusions?: string; // Exclusiones de tarjeta de crédito
  debitCardExclusions?: string; // Exclusiones de tarjeta de débito
  mobilePaymentExclusions?: string; // Exclusiones de pago móvil
  paymentMethodsNotes?: string; // Notas adicionales de métodos de pago
  paymentMethods?: { // Agrupación de información de métodos de pago
    creditCardExclusions?: string;
    debitCardExclusions?: string;
    mobilePaymentExclusions?: string;
    notes?: string;
  };
  // Horarios y tiempos de espera
  schedule?: {
    [key: string]: {
      enabled: boolean;
      timeSlots: Array<{
        start: string;
        end: string;
        type: string;
        kitchenClosingTime?: string | null;
      }>;
    };
  };
  waitTimes?: {
    [key: string]: {
      [timeSlot: string]: string;
    };
  };
  details?: {
    noData?: boolean; // También puede estar presente en los detalles
    locationId: string;
    state: string;
    streetAddress: string;
    timeZone: string;
    managerEmail: string;
    phoneNumbers: string[];
    acceptedPaymentMethods: string[];
    creditCardExclusions: string;
    debitCardExclusions: string;
    mobilePaymentExclusions: string;
    phoneCarrier: string;
    otherPhoneCarrier?: string;
    carrierCredentials: {
      username: string;
      password: string;
      pin: string;
    };
    schedule: {
      [key: string]: {
        enabled: boolean;
        timeSlots: Array<{
          start: string;
          end: string;
          type: string;
          kitchenClosingTime?: string | null;
        }>;
      };
    };
    waitTimes: {
      [key: string]: {
        [timeSlot: string]: string;
      };
    };
    paymentMethodsNotes: string;
    defaultTransferToHost: boolean;
    transferRules: Array<{
      type: string;
      number: string;
      description?: string;
      otherType?: string;
      index: number;
    }>;
    paymentMethods?: { // También puede estar dentro de details
      creditCardExclusions?: string;
      debitCardExclusions?: string;
      mobilePaymentExclusions?: string;
      notes?: string;
    };
  };
  tipPolicy?: {
    hasTips: 'yes' | 'no' | 'depends';
    tipDetails: string;
    hasServiceCharge: boolean;
    serviceChargeDetails: string;
    tipDistribution: string;
    suggestedTipPercentages: string[];
    largeGroupPolicy: string;
    largeGroupMinSize: number;
    largeGroupTipPercentage: number;
    eventCateringPolicy: string;
    cardVsCashPolicy: string;
  };
  reservations?: {
    acceptsReservations: boolean;
    platform: string;
    reservationLink: string;
    phoneCarrier: string;
    gracePeriod: number;
    maxAdvanceTime?: number;
    maxAdvanceTimeUnit?: string;
    maxPartySize?: number;
    parking: {
      hasParking: boolean;
      parkingType: string | undefined;
      pricingDetails: string;
      location: string;
    };
    schedule: {
      [key: string]: {
        enabled: boolean;
        timeSlots: Array<{
          start: string;
          end: string;
          type: string;
        }>;
      };
    };
  };
  menu?: {
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
  };
  pickup?: {
    platforms: string[];
    preferredPlatform: string;
    preferredPlatformLink: string;
    otherPlatform?: string;
  };
  delivery?: {
    platforms: string[];
    preferredPlatform: string;
    preferredPlatformLink: string;
    otherPlatform?: string;
  };
  policies?: {
    parking: {
      hasParking: boolean;
      parkingType: string | undefined;
      pricingDetails: string;
      location: string;
    };
    corkage: {
      allowed: boolean;
      fee: string;
    };
    specialDiscounts: {
      hasDiscounts: boolean;
      details: string[];
    };
    birthdayCelebrations: {
      allowed: boolean;
      details: string;
      restrictions: string[];
    };
    dressCode: {
      hasDressCode: boolean;
      details: string;
      exceptions: string[];
    };
    ageVerification: {
      acceptedDocuments: string[];
      otherDocuments: string;
    };
    smokingArea: {
      hasSmokingArea: boolean;
      details: string;
    };
    brunchMenu: {
      hasBrunchMenu: boolean;
      schedule: string;
      menuFile: File | null;
    };
  };
}

// Simple spinner component for loading states
const Spinner = () => (
  <div className="flex justify-center items-center py-10">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-purple"></div>
  </div>
)

// Componente Modal para mostrar información específica de cada ubicación
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  locationData: LocationSpecificData;
  currentTab: string;
  setCurrentTab: (tab: string) => void;
}

const LocationModal: React.FC<ModalProps> = ({ 
  isOpen, 
  onClose, 
  locationData,
  currentTab,
  setCurrentTab
}) => {
  if (!isOpen) return null;
  
  // Tabs disponibles
  const tabs = [
    { id: 'basic', label: 'Información Básica' },
    { id: 'hours', label: 'Horarios' },
    { id: 'payment', label: 'Métodos de Pago' },
    { id: 'reservations', label: 'Reservaciones' },
    { id: 'tips', label: 'Propinas' },
    { id: 'policies', label: 'Políticas' },
    { id: 'pickup', label: 'Pickup y Delivery' },
    { id: 'menu', label: 'Menú' },
  ];

  // Ref para el contenedor de tabs
  const tabsContainerRef = React.useRef<HTMLDivElement>(null);
  
  // Estado para controlar indicadores de desplazamiento
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  // Función para manejar scroll de tabs
  const handleTabsScroll = () => {
    if (tabsContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = tabsContainerRef.current;
      setShowLeftArrow(scrollLeft > 0);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  // Inicializar estado de flechas y agregar listener al montar
  useEffect(() => {
    if (tabsContainerRef.current) {
      handleTabsScroll();
      tabsContainerRef.current.addEventListener('scroll', handleTabsScroll);
    }
    
    // Verificar si hay que mostrar flecha derecha al inicio
    setTimeout(() => {
      if (tabsContainerRef.current) {
        const { scrollWidth, clientWidth } = tabsContainerRef.current;
        setShowRightArrow(scrollWidth > clientWidth);
      }
    }, 100);
    
    return () => {
      if (tabsContainerRef.current) {
        tabsContainerRef.current.removeEventListener('scroll', handleTabsScroll);
      }
    };
  }, [isOpen]);

  // Funciones para desplazar los tabs
  const scrollLeft = () => {
    if (tabsContainerRef.current) {
      tabsContainerRef.current.scrollBy({ left: -200, behavior: 'smooth' });
    }
  };
  
  const scrollRight = () => {
    if (tabsContainerRef.current) {
      tabsContainerRef.current.scrollBy({ left: 200, behavior: 'smooth' });
    }
  };

  const formatTimeSlot = (slot: any) => {
    if (!slot) return 'No disponible';
    return `${slot.start} - ${slot.end}${slot.kitchenClosingTime ? ` (Cocina cierra: ${slot.kitchenClosingTime})` : ''}`;
  };

  // Función para renderizar horarios de operación por día
  const renderSchedule = (schedule: any) => {
    if (!schedule) return <p className="text-gray-500 italic">No hay información de horarios disponible</p>;
    
    const days = {
      monday: 'Lunes',
      tuesday: 'Martes',
      wednesday: 'Miércoles',
      thursday: 'Jueves',
      friday: 'Viernes',
      saturday: 'Sábado',
      sunday: 'Domingo'
    };

    return (
      <div className="space-y-3">
        {Object.entries(days).map(([day, label]) => (
          <div key={day} className="border-b border-gray-200 pb-2">
            <div className="flex justify-between items-center">
              <span className="font-medium">{label}:</span>
              <span className={`${schedule[day]?.enabled ? 'text-green-600' : 'text-red-500'}`}>
                {schedule[day]?.enabled ? 'Abierto' : 'Cerrado'}
              </span>
            </div>
            {schedule[day]?.enabled && schedule[day]?.timeSlots?.length > 0 && (
              <div className="mt-1 pl-4">
                {schedule[day].timeSlots.map((slot: any, index: number) => (
                  <div key={index} className="text-sm text-gray-600">
                    {formatTimeSlot(slot)} 
                    {slot.type && <span className="ml-1 text-gray-500">({slot.type})</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  // Función para renderizar tiempos de espera
  const renderWaitTimes = (waitTimes: any) => {
    console.log("Renderizando tiempos de espera:", waitTimes);
    
    if (!waitTimes) {
      console.log("No hay tiempos de espera disponibles");
      return <p className="text-gray-500 italic">No hay información de tiempos de espera disponible</p>;
    }
    
    // Si waitTimes es un objeto vacío
    if (typeof waitTimes === 'object' && Object.keys(waitTimes).length === 0) {
      console.log("Objeto de tiempos de espera está vacío");
      return <p className="text-gray-500 italic">No hay información de tiempos de espera disponible</p>;
    }
    
    const days = {
      monday: 'Lunes',
      tuesday: 'Martes',
      wednesday: 'Miércoles',
      thursday: 'Jueves',
      friday: 'Viernes',
      saturday: 'Sábado',
      sunday: 'Domingo'
    };

    const waitTimeLabels: {[key: string]: string} = {
      "0-15": "0-15 minutos",
      "15-30": "15-30 minutos",
      "30-45": "30-45 minutos",
      "45-60": "45-60 minutos",
      "60+": "Más de 60 minutos"
    };
    
    // Función para formatear el rango horario para mostrar de manera legible
    const formatTimeRange = (timeRange: string): string => {
      if (timeRange === "opening-15") return "Apertura a 15:00";
      if (timeRange === "22-closing") return "22:00 al cierre";
      
      // Para rangos como "15-18", "18-22", etc.
      const parts = timeRange.split('-');
      if (parts.length === 2) {
        return `${parts[0]}:00 a ${parts[1]}:00`;
      }
      
      return timeRange; // Si no podemos formatear, devolver tal cual
    };
    
    // Verificar si hay datos para al menos un día
    let hasAnyWaitTimeData = false;
    Object.keys(days).forEach(day => {
      if (waitTimes[day] && Object.keys(waitTimes[day]).length > 0) {
        hasAnyWaitTimeData = true;
      }
    });
    
    if (!hasAnyWaitTimeData) {
      return <p className="text-gray-500 italic">No hay información de tiempos de espera disponible</p>;
    }

    return (
      <div className="space-y-3">
        {Object.entries(days).map(([day, label]) => {
          const dayData = waitTimes[day];
          const hasDataForDay = dayData && Object.keys(dayData).length > 0;
          
          return (
            <div key={day} className="border-b border-gray-200 pb-2">
              <div className="font-medium">{label}:</div>
              {hasDataForDay ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1 pl-4">
                  {Object.entries(dayData).map(([timeRange, waitTime]) => (
                    <div key={timeRange} className="text-sm">
                      <span className="text-gray-600">{formatTimeRange(timeRange)}:</span> 
                      <span className="ml-1 font-medium">{waitTimeLabels[waitTime as string] || String(waitTime)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-gray-500 italic pl-4">No hay datos para este día</div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // Renderizado condicional basado en la pestaña actual
  const renderTabContent = () => {
    // Verificar si tenemos datos - no usar la bandera noData de details, que puede ser engañosa
    if (!locationData) {
      return (
        <div className="py-6 text-center">
          <p className="text-gray-500">No hay información disponible para esta ubicación</p>
        </div>
      );
    }

    // Función auxiliar para verificar si hay datos en una sección específica
    const hasSectionData = (section: any) => {
      if (!section) return false;
      // Verificar si hay al menos una propiedad con datos en la sección
      return Object.values(section).some(value => 
        value !== null && 
        value !== undefined && 
        value !== '' && 
        !(Array.isArray(value) && value.length === 0) &&
        !(typeof value === 'object' && Object.keys(value).length === 0)
      );
    };

    switch (currentTab) {
      case 'basic':
        // Verificamos si hay información básica disponible
        const hasBasicInfo = locationData.details && (
          locationData.details.state || 
          locationData.details.streetAddress || 
          locationData.details.timeZone || 
          locationData.details.managerEmail ||
          (locationData.details.phoneNumbers && locationData.details.phoneNumbers.length > 0) ||
          (locationData.details.transferRules && locationData.details.transferRules.length > 0)
        );
        
        if (!hasBasicInfo) {
          return (
            <div className="py-6 text-center">
              <p className="text-gray-500 italic">No hay información básica disponible para esta ubicación</p>
            </div>
          );
        }
        
        return (
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-gray-900">Información de Contacto</h4>
              <div className="mt-2 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Estado:</span>
                  <span>{locationData.details?.state || 'No hay información disponible'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Dirección:</span>
                  <span>{locationData.details?.streetAddress || 'No hay información disponible'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Zona Horaria:</span>
                  <span>{locationData.details?.timeZone || 'No hay información disponible'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Email del Gerente:</span>
                  <span>{locationData.details?.managerEmail || 'No hay información disponible'}</span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">Teléfonos</h4>
              <div className="mt-2">
                {locationData.details?.phoneNumbers && locationData.details.phoneNumbers.length > 0 ? (
                  <div className="space-y-1">
                    {locationData.details.phoneNumbers.map((phone: string, index: number) => (
                      <div key={index} className="flex justify-between">
                        <span className="text-gray-600">Teléfono {index + 1}:</span>
                        <span>{phone}</span>
                      </div>
                    ))}
                    <div className="flex justify-between">
                      <span className="text-gray-600">Compañía Telefónica:</span>
                      <span>{locationData.details.phoneCarrier || 'No hay información disponible'}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500 italic">No hay información de teléfonos disponible</p>
                )}
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">Reglas de Transferencia</h4>
              <div className="mt-2">
                {locationData.details?.transferRules && locationData.details.transferRules.length > 0 ? (
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Transferir al host por defecto:</span>
                      <span>{locationData.details.defaultTransferToHost ? 'Sí' : 'No'}</span>
                    </div>
                    {locationData.details.transferRules.map((rule: any, index: number) => (
                      <div key={index} className="border-t border-gray-100 pt-1">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Tipo:</span>
                          <span>{rule.type === 'other' ? rule.otherType : rule.type}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Número:</span>
                          <span>{rule.number}</span>
                        </div>
                        {rule.description && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Descripción:</span>
                            <span>{rule.description}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 italic">No hay información de reglas de transferencia disponible</p>
                )}
              </div>
            </div>
          </div>
        );

      case 'hours':
        // Verificar si hay datos de horarios o tiempos de espera
        const scheduleData = locationData.details?.schedule || locationData.schedule;
        const waitTimesData = locationData.details?.waitTimes || locationData.waitTimes;
        
        console.log("Datos de horarios disponibles:", scheduleData);
        console.log("Datos de tiempos de espera disponibles:", waitTimesData);
        
        const hasScheduleInfo = scheduleData || waitTimesData;
        
        if (!hasScheduleInfo) {
          return (
            <div className="py-6 text-center">
              <p className="text-gray-500 italic">No hay información de horarios disponible para esta ubicación</p>
            </div>
          );
        }
        
        return (
          <div className="space-y-6">
            <div>
              <h4 className="font-semibold text-gray-900">Horarios de Operación</h4>
              <div className="mt-3">
                {scheduleData ? (
                  renderSchedule(scheduleData)
                ) : (
                  <p className="text-gray-500 italic">No hay información de horarios disponible</p>
                )}
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">Tiempos de Espera Promedio</h4>
              <div className="mt-3">
                {waitTimesData ? (
                  renderWaitTimes(waitTimesData)
                ) : (
                  <p className="text-gray-500 italic">No hay información de tiempos de espera disponible</p>
                )}
              </div>
            </div>
          </div>
        );

      case 'payment':
        // Verificar si hay datos de métodos de pago
        const hasPaymentInfo = locationData.details && (
          (locationData.details.acceptedPaymentMethods && locationData.details.acceptedPaymentMethods.length > 0) ||
          locationData.details.creditCardExclusions ||
          locationData.details.debitCardExclusions ||
          locationData.details.mobilePaymentExclusions ||
          locationData.details.paymentMethodsNotes ||
          locationData.creditCardExclusions ||
          locationData.debitCardExclusions ||
          locationData.mobilePaymentExclusions ||
          locationData.paymentMethodsNotes ||
          (locationData.details.paymentMethods && Object.keys(locationData.details.paymentMethods).length > 0) ||
          (locationData.paymentMethods && Object.keys(locationData.paymentMethods).length > 0)
        );
        
        if (!hasPaymentInfo) {
          return (
            <div className="py-6 text-center">
              <p className="text-gray-500 italic">No hay información de métodos de pago disponible para esta ubicación</p>
            </div>
          );
        }
        
        return (
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-gray-900">Métodos de Pago Aceptados</h4>
              <div className="mt-2">
                {locationData.details?.acceptedPaymentMethods && locationData.details.acceptedPaymentMethods.length > 0 ? (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {locationData.details.acceptedPaymentMethods.map((method: string, index: number) => (
                      <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                        {method}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 italic">No hay información de métodos de pago disponible</p>
                )}
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">Exclusiones</h4>
              <div className="mt-2 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Exclusiones de Tarjeta de Crédito:</span>
                  <span>{
                    locationData.details?.creditCardExclusions || 
                    locationData.creditCardExclusions || 
                    (locationData.details?.paymentMethods?.creditCardExclusions) || 
                    'No hay información disponible'
                  }</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Exclusiones de Tarjeta de Débito:</span>
                  <span>{
                    locationData.details?.debitCardExclusions || 
                    locationData.debitCardExclusions || 
                    (locationData.details?.paymentMethods?.debitCardExclusions) || 
                    'No hay información disponible'
                  }</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Exclusiones de Pago Móvil:</span>
                  <span>{
                    locationData.details?.mobilePaymentExclusions || 
                    locationData.mobilePaymentExclusions || 
                    (locationData.details?.paymentMethods?.mobilePaymentExclusions) || 
                    'No hay información disponible'
                  }</span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">Notas Adicionales</h4>
              <div className="mt-2">
                <p className="text-gray-700">{
                  locationData.details?.paymentMethodsNotes || 
                  locationData.paymentMethodsNotes || 
                  (locationData.details?.paymentMethods?.notes) || 
                  'No hay información disponible'
                }</p>
              </div>
            </div>
          </div>
        );

      case 'reservations':
        // Verificar si hay datos de reservaciones
        if (!locationData.reservations || !hasSectionData(locationData.reservations)) {
          return (
            <div className="py-6 text-center">
              <p className="text-gray-500 italic">No hay información de reservaciones disponible para esta ubicación</p>
            </div>
          );
        }
        return (
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-gray-900">Configuración de Reservaciones</h4>
              <div className="mt-2 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Acepta Reservaciones:</span>
                  <span>{locationData.reservations?.acceptsReservations ? 'Sí' : 'No'}</span>
                </div>
                {locationData.reservations?.acceptsReservations && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Plataforma:</span>
                      <span>{locationData.reservations.platform || 'No hay información disponible'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Enlace de Reservación:</span>
                      {locationData.reservations.reservationLink ? (
                        <a href={locationData.reservations.reservationLink} target="_blank" rel="noopener noreferrer" className="text-brand-purple hover:underline">
                          {locationData.reservations.reservationLink}
                        </a>
                      ) : (
                        <span className="text-gray-500 italic">No hay información disponible</span>
                      )}
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Compañía Telefónica:</span>
                      <span>{locationData.reservations.phoneCarrier || 'No hay información disponible'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Período de Gracia:</span>
                      <span>{locationData.reservations.gracePeriod ? `${locationData.reservations.gracePeriod} minutos` : 'No hay información disponible'}</span>
                    </div>
                    {locationData.reservations.maxAdvanceTime && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Tiempo Máximo de Anticipación:</span>
                        <span>{locationData.reservations.maxAdvanceTime} {locationData.reservations.maxAdvanceTimeUnit || 'días'}</span>
                      </div>
                    )}
                    {locationData.reservations.maxPartySize && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Tamaño Máximo de Grupo:</span>
                        <span>{locationData.reservations.maxPartySize} personas</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
            {locationData.reservations?.acceptsReservations && (
              <div>
                <h4 className="font-semibold text-gray-900">Horarios de Reservaciones</h4>
                <div className="mt-3">
                  {locationData.reservations.schedule ? (
                    renderSchedule(locationData.reservations.schedule)
                  ) : (
                    <p className="text-gray-500 italic">No hay información de horarios de reservación disponible</p>
                  )}
                </div>
              </div>
            )}
            <div>
              <h4 className="font-semibold text-gray-900">Estacionamiento</h4>
              <div className="mt-2 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Tiene Estacionamiento:</span>
                  <span>{locationData.reservations?.parking?.hasParking ? 'Sí' : 'No'}</span>
                </div>
                {locationData.reservations?.parking?.hasParking && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tipo de Estacionamiento:</span>
                      <span>{locationData.reservations.parking.parkingType || 'No hay información disponible'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Detalles de Precio:</span>
                      <span>{locationData.reservations.parking.pricingDetails || 'No hay información disponible'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Ubicación:</span>
                      <span>{locationData.reservations.parking.location || 'No hay información disponible'}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        );

      case 'tips':
        // Verificar si hay datos de políticas de propinas
        if (!locationData.tipPolicy || !hasSectionData(locationData.tipPolicy)) {
          return (
            <div className="py-6 text-center">
              <p className="text-gray-500 italic">No hay información de política de propinas disponible para esta ubicación</p>
            </div>
          );
        }
        return (
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-gray-900">Política de Propinas</h4>
              <div className="mt-2 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Acepta Propinas:</span>
                  <span>{
                    locationData.tipPolicy?.hasTips === 'yes' ? 'Sí' : 
                    locationData.tipPolicy?.hasTips === 'no' ? 'No' : 
                    locationData.tipPolicy?.hasTips === 'depends' ? 'Depende' : 'No hay información disponible'
                  }</span>
                </div>
                {locationData.tipPolicy?.hasTips !== 'no' && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Detalles de Propinas:</span>
                      <span>{locationData.tipPolicy?.tipDetails || 'No hay información disponible'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tiene Cargo por Servicio:</span>
                      <span>{locationData.tipPolicy?.hasServiceCharge !== undefined ? (locationData.tipPolicy.hasServiceCharge ? 'Sí' : 'No') : 'No hay información disponible'}</span>
                    </div>
                    {locationData.tipPolicy?.hasServiceCharge && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Detalles del Cargo por Servicio:</span>
                        <span>{locationData.tipPolicy?.serviceChargeDetails || 'No hay información disponible'}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-600">Distribución de Propinas:</span>
                      <span>{locationData.tipPolicy?.tipDistribution || 'No hay información disponible'}</span>
                    </div>
                    {locationData.tipPolicy?.suggestedTipPercentages && locationData.tipPolicy.suggestedTipPercentages.length > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Porcentajes de Propina Sugeridos:</span>
                        <span>{locationData.tipPolicy.suggestedTipPercentages.join('%, ')}%</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-600">Política para Grupos Grandes:</span>
                      <span>{locationData.tipPolicy?.largeGroupPolicy || 'No hay información disponible'}</span>
                    </div>
                    {locationData.tipPolicy?.largeGroupPolicy && locationData.tipPolicy.largeGroupPolicy !== 'none' && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Tamaño Mínimo de Grupo Grande:</span>
                          <span>{locationData.tipPolicy?.largeGroupMinSize || 'No hay información disponible'} personas</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Porcentaje de Propina para Grupos Grandes:</span>
                          <span>{locationData.tipPolicy?.largeGroupTipPercentage || 'No hay información disponible'}%</span>
                        </div>
                      </>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-600">Política para Eventos y Catering:</span>
                      <span>{locationData.tipPolicy?.eventCateringPolicy || 'No hay información disponible'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Política de Propina en Efectivo vs. Tarjeta:</span>
                      <span>{locationData.tipPolicy?.cardVsCashPolicy || 'No hay información disponible'}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        );
        
      case 'policies':
        // Verificar si hay datos de políticas del restaurante
        if (!locationData.policies || !hasSectionData(locationData.policies)) {
          return (
            <div className="py-6 text-center">
              <p className="text-gray-500 italic">No hay información de políticas del restaurante disponible para esta ubicación</p>
            </div>
          );
        }
        return (
          <div className="space-y-6">
            <div>
              <h4 className="font-semibold text-gray-900">Política de Estacionamiento</h4>
              <div className="mt-2 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Tiene Estacionamiento:</span>
                  <span>{locationData.policies?.parking?.hasParking !== undefined ? (locationData.policies.parking.hasParking ? 'Sí' : 'No') : 'No hay información disponible'}</span>
                </div>
                {locationData.policies?.parking?.hasParking && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tipo:</span>
                      <span>{locationData.policies.parking.parkingType || 'No hay información disponible'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Detalles de Precio:</span>
                      <span>{locationData.policies.parking.pricingDetails || 'No hay información disponible'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Ubicación:</span>
                      <span>{locationData.policies.parking.location || 'No hay información disponible'}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900">Política de Corkage</h4>
              <div className="mt-2 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Se Permite:</span>
                  <span>{locationData.policies?.corkage?.allowed !== undefined ? (locationData.policies.corkage.allowed ? 'Sí' : 'No') : 'No hay información disponible'}</span>
                </div>
                {locationData.policies?.corkage?.allowed && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tarifa:</span>
                    <span>{locationData.policies.corkage.fee || 'No hay información disponible'}</span>
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900">Descuentos Especiales</h4>
              <div className="mt-2">
                {locationData.policies?.specialDiscounts?.hasDiscounts ? (
                  <div className="space-y-2">
                    {locationData.policies.specialDiscounts.details && locationData.policies.specialDiscounts.details.length > 0 ? (
                      locationData.policies.specialDiscounts.details.map((detail: string, index: number) => (
                        <div key={index} className="flex justify-between">
                          <span className="text-gray-600">Descuento {index + 1}:</span>
                          <span>{detail}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 italic">No hay detalles de descuentos disponibles</p>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500 italic">No hay información de descuentos especiales disponible</p>
                )}
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900">Celebraciones de Cumpleaños</h4>
              <div className="mt-2 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Se Permiten:</span>
                  <span>{locationData.policies?.birthdayCelebrations?.allowed !== undefined ? (locationData.policies.birthdayCelebrations.allowed ? 'Sí' : 'No') : 'No hay información disponible'}</span>
                </div>
                {locationData.policies?.birthdayCelebrations?.allowed && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Detalles:</span>
                      <span>{locationData.policies.birthdayCelebrations.details || 'No hay información disponible'}</span>
                    </div>
                    {locationData.policies.birthdayCelebrations.restrictions && locationData.policies.birthdayCelebrations.restrictions.length > 0 ? (
                      <div>
                        <span className="text-gray-600">Restricciones:</span>
                        <ul className="list-disc pl-5 mt-1">
                          {locationData.policies.birthdayCelebrations.restrictions.map((restriction: string, index: number) => (
                            <li key={index} className="text-gray-700">{restriction}</li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Restricciones:</span>
                        <span className="text-gray-500 italic">No hay restricciones especificadas</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900">Código de Vestimenta</h4>
              <div className="mt-2 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Tiene Código de Vestimenta:</span>
                  <span>{locationData.policies?.dressCode?.hasDressCode !== undefined ? (locationData.policies.dressCode.hasDressCode ? 'Sí' : 'No') : 'No hay información disponible'}</span>
                </div>
                {locationData.policies?.dressCode?.hasDressCode && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Detalles:</span>
                      <span>{locationData.policies.dressCode.details || 'No hay información disponible'}</span>
                    </div>
                    {locationData.policies.dressCode.exceptions && locationData.policies.dressCode.exceptions.length > 0 ? (
                      <div>
                        <span className="text-gray-600">Excepciones:</span>
                        <ul className="list-disc pl-5 mt-1">
                          {locationData.policies.dressCode.exceptions.map((exception: string, index: number) => (
                            <li key={index} className="text-gray-700">{exception}</li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Excepciones:</span>
                        <span className="text-gray-500 italic">No hay excepciones especificadas</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900">Verificación de Edad</h4>
              <div className="mt-2 space-y-2">
                <div>
                  <span className="text-gray-600">Documentos Aceptados:</span>
                  {locationData.policies?.ageVerification?.acceptedDocuments && locationData.policies.ageVerification.acceptedDocuments.length > 0 ? (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {locationData.policies.ageVerification.acceptedDocuments.map((doc: string, index: number) => (
                        <span key={index} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                          {doc}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 italic mt-1">No hay información sobre documentos aceptados</p>
                  )}
                </div>
                {locationData.policies?.ageVerification?.otherDocuments && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Otros Documentos:</span>
                    <span>{locationData.policies.ageVerification.otherDocuments}</span>
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900">Área para Fumadores</h4>
              <div className="mt-2 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Tiene Área para Fumadores:</span>
                  <span>{locationData.policies?.smokingArea?.hasSmokingArea !== undefined ? (locationData.policies.smokingArea.hasSmokingArea ? 'Sí' : 'No') : 'No hay información disponible'}</span>
                </div>
                {locationData.policies?.smokingArea?.hasSmokingArea && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Detalles:</span>
                    <span>{locationData.policies.smokingArea.details || 'No hay información disponible'}</span>
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900">Menú de Brunch</h4>
              <div className="mt-2 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Tiene Menú de Brunch:</span>
                  <span>{locationData.policies?.brunchMenu?.hasBrunchMenu !== undefined ? (locationData.policies.brunchMenu.hasBrunchMenu ? 'Sí' : 'No') : 'No hay información disponible'}</span>
                </div>
                {locationData.policies?.brunchMenu?.hasBrunchMenu && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Horario:</span>
                    <span>{locationData.policies.brunchMenu.schedule || 'No hay información disponible'}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 'pickup':
      case 'pickup-delivery':
        // Verificar si hay datos de pickup o delivery
        const hasPickupDeliveryInfo = 
          (locationData.pickup && locationData.pickup.platforms && locationData.pickup.platforms.length > 0) || 
          (locationData.delivery && locationData.delivery.platforms && locationData.delivery.platforms.length > 0);
        
        if (!hasPickupDeliveryInfo) {
          return (
            <div className="py-6 text-center">
              <p className="text-gray-500 italic">No hay información de pickup o delivery disponible para esta ubicación</p>
            </div>
          );
        }
        return (
          <div className="space-y-6">
            <div>
              <h4 className="font-semibold text-gray-900">Menú Regular</h4>
              <div className="mt-2 space-y-2">
                {locationData.menu?.regularMenuUrl ? (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Enlace al Menú:</span>
                    <a 
                      href={locationData.menu.regularMenuUrl} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-brand-purple hover:underline"
                    >
                      Ver Menú Regular
                    </a>
                  </div>
                ) : (
                  locationData.menu?.regularMenu ? (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Archivo de Menú:</span>
                      <span className="text-brand-purple">Archivo subido</span>
                    </div>
                  ) : (
                    <p className="text-gray-500 italic">No hay información del menú regular disponible</p>
                  )
                )}
              </div>
            </div>
            
            {locationData.menu?.hasDietaryMenu && (
              <div>
                <h4 className="font-semibold text-gray-900">Menú Dietético</h4>
                <div className="mt-2 space-y-2">
                  {locationData.menu.dietaryMenuUrl ? (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Enlace al Menú:</span>
                      <a 
                        href={locationData.menu.dietaryMenuUrl} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-brand-purple hover:underline"
                      >
                        Ver Menú Dietético
                      </a>
                    </div>
                  ) : (
                    locationData.menu.dietaryMenu ? (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Archivo de Menú:</span>
                        <span className="text-brand-purple">Archivo subido</span>
                      </div>
                    ) : (
                      <p className="text-gray-500 italic">No hay información del menú dietético disponible</p>
                    )
                  )}
                </div>
              </div>
            )}
            
            {locationData.menu?.hasVeganMenu && (
              <div>
                <h4 className="font-semibold text-gray-900">Menú Vegano</h4>
                <div className="mt-2 space-y-2">
                  {locationData.menu.veganMenuUrl ? (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Enlace al Menú:</span>
                      <a 
                        href={locationData.menu.veganMenuUrl} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-brand-purple hover:underline"
                      >
                        Ver Menú Vegano
                      </a>
                    </div>
                  ) : (
                    locationData.menu.veganMenu ? (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Archivo de Menú:</span>
                        <span className="text-brand-purple">Archivo subido</span>
                      </div>
                    ) : (
                      <p className="text-gray-500 italic">No hay información del menú vegano disponible</p>
                    )
                  )}
                </div>
              </div>
            )}
            
            <div>
              <h4 className="font-semibold text-gray-900">Platos y Bebidas Populares</h4>
              <div className="mt-2 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Platos Compartidos:</span>
                  <span>{locationData.menu?.sharedDishes || 'No hay información disponible'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Bebidas Compartidas:</span>
                  <span>{locationData.menu?.sharedDrinks || 'No hay información disponible'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Entrantes Populares:</span>
                  <span>{locationData.menu?.popularAppetizers || 'No hay información disponible'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Platos Principales Populares:</span>
                  <span>{locationData.menu?.popularMainCourses || 'No hay información disponible'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Postres Populares:</span>
                  <span>{locationData.menu?.popularDesserts || 'No hay información disponible'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Bebidas Alcohólicas Populares:</span>
                  <span>{locationData.menu?.popularAlcoholicDrinks || 'No hay información disponible'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Bebidas No Alcohólicas Populares:</span>
                  <span>{locationData.menu?.popularNonAlcoholicDrinks || 'No hay información disponible'}</span>
                </div>
              </div>
            </div>
          </div>
        );

      case 'menu':
        // Verificar si hay datos significativos del menú
        const hasMenuData = locationData.menu && (
          locationData.menu.regularMenu || 
          locationData.menu.regularMenuUrl || 
          locationData.menu.dietaryMenu || 
          locationData.menu.dietaryMenuUrl ||
          locationData.menu.veganMenu ||
          locationData.menu.veganMenuUrl ||
          locationData.menu.sharedDishes ||
          locationData.menu.popularAppetizers
        );
        
        if (!hasMenuData) {
          return (
            <div className="py-6 text-center">
              <p className="text-gray-500 italic">No hay información del menú disponible para esta ubicación</p>
            </div>
          );
        }
        return (
          <div className="space-y-6">
            <div>
              <h4 className="font-semibold text-gray-900">Menú Regular</h4>
              <div className="mt-2 space-y-2">
                {locationData.menu?.regularMenuUrl ? (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Enlace al Menú:</span>
                    <a 
                      href={locationData.menu.regularMenuUrl} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-brand-purple hover:underline"
                    >
                      Ver Menú Regular
                    </a>
                  </div>
                ) : (
                  locationData.menu?.regularMenu ? (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Archivo de Menú:</span>
                      <span className="text-brand-purple">Archivo subido</span>
                    </div>
                  ) : (
                    <p className="text-gray-500 italic">No hay información del menú regular disponible</p>
                  )
                )}
              </div>
            </div>
            
            {locationData.menu?.hasDietaryMenu && (
              <div>
                <h4 className="font-semibold text-gray-900">Menú Dietético</h4>
                <div className="mt-2 space-y-2">
                  {locationData.menu.dietaryMenuUrl ? (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Enlace al Menú:</span>
                      <a 
                        href={locationData.menu.dietaryMenuUrl} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-brand-purple hover:underline"
                      >
                        Ver Menú Dietético
                      </a>
                    </div>
                  ) : (
                    locationData.menu.dietaryMenu ? (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Archivo de Menú:</span>
                        <span className="text-brand-purple">Archivo subido</span>
                      </div>
                    ) : (
                      <p className="text-gray-500 italic">No hay información del menú dietético disponible</p>
                    )
                  )}
                </div>
              </div>
            )}
            
            {locationData.menu?.hasVeganMenu && (
              <div>
                <h4 className="font-semibold text-gray-900">Menú Vegano</h4>
                <div className="mt-2 space-y-2">
                  {locationData.menu.veganMenuUrl ? (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Enlace al Menú:</span>
                      <a 
                        href={locationData.menu.veganMenuUrl} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-brand-purple hover:underline"
                      >
                        Ver Menú Vegano
                      </a>
                    </div>
                  ) : (
                    locationData.menu.veganMenu ? (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Archivo de Menú:</span>
                        <span className="text-brand-purple">Archivo subido</span>
                      </div>
                    ) : (
                      <p className="text-gray-500 italic">No hay información del menú vegano disponible</p>
                    )
                  )}
                </div>
              </div>
            )}
            
            <div>
              <h4 className="font-semibold text-gray-900">Platos y Bebidas Populares</h4>
              <div className="mt-2 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Platos Compartidos:</span>
                  <span>{locationData.menu?.sharedDishes || 'No hay información disponible'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Bebidas Compartidas:</span>
                  <span>{locationData.menu?.sharedDrinks || 'No hay información disponible'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Entrantes Populares:</span>
                  <span>{locationData.menu?.popularAppetizers || 'No hay información disponible'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Platos Principales Populares:</span>
                  <span>{locationData.menu?.popularMainCourses || 'No hay información disponible'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Postres Populares:</span>
                  <span>{locationData.menu?.popularDesserts || 'No hay información disponible'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Bebidas Alcohólicas Populares:</span>
                  <span>{locationData.menu?.popularAlcoholicDrinks || 'No hay información disponible'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Bebidas No Alcohólicas Populares:</span>
                  <span>{locationData.menu?.popularNonAlcoholicDrinks || 'No hay información disponible'}</span>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="py-6 text-center">
            <p className="text-gray-500">Selecciona una pestaña para ver la información</p>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-lg shadow-xl flex flex-col">
        {/* Header con título y botón de cierre */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">{locationData.locationName || 'Detalles de ubicación'}</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 focus:outline-none"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Contenedor de tabs con navegación */}
        <div className="relative">
          {/* Botón para desplazar a la izquierda */}
          {showLeftArrow && (
            <button 
              onClick={scrollLeft}
              className="absolute left-0 top-0 bottom-0 z-10 px-2 bg-gradient-to-r from-white to-transparent flex items-center justify-center"
              aria-label="Scroll left"
            >
              <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          
          {/* Tabs scrollables */}
          <div 
            className="flex overflow-x-auto py-2 px-4 border-b border-gray-200 no-scrollbar" 
            ref={tabsContainerRef}
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setCurrentTab(tab.id)}
                className={`px-4 py-2 font-medium rounded-md whitespace-nowrap flex-shrink-0 mx-1 min-w-fit transition-colors duration-200 ${
                  currentTab === tab.id
                    ? 'bg-brand-purple text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          
          {/* Botón para desplazar a la derecha */}
          {showRightArrow && (
            <button 
              onClick={scrollRight}
              className="absolute right-0 top-0 bottom-0 z-10 px-2 bg-gradient-to-l from-white to-transparent flex items-center justify-center"
              aria-label="Scroll right"
            >
              <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </div>
        
        {/* Contenido del tab */}
        <div className="flex-1 overflow-y-auto p-6">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

interface SectionProps {
  title: string
  children: React.ReactNode
  onEdit: () => void
}

function Section({ title, children, onEdit }: SectionProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">{title}</h3>
        <button
          type="button"
          onClick={onEdit}
          className="text-sm font-medium text-brand-purple hover:text-brand-purple-dark"
        >
          Editar
        </button>
      </div>
      <div className="mt-4 space-y-4">{children}</div>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string | number | boolean | string[] | undefined }) {
  // Manejo de valores undefined o null
  if (value === undefined || value === null) {
    value = 'No proporcionado';
  }
  
  const displayValue = Array.isArray(value) ? value.join(', ') : String(value)
  
  return (
    <div className="grid grid-cols-3 gap-4 py-2">
      <dt className="text-sm font-medium text-gray-500">{label}</dt>
      <dd className="col-span-2 text-sm text-gray-900">{displayValue}</dd>
    </div>
  )
}

export default function Review() {
  const navigate = useNavigate()
  const { formData: originalFormData, loading, error } = useFormProgress()
  const { state } = useForm() // Añadir acceso al contexto del formulario
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Estado para el modal
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState<LocationSpecificData | null>(null)
  const [currentTab, setCurrentTab] = useState('details')
  
  // Cast formData a ExtendedFormData para tener acceso a las propiedades adicionales
  const formData = originalFormData as ExtendedFormData
  
  // Añadir logs para depuración
  useEffect(() => {
    console.log("Review - formData completo:", formData);
    console.log("Review - aiConfig desde formData:", formData.aiConfig);
    console.log("Review - FormContext state:", state);
    console.log("Review - FormContext aiConfig:", state.aiConfig);
    
    // Nuevos logs para depurar datos de ubicación
    console.log("Review - Locations:", formData.locations);
    console.log("Review - LocationDetails:", formData.locationDetails);
    console.log("Review - LocationPolicies:", formData.locationPolicies);
  }, [formData, state]);
  
  // Función para extraer datos específicos de cada ubicación
  const getLocationSpecificData = (locationId: string, locationName: string): LocationSpecificData => {
    const locationIndex = locationId.replace('location-', '');
    const numericIndex = parseInt(locationIndex, 10);
    
    console.log(`Buscando datos para ubicación: ID=${locationId}, Nombre=${locationName}, Índice=${numericIndex}`);
    
    // Comprobar si estamos usando datos del contexto o de formData
    console.log("Estado del formulario:", state);
    console.log("FormData locations:", formData.locations);
    console.log("FormData locationDetails:", formData.locationDetails);
    
    let locationDetails;
    
    // PRIMERA PRIORIDAD: Buscar en locationDetails del estado del formulario
    if (state.locationDetails && Array.isArray(state.locationDetails)) {
      locationDetails = state.locationDetails.find(detail => 
        detail.locationId === locationId || detail.selectedLocationName === locationName
      );
      
      if (locationDetails) {
        console.log("ENCONTRADO en state.locationDetails:", locationDetails);
      }
    }
    
    // SEGUNDA PRIORIDAD: Buscar en formData.locationDetails
    if (!locationDetails && formData.locationDetails && Array.isArray(formData.locationDetails)) {
      locationDetails = formData.locationDetails.find(detail => 
        detail.locationId === locationId || detail.selectedLocationName === locationName
      );
      
      if (locationDetails) {
        console.log("ENCONTRADO en formData.locationDetails:", locationDetails);
      }
    }
    
    // TERCERA PRIORIDAD: Usar el objeto completo de locations si existe
    if (!locationDetails && formData.locations && formData.locations[numericIndex]) {
      const locationData = formData.locations[numericIndex] as any; // Cast a any para evitar errores de TypeScript
      
      // Si el objeto de location tiene la información detallada directamente
      if (locationData.details || locationData.state || locationData.streetAddress) {
        locationDetails = {
          locationId: locationId,
          selectedLocationName: locationData.name,
          ...(locationData.details || locationData)
        };
        console.log("ENCONTRADO en formData.locations con datos detallados:", locationDetails);
      }
    }
    
    // CUARTA PRIORIDAD: Buscar información en ubicaciones adicionales del state si existen
    if (!locationDetails && state.locations && state.locations[numericIndex]) {
      const stateLocation = state.locations[numericIndex] as any;
      locationDetails = {
        locationId: locationId,
        selectedLocationName: stateLocation.name,
        ...(stateLocation.details || stateLocation)
      };
      console.log("ENCONTRADO en state.locations:", locationDetails);
    }
    
    // QUINTA PRIORIDAD: Buscar en todos los campos posibles
    if (!locationDetails || !Object.keys(locationDetails).length) {
      // Combinar todos los datos posibles de las diferentes fuentes
      const allStateData: any = state || {};
      const allFormData: any = formData || {};
      
      // Intentar encontrar los datos en cualquier lugar del estado
      const combinedLocationData = {
        locationId,
        selectedLocationName: locationName
      };
      
      // Verificar todas las propiedades posibles donde pueden estar los datos
      for (const key in allStateData) {
        if (typeof allStateData[key] === 'object' && allStateData[key] !== null) {
          // Si la propiedad es un objeto con un campo que coincide con el locationId
          if (allStateData[key][locationId]) {
            Object.assign(combinedLocationData, allStateData[key][locationId]);
            console.log(`ENCONTRADO datos en state.${key}[${locationId}]:`, allStateData[key][locationId]);
          }
          
          // Si la propiedad es un array, buscar en cada elemento
          if (Array.isArray(allStateData[key])) {
            const matchedItem = allStateData[key].find((item: any) => 
              item && (item.locationId === locationId || item.selectedLocationName === locationName)
            );
            if (matchedItem) {
              Object.assign(combinedLocationData, matchedItem);
              console.log(`ENCONTRADO datos en state.${key} array:`, matchedItem);
            }
          }
        }
      }
      
      // Repetir el mismo proceso para formData
      for (const key in allFormData) {
        if (typeof allFormData[key] === 'object' && allFormData[key] !== null) {
          if (allFormData[key][locationId]) {
            Object.assign(combinedLocationData, allFormData[key][locationId]);
            console.log(`ENCONTRADO datos en formData.${key}[${locationId}]:`, allFormData[key][locationId]);
          }
          
          if (Array.isArray(allFormData[key])) {
            const matchedItem = allFormData[key].find((item: any) => 
              item && (item.locationId === locationId || item.selectedLocationName === locationName)
            );
            if (matchedItem) {
              Object.assign(combinedLocationData, matchedItem);
              console.log(`ENCONTRADO datos en formData.${key} array:`, matchedItem);
            }
          }
        }
      }
      
      // Si encontramos al menos algunos datos, usarlos
      if (Object.keys(combinedLocationData).length > 2) { // más que solo locationId y selectedLocationName
        locationDetails = combinedLocationData;
        console.log("DATOS COMBINADOS de múltiples fuentes:", locationDetails);
      }
    }
    
    // Si no se encontraron datos reales, simplemente crear un objeto básico
    if (!locationDetails) {
      console.log("NO SE ENCONTRARON DATOS REALES, creando un objeto básico para la ubicación");
      locationDetails = {
        locationId,
        selectedLocationName: locationName
      };
    }
    
    console.log("LocationDetails finales:", locationDetails);
    
    // Buscar política de propinas - PRIMERO EN STATE, luego en formData
    let tipPolicy;
    
    // Acceder con cuidado a las propiedades que podrían no existir
    const stateAny = state as any; // Cast a any para acceder a propiedades opcionales
    
    if (stateAny.locationPolicies && stateAny.locationPolicies[locationId]) {
      tipPolicy = stateAny.locationPolicies[locationId];
      console.log("ENCONTRADO tipPolicy en state:", tipPolicy);
    } else if (formData.locationPolicies && formData.locationPolicies[locationId]) {
      tipPolicy = formData.locationPolicies[locationId];
      console.log("ENCONTRADO tipPolicy en formData:", tipPolicy);
    } else if (stateAny.tipsPolicy && stateAny.tipsPolicy.locationPolicies && stateAny.tipsPolicy.locationPolicies[locationId]) {
      tipPolicy = stateAny.tipsPolicy.locationPolicies[locationId];
      console.log("ENCONTRADO tipPolicy en state.tipsPolicy:", tipPolicy);
    } else if (formData.tipsPolicy && formData.tipsPolicy.locationPolicies && formData.tipsPolicy.locationPolicies[locationId]) {
      tipPolicy = formData.tipsPolicy.locationPolicies[locationId];
      console.log("ENCONTRADO tipPolicy en formData.tipsPolicy:", tipPolicy);
    }
    
    // Buscar en locationDetails si contiene políticas de propinas
    if (!tipPolicy && locationDetails.tipPolicy) {
      tipPolicy = locationDetails.tipPolicy;
      console.log("ENCONTRADO tipPolicy en locationDetails:", tipPolicy);
    }
    
    // Buscar información de reservaciones - PRIMERO DATOS REALES
    let reservationSettings = locationDetails.reservationSettings;
    
    // También buscar en state
    if (!reservationSettings && stateAny.reservations && stateAny.reservations[locationId]) {
      reservationSettings = stateAny.reservations[locationId];
      console.log("ENCONTRADO reservationSettings en state:", reservationSettings);
    }
    
    // Buscar información de menú
    let menuGroup;
    
    if (state.menuGroups && Array.isArray(state.menuGroups)) {
      menuGroup = state.menuGroups.find(group => 
        group.locations?.includes(locationName)
      );
      
      if (menuGroup) {
        console.log("ENCONTRADO menuGroup en state:", menuGroup);
      }
    }
    
    if (!menuGroup && formData.menuGroups && Array.isArray(formData.menuGroups)) {
      menuGroup = formData.menuGroups.find(group => 
        group.locations?.includes(locationName)
      );
      
      if (menuGroup) {
        console.log("ENCONTRADO menuGroup en formData:", menuGroup);
      }
    }
    
    // También buscar en locationDetails
    if (!menuGroup && locationDetails.menu) {
      menuGroup = locationDetails.menu;
      console.log("ENCONTRADO menuGroup en locationDetails:", menuGroup);
    }
    
    // Buscar información de pickup/takeout y delivery
    let pickupSettings = locationDetails.pickupSettings;
    let deliverySettings = locationDetails.deliverySettings;
    
    // Buscar en ubicaciones adicionales dentro del state/formData
    if (!pickupSettings && locationDetails.pickup) {
      pickupSettings = locationDetails.pickup;
    }
    
    if (!deliverySettings && locationDetails.delivery) {
      deliverySettings = locationDetails.delivery;
    }
    
    // Buscar políticas del restaurante
    let policies;
    
    // Primero verificar si hay políticas reales en locationDetails
    if (locationDetails && (
      locationDetails.parking || 
      locationDetails.corkage || 
      locationDetails.specialDiscounts ||
      locationDetails.birthdayCelebrations ||
      locationDetails.dressCode ||
      locationDetails.ageVerification ||
      locationDetails.smokingArea ||
      locationDetails.brunchMenu ||
      locationDetails.policies
    )) {
      // Si hay políticas directamente en locationDetails
      const realPolicies = locationDetails.policies || {};
      
      policies = {
        parking: locationDetails.parking || realPolicies.parking,
        corkage: locationDetails.corkage || realPolicies.corkage,
        specialDiscounts: locationDetails.specialDiscounts || realPolicies.specialDiscounts,
        birthdayCelebrations: locationDetails.birthdayCelebrations || realPolicies.birthdayCelebrations,
        dressCode: locationDetails.dressCode || realPolicies.dressCode,
        ageVerification: locationDetails.ageVerification || realPolicies.ageVerification,
        smokingArea: locationDetails.smokingArea || realPolicies.smokingArea,
        brunchMenu: locationDetails.brunchMenu || realPolicies.brunchMenu
      };
      
      console.log("ENCONTRADAS políticas reales:", policies);
    }
    
    // Asegurarse de que los datos específicos estén presentes y correctos
    
    // Verificar exclusiones de tarjeta de crédito específicamente
    const creditCardExclusions = locationDetails.creditCardExclusions || 
                               (locationDetails.paymentMethods && locationDetails.paymentMethods.creditCardExclusions) ||
                               (locationDetails.details && locationDetails.details.creditCardExclusions);
    if (creditCardExclusions && !locationDetails.creditCardExclusions) {
      locationDetails.creditCardExclusions = creditCardExclusions;
      console.log("Asignado creditCardExclusions:", creditCardExclusions);
    }
    
    // Verificar exclusiones de tarjeta de débito específicamente
    const debitCardExclusions = locationDetails.debitCardExclusions || 
                              (locationDetails.paymentMethods && locationDetails.paymentMethods.debitCardExclusions) ||
                              (locationDetails.details && locationDetails.details.debitCardExclusions);
    if (debitCardExclusions && !locationDetails.debitCardExclusions) {
      locationDetails.debitCardExclusions = debitCardExclusions;
      console.log("Asignado debitCardExclusions:", debitCardExclusions);
    }
    
    // Verificar exclusiones de pago móvil específicamente
    const mobilePaymentExclusions = locationDetails.mobilePaymentExclusions || 
                                  (locationDetails.paymentMethods && locationDetails.paymentMethods.mobilePaymentExclusions) ||
                                  (locationDetails.details && locationDetails.details.mobilePaymentExclusions);
    if (mobilePaymentExclusions && !locationDetails.mobilePaymentExclusions) {
      locationDetails.mobilePaymentExclusions = mobilePaymentExclusions;
      console.log("Asignado mobilePaymentExclusions:", mobilePaymentExclusions);
    }
    
    // Verificar tiempos de espera específicamente
    const waitTimes = locationDetails.waitTimes || 
                    (locationDetails.scheduleInfo && locationDetails.scheduleInfo.waitTimes) ||
                    (locationDetails.details && locationDetails.details.waitTimes) ||
                    (stateAny.waitTimes && stateAny.waitTimes[locationId]) ||
                    (stateAny.schedule && stateAny.schedule[locationId] && stateAny.schedule[locationId].waitTimes) ||
                    (stateAny.locations && stateAny.locations[numericIndex] && stateAny.locations[numericIndex].waitTimes);
    
    if (waitTimes) {
      locationDetails.waitTimes = waitTimes;
      console.log("Asignado waitTimes:", waitTimes);
    }
    
    // Verificar horarios específicamente
    const schedule = locationDetails.schedule || 
                   (locationDetails.scheduleInfo && locationDetails.scheduleInfo.schedule) ||
                   (locationDetails.details && locationDetails.details.schedule);
    if (schedule && !locationDetails.schedule) {
      locationDetails.schedule = schedule;
      console.log("Asignado schedule:", schedule);
    }
    
    // Crear y retornar el objeto completo con toda la información
    const result = {
      locationId,
      locationName,
      details: locationDetails,
      tipPolicy,
      reservations: reservationSettings,
      menu: menuGroup,
      pickup: pickupSettings,
      delivery: deliverySettings,
      policies,
    };
    
    console.log("Datos completos de ubicación:", result);
    return result;
  };
  
  // Función para abrir el modal con la información de una ubicación específica
  const openLocationDetails = (locationId: string, locationName: string) => {
    const locationData = getLocationSpecificData(locationId, locationName);
    setSelectedLocation(locationData);
    setCurrentTab('details');
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true)
      // Aquí normalmente enviarías todos los datos a tu backend
      // await submitData(formData)
      alert('¡Formulario enviado exitosamente!')
      setIsSubmitting(false)
    } catch (error) {
      console.error('Error al enviar el formulario:', error)
      alert('Hubo un error al enviar el formulario. Por favor intente nuevamente.')
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Spinner />
        <p className="text-center text-gray-600">Cargando información del formulario...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-md p-4 text-center">
          <p className="text-red-600">Error al cargar los datos del formulario: {error}</p>
          <button 
            onClick={() => navigate('/onboarding/observations')} 
            className="mt-4 px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200">
            Volver al paso anterior
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">Revise Su Información</h2>
        <p className="mt-2 text-sm text-gray-600">
          Por favor revise toda la información antes del envío final.
        </p>
      </div>

      <div className="space-y-6">
        {formData.locations && formData.locations.length > 0 && (
          <Section title="Ubicaciones" onEdit={() => navigate('/onboarding/legal-data')}>
            <p className="text-sm text-gray-600 mb-4">
              Haga clic en cada ubicación para ver su información detallada, incluyendo políticas de propinas, reservaciones y configuración de menú.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {formData.locations.map((location, index) => (
                <div 
                  key={index}
                  onClick={() => openLocationDetails(`location-${index}`, location.name)}
                  className="flex items-center p-4 rounded-lg border border-gray-200 bg-white shadow-sm hover:shadow-md hover:border-brand-purple cursor-pointer transition-all duration-200"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-brand-purple to-brand-orange flex items-center justify-center text-white font-bold mr-3">
                    {index + 1}
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{location.name}</h4>
                    <p className="text-sm text-brand-purple mt-1">Ver detalles →</p>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        <Section title="Datos Legales" onEdit={() => navigate('/onboarding/legal-data')}>
          <InfoRow label="Nombre Legal del Negocio" value={formData.legalBusinessName} />
          <InfoRow label="Tipo de Restaurante" value={formData.restaurantType} />
          <InfoRow label="EIN Number" value={formData.taxId} />
          {formData.legalDocuments && formData.legalDocuments.length > 0 ? (
            <InfoRow 
              label="EIN Confirmation Letter" 
              value={formData.legalDocuments.join(', ')} 
            />
          ) : (
            <InfoRow 
              label="EIN Confirmation Letter" 
              value={formData.irsLetter ? formData.irsLetter.name : 'No proporcionado'} 
            />
          )}
        </Section>

        <Section title="Información de Contacto" onEdit={() => navigate('/onboarding/contact-info')}>
          <div className="space-y-6">
            {/* Responsable de Comunicación */}
            <div className="bg-white rounded-lg border border-gray-100 p-4">
              <h4 className="text-base font-medium text-gray-800 mb-3">Responsable de Comunicación</h4>
              <div className="space-y-4">
                <InfoRow label="Nombre Completo" value={formData.contactName} />
                <InfoRow label="Teléfono de Contacto" value={formData.phone} />
                <InfoRow label="Correo Electrónico" value={formData.email} />
              </div>
            </div>
            
            {/* Dirección de Oficina Principal */}
            <div className="bg-white rounded-lg border border-gray-100 p-4">
              <h4 className="text-base font-medium text-gray-800 mb-3">Dirección de Oficina Principal</h4>
              <div className="space-y-4">
                <InfoRow label="Dirección" value={formData.address} />
                <InfoRow label="Ciudad" value={formData.city} />
                <InfoRow label="Estado" value={formData.state} />
                <InfoRow label="Código Postal" value={formData.zipCode} />
              </div>
            </div>
          </div>
        </Section>

        <Section title="Configuración del Asistente Virtual" onEdit={() => navigate('/onboarding/ai-config')}>
          <div className="space-y-4">
            <InfoRow 
              label="Idioma Principal" 
              value={
                state.aiConfig?.language === 'en' ? 'English' : 
                state.aiConfig?.language === 'es' ? 'Spanish' : 
                (state.aiConfig?.language || 'No seleccionado')
              } 
            />
            
            <InfoRow 
              label="Nombre del Asistente" 
              value={state.aiConfig?.assistantName || 'No especificado'} 
            />
            
            <InfoRow 
              label="Género del Asistente" 
              value={
                state.aiConfig?.assistantGender === 'male' ? 'Male' :
                state.aiConfig?.assistantGender === 'female' ? 'Female' :
                state.aiConfig?.assistantGender === 'neutral' ? 'Gender Neutral' :
                'No seleccionado'
              } 
            />
            
            <div className="grid grid-cols-3 gap-4 py-2">
              <dt className="text-sm font-medium text-gray-500">Personalidad</dt>
              <dd className="col-span-2 text-sm text-gray-900">
                {state.aiConfig?.personality && state.aiConfig.personality.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {state.aiConfig.personality.map((trait, index) => (
                      <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-brand-purple bg-opacity-10 text-brand-purple">
                        {trait === 'warm' ? 'Warm' :
                        trait === 'formal' ? 'Formal' :
                        trait === 'friendly' ? 'Friendly' :
                        trait === 'professional' ? 'Professional' :
                        trait === 'casual' ? 'Casual' :
                        trait === 'enthusiastic' ? 'Enthusiastic' :
                        trait === 'other' && state.aiConfig?.otherPersonality ? state.aiConfig.otherPersonality : 
                        trait === 'other' ? 'Other' :
                        trait}
                      </span>
                    ))}
                  </div>
                ) : (
                  'No seleccionado'
                )}
              </dd>
            </div>
            
            <InfoRow 
              label="Información Adicional" 
              value={state.aiConfig?.additionalInfo || 'No proporcionada'} 
            />
          </div>
        </Section>

        {/* Observaciones adicionales */}
        <Section title="Notas Adicionales" onEdit={() => navigate('/onboarding/observations')}>
          <InfoRow label="Notas" value={formData.additionalNotes || 'No se proporcionaron notas adicionales'} />
          <InfoRow label="Términos Aceptados" value={formData.termsAccepted ? 'Sí' : 'No'} />
        </Section>

        <div className="flex justify-between pt-6">
          <button
            type="button"
            onClick={() => navigate('/onboarding/observations')}
            className="inline-flex items-center px-6 py-3 border border-gray-300 shadow-sm text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-purple transition duration-150"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Volver
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-gradient-to-r from-brand-purple to-brand-orange hover:from-brand-purple-dark hover:to-brand-orange-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-purple transition-all duration-150"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Enviando...
              </>
            ) : (
              <>
                Enviar Formulario
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Modal para mostrar información específica de ubicación */}
      {selectedLocation && (
        <LocationModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          locationData={selectedLocation}
          currentTab={currentTab}
          setCurrentTab={setCurrentTab}
        />
      )}
    </div>
  )
} 
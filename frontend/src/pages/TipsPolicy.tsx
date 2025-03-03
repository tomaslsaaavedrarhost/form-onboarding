import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Formik, Form, Field } from 'formik'
import * as Yup from 'yup'
import { useForm } from '../context/FormContext'
import { FormikErrors, FormikTouched } from 'formik'
import { useFormProgress } from '../hooks/useFormProgress'
import { Notification } from '../components/Notification'
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/solid'

// Extender la interfaz Window para incluir saveCurrentFormData
declare global {
  interface Window {
    onFormStateChange?: (hasChanges: boolean) => void;
    saveCurrentFormData?: () => Promise<boolean>;
  }
}

interface LocationPolicy {
  locationId: string
  hasTips: 'yes' | 'no' | 'depends'
  tipDetails: string
  hasServiceCharge: boolean
  serviceChargeDetails: string
  tipDistribution: string
  suggestedTipPercentages: string[]
  largeGroupPolicy: string
  largeGroupMinSize: number
  largeGroupTipPercentage: number
  eventCateringPolicy: string
  cardVsCashPolicy: string
}

interface GroupPolicy {
  groupId: string
  locations: string[]
  hasTips: 'yes' | 'no' | 'depends'
  tipDetails: string
  hasServiceCharge: boolean
  serviceChargeDetails: string
  tipDistribution: string
  suggestedTipPercentages: string[]
  largeGroupPolicy: string
  largeGroupMinSize: number
  largeGroupTipPercentage: number
  eventCateringPolicy: string
  cardVsCashPolicy: string
}

interface PolicyObject {
  hasTips: 'yes' | 'no' | 'depends'
  tipDetails: string
  hasServiceCharge: boolean
  serviceChargeDetails: string
  tipDistribution: string
  suggestedTipPercentages: string[]
  largeGroupPolicy: string
  largeGroupMinSize: number
  largeGroupTipPercentage: number
  eventCateringPolicy: string
  cardVsCashPolicy: string
}

interface TipsPolicyState {
  policyMode: 'individual' | 'single' | 'grouped' // individual: por ubicación, single: una para todas, grouped: por grupos
  locationPolicies: { [key: string]: PolicyObject }
  groupPolicies: { [key: string]: PolicyObject }
  locationGroups: { [key: string]: string[] } // Mapa de groupId -> array de locationIds
}

interface FormValues {
  policyMode: 'individual' | 'single' | 'grouped'
  locationPolicies: LocationPolicy[]
  groupPolicies: GroupPolicy[]
  locationGroups: { [key: string]: string[] } // Cambiado para coincidir con TipsPolicyState
}

const validationSchema = Yup.object().shape({
  policyMode: Yup.string().oneOf(['individual', 'single', 'grouped']).required(),
  locationPolicies: Yup.array().when('policyMode', {
    is: 'individual',
    then: () => Yup.array().of(
      Yup.object().shape({
        locationId: Yup.string().required(),
        hasTips: Yup.string()
          .required('Please select a tipping policy')
          .oneOf(['yes', 'no', 'depends']),
        tipDetails: Yup.string().when('hasTips', {
          is: (val: string) => val === 'yes' || val === 'depends',
          then: () => Yup.string().required('Please provide tip details'),
        }),
        hasServiceCharge: Yup.boolean().required('Please specify if there is a service charge'),
        serviceChargeDetails: Yup.string().when('hasServiceCharge', {
          is: true,
          then: () => Yup.string().required('Please provide service charge details'),
        }),
        tipDistribution: Yup.string(),
        suggestedTipPercentages: Yup.array().of(Yup.string()),
        largeGroupPolicy: Yup.string(),
        largeGroupMinSize: Yup.number().when('largeGroupPolicy', {
          is: (val: string) => val === 'automatic',
          then: () => Yup.number().min(1, 'Minimum size must be at least 1'),
        }),
        largeGroupTipPercentage: Yup.number().when('largeGroupPolicy', {
          is: (val: string) => val === 'automatic',
          then: () => Yup.number().min(0, 'Percentage must be positive'),
        }),
        eventCateringPolicy: Yup.string(),
        cardVsCashPolicy: Yup.string(),
      })
    ),
  }),
  groupPolicies: Yup.array().when('policyMode', {
    is: 'grouped',
    then: () => Yup.array().of(
      Yup.object().shape({
        groupId: Yup.string().required(),
        locations: Yup.array().of(Yup.string()).min(1, 'At least one location is required'),
        hasTips: Yup.string()
          .required('Please select a tipping policy')
          .oneOf(['yes', 'no', 'depends']),
        tipDetails: Yup.string().when('hasTips', {
          is: (val: string) => val === 'yes' || val === 'depends',
          then: () => Yup.string().required('Please provide tip details'),
        }),
        hasServiceCharge: Yup.boolean().required('Please specify if there is a service charge'),
        serviceChargeDetails: Yup.string().when('hasServiceCharge', {
          is: true,
          then: () => Yup.string().required('Please provide service charge details'),
        }),
        tipDistribution: Yup.string(),
        suggestedTipPercentages: Yup.array().of(Yup.string()),
        largeGroupPolicy: Yup.string(),
        largeGroupMinSize: Yup.number().when('largeGroupPolicy', {
          is: (val: string) => val === 'automatic',
          then: () => Yup.number().min(1, 'Minimum size must be at least 1'),
        }),
        largeGroupTipPercentage: Yup.number().when('largeGroupPolicy', {
          is: (val: string) => val === 'automatic',
          then: () => Yup.number().min(0, 'Percentage must be positive'),
        }),
        eventCateringPolicy: Yup.string(),
        cardVsCashPolicy: Yup.string(),
      })
    ),
  }),
})

// Componente para secciones con el formato consistente
const SectionCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="bg-white shadow-lg rounded-2xl overflow-hidden mb-6 transition-all duration-300 hover:shadow-xl">
    <div className="px-6 py-5 border-b border-gray-100">
      <h2 className="text-xl font-bold bg-gradient-to-r from-brand-orange to-brand-purple bg-clip-text text-transparent">{title}</h2>
    </div>
    <div className="px-6 py-6">{children}</div>
  </div>
);

// Componente Acordeón
interface AccordionProps {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

const Accordion = ({ title, isOpen, onToggle, children }: AccordionProps) => {
  return (
    <div className="bg-white shadow-lg rounded-2xl mb-6 overflow-hidden transition-all duration-300 hover:shadow-xl">
      <div 
        className="p-5 cursor-pointer flex justify-between items-center border-b border-gray-100"
        onClick={onToggle}
      >
        <div>
          <h3 className="text-xl font-bold bg-gradient-to-r from-brand-orange to-brand-purple bg-clip-text text-transparent">{title}</h3>
        </div>
        <button 
          type="button"
          onClick={onToggle}
          aria-label={isOpen ? 'Cerrar sección' : 'Abrir sección'}
          className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-r from-brand-orange to-brand-purple text-white shadow-md focus:outline-none transition-transform duration-300 transform hover:scale-105"
        >
          {isOpen ? (
            <ChevronUpIcon className="h-5 w-5" />
          ) : (
            <ChevronDownIcon className="h-5 w-5" />
          )}
        </button>
      </div>
      <div className={`p-6 ${isOpen ? 'block animate-fadeIn' : 'hidden'}`}>
        {children}
      </div>
    </div>
  );
};

// Definición de constantes para las opciones
const TIP_DISTRIBUTION_OPTIONS = [
  { value: 'equal', label: 'Distribución equitativa entre todo el personal' },
  { value: 'position', label: 'Distribución basada en la posición/rol' },
  { value: 'pool', label: 'Sistema de pool de propinas' },
  { value: 'individual', label: 'Las propinas van directamente al servidor' },
  { value: 'other', label: 'Otro (especificar en detalles)' }
];

const COMMON_TIP_PERCENTAGES = ['15%', '18%', '20%', '22%', '25%', 'Otro'];

const LARGE_GROUP_POLICIES = [
  { value: 'automatic', label: 'Propina automática para grupos grandes' },
  { value: 'suggested', label: 'Propina sugerida (no automática)' },
  { value: 'no_policy', label: 'Sin política específica' }
];

export default function TipsPolicy() {
  const navigate = useNavigate()
  const { state, dispatch } = useForm()
  const { formData, saveFormData } = useFormProgress()
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [showSavePrompt, setShowSavePrompt] = useState(false)
  const [showNotification, setShowNotification] = useState(false)
  const [openAccordions, setOpenAccordions] = useState<{[key: string]: boolean}>({})

  // Usar las ubicaciones de formData (Datos Legales) como fallback si state.locations está vacío
  const [locations, setLocations] = useState<Array<{id: string; name: string}>>([])

  // Obtener las ubicaciones disponibles del contexto o de formData
  useEffect(() => {
    // Priorizar las ubicaciones desde state.locations, y usar formData.locations como fallback
    const availableLocations = (state.locations && state.locations.length > 0) 
      ? state.locations 
      : ((formData.locations && formData.locations.length > 0) 
        ? formData.locations.map(loc => ({ id: loc.name, name: loc.name }))
        : []);
    
    setLocations(availableLocations);
    
    // Inicializar el primer acordeón si hay ubicaciones
    if (availableLocations.length > 0) {
      setOpenAccordions(prev => ({ ...prev, [availableLocations[0].id]: true }));
    }
    
    // Inicializar acordeones para grupos existentes
    if (state.tipsPolicy?.locationGroups) {
      Object.keys(state.tipsPolicy.locationGroups).forEach(groupId => {
        // Abre automáticamente el primer grupo
        if (Object.keys(state.tipsPolicy.locationGroups).indexOf(groupId) === 0) {
          setOpenAccordions(prev => ({ ...prev, [groupId]: true }));
        }
      });
    }
  }, [state.locations, formData.locations, state.tipsPolicy?.locationGroups]);

  const toggleAccordion = (id: string) => {
    console.log(`Toggling accordion for ${id}, current state: ${!!openAccordions[id]}`);
    setOpenAccordions(prev => {
      const newState = {
        ...prev,
        [id]: !prev[id]
      };
      console.log("New accordion states:", newState);
      return newState;
    });
  };

  const getEmptyPolicyObject = (): PolicyObject => ({
    hasTips: 'yes',
    tipDetails: '',
    hasServiceCharge: false,
    serviceChargeDetails: '',
    tipDistribution: 'equal',
    suggestedTipPercentages: ['15%', '18%', '20%'],
    largeGroupPolicy: 'no_policy',
    largeGroupMinSize: 8,
    largeGroupTipPercentage: 18,
    eventCateringPolicy: '',
    cardVsCashPolicy: ''
  });

  // Asegurarse de que los initialValues tengan datos de políticas para todas las ubicaciones
  const ensureLocationPolicies = () => {
    // Si no hay ubicaciones configuradas, devolver un array con ubicación por defecto
    if (locations.length === 0) {
      return [{
        locationId: 'default',
        ...getEmptyPolicyObject()
      }];
    }
    
    return locations.map(location => {
      const existingPolicy = state.tipsPolicy?.locationPolicies?.[location.id];
      return {
        locationId: location.id,
        ...getEmptyPolicyObject(),
        ...(existingPolicy || {})
      };
    });
  };

  // Ensure we also check formData for tips policy when initializing
  useEffect(() => {
    // If there's tip policy data in formData but not in state, initialize state from formData
    if (formData.tipsPolicy && (!state.tipsPolicy || Object.keys(state.tipsPolicy).length === 0)) {
      dispatch({
        type: 'SET_TIPS_POLICY',
        payload: formData.tipsPolicy
      });
    }
  }, [formData, state.tipsPolicy, dispatch]);

  const initialValues: FormValues = {
    policyMode: state.tipsPolicy?.policyMode || 'individual',
    locationPolicies: ensureLocationPolicies(),
    groupPolicies: state.menuGroups.map(group => ({
      groupId: group.name,
      locations: group.locations || [],
      ...getEmptyPolicyObject(),
      ...state.tipsPolicy?.groupPolicies?.[group.name]
    })),
    locationGroups: state.tipsPolicy?.locationGroups || {},
  }

  // Comunicar cambios al componente padre
  useEffect(() => {
    if (window.onFormStateChange) {
      window.onFormStateChange(hasUnsavedChanges);
    }
  }, [hasUnsavedChanges]);

  const handleSave = useCallback(async (values: FormValues) => {
    // Convert array policies to object format
    const locationPolicies: { [key: string]: PolicyObject } = {}
    values.locationPolicies.forEach(policy => {
      const { locationId, ...rest } = policy;
      // Ensure all properties are included
      locationPolicies[locationId] = {
        hasTips: rest.hasTips || 'no',
        tipDetails: rest.tipDetails || '',
        hasServiceCharge: rest.hasServiceCharge || false,
        serviceChargeDetails: rest.serviceChargeDetails || '',
        tipDistribution: rest.tipDistribution || 'equal',
        suggestedTipPercentages: rest.suggestedTipPercentages || [],
        largeGroupPolicy: rest.largeGroupPolicy || 'no_policy',
        largeGroupMinSize: rest.largeGroupMinSize || 8,
        largeGroupTipPercentage: rest.largeGroupTipPercentage || 18,
        eventCateringPolicy: rest.eventCateringPolicy || '',
        cardVsCashPolicy: rest.cardVsCashPolicy || ''
      };
    })

    const groupPolicies: { [key: string]: PolicyObject } = {}
    values.groupPolicies.forEach(policy => {
      const { groupId, ...rest } = policy;
      // Ensure all properties are included
      groupPolicies[groupId] = {
        hasTips: rest.hasTips || 'no',
        tipDetails: rest.tipDetails || '',
        hasServiceCharge: rest.hasServiceCharge || false,
        serviceChargeDetails: rest.serviceChargeDetails || '',
        tipDistribution: rest.tipDistribution || 'equal',
        suggestedTipPercentages: rest.suggestedTipPercentages || [],
        largeGroupPolicy: rest.largeGroupPolicy || 'no_policy',
        largeGroupMinSize: rest.largeGroupMinSize || 8,
        largeGroupTipPercentage: rest.largeGroupTipPercentage || 18,
        eventCateringPolicy: rest.eventCateringPolicy || '',
        cardVsCashPolicy: rest.cardVsCashPolicy || ''
      };
    })

    dispatch({
      type: 'SET_TIPS_POLICY',
      payload: {
        policyMode: values.policyMode,
        locationPolicies,
        groupPolicies,
        locationGroups: values.locationGroups
      }
    })
    
    await saveFormData()
    setHasUnsavedChanges(false)
    setShowNotification(true)
    setTimeout(() => setShowNotification(false), 3000)
    return true // Indicar que el guardado fue exitoso
  }, [dispatch, saveFormData, setHasUnsavedChanges, setShowNotification]);

  // Exponer handleSave a través de window.saveCurrentFormData
  useEffect(() => {
    window.saveCurrentFormData = async () => {
      // Obtenemos los valores actuales del formulario
      const formikContext = document.querySelector('form')?.getAttribute('data-formik-values');
      if (formikContext) {
        try {
          const values = JSON.parse(formikContext);
          return await handleSave(values);
        } catch (e) {
          console.error('Error al parsear los valores del formulario:', e);
          return false;
        }
      }
      return false;
    };
    
    return () => {
      window.saveCurrentFormData = undefined;
    };
  }, [handleSave]);

  const handleSubmit = (values: FormValues) => {
    if (hasUnsavedChanges) {
      setShowSavePrompt(true)
    } else {
      // Convert array policies to object format
      const locationPolicies: { [key: string]: PolicyObject } = {}
      values.locationPolicies.forEach(policy => {
        const { locationId, ...rest } = policy;
        // Ensure all properties are included
        locationPolicies[locationId] = {
          hasTips: rest.hasTips || 'no',
          tipDetails: rest.tipDetails || '',
          hasServiceCharge: rest.hasServiceCharge || false,
          serviceChargeDetails: rest.serviceChargeDetails || '',
          tipDistribution: rest.tipDistribution || 'equal',
          suggestedTipPercentages: rest.suggestedTipPercentages || [],
          largeGroupPolicy: rest.largeGroupPolicy || 'no_policy',
          largeGroupMinSize: rest.largeGroupMinSize || 8,
          largeGroupTipPercentage: rest.largeGroupTipPercentage || 18,
          eventCateringPolicy: rest.eventCateringPolicy || '',
          cardVsCashPolicy: rest.cardVsCashPolicy || ''
        };
      })

      const groupPolicies: { [key: string]: PolicyObject } = {}
      values.groupPolicies.forEach(policy => {
        const { groupId, ...rest } = policy;
        // Ensure all properties are included
        groupPolicies[groupId] = {
          hasTips: rest.hasTips || 'no',
          tipDetails: rest.tipDetails || '',
          hasServiceCharge: rest.hasServiceCharge || false,
          serviceChargeDetails: rest.serviceChargeDetails || '',
          tipDistribution: rest.tipDistribution || 'equal',
          suggestedTipPercentages: rest.suggestedTipPercentages || [],
          largeGroupPolicy: rest.largeGroupPolicy || 'no_policy',
          largeGroupMinSize: rest.largeGroupMinSize || 8,
          largeGroupTipPercentage: rest.largeGroupTipPercentage || 18,
          eventCateringPolicy: rest.eventCateringPolicy || '',
          cardVsCashPolicy: rest.cardVsCashPolicy || ''
        };
      })

      dispatch({
        type: 'SET_TIPS_POLICY',
        payload: {
          policyMode: values.policyMode,
          locationPolicies,
          groupPolicies,
          locationGroups: values.locationGroups
        }
      })
      navigate('/onboarding/observations')
    }
  }

  const handleFieldChange = (field: string, value: any) => {
    setHasUnsavedChanges(true)
    const currentState = { ...state.tipsPolicy } as TipsPolicyState
    if (field.startsWith('locationPolicies.')) {
      const parts = field.split('.')
      const locationId = parts[1]
      const prop = parts.slice(2).join('.')
      
      currentState.locationPolicies[locationId] = {
        ...currentState.locationPolicies[locationId],
        [prop]: value
      }
    } else if (field.startsWith('groupPolicies.')) {
      const parts = field.split('.')
      const groupId = parts[1]
      const prop = parts.slice(2).join('.')
      
      currentState.groupPolicies[groupId] = {
        ...currentState.groupPolicies[groupId],
        [prop]: value
      }
    } else {
      (currentState as any)[field] = value
    }

    dispatch({
      type: 'SET_TIPS_POLICY',
      payload: currentState
    })
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
                navigate('/onboarding/observations')
              }}
              className="btn-secondary"
            >
              Continuar sin guardar
            </button>
            <button
              onClick={async () => {
                try {
                  // Usamos directamente los valores actuales del formulario desde formData
                  const success = await saveFormData();
                  if (success) {
                    setShowSavePrompt(false);
                    setHasUnsavedChanges(false);
                    navigate('/onboarding/observations');
                  }
                } catch (e) {
                  console.error('Error al guardar los datos:', e);
                }
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

  const renderAdvancedTipFields = (
    prefix: string,
    values: any,
    errors: any,
    touched: any,
    setFieldValue: (field: string, value: any) => void
  ) => (
    <div className="mt-8 space-y-8">
      <div className="border-t border-gray-200 pt-6">
        <h4 className="text-md font-medium text-gray-900 mb-4">Configuración avanzada de propinas</h4>
        
        {/* Porcentajes de propina sugeridos */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Porcentajes de propina sugeridos
          </label>
          <div className="flex flex-wrap gap-3">
            {COMMON_TIP_PERCENTAGES.map(percentage => (
              <label 
                key={percentage} 
                className={`
                  relative flex items-center justify-center px-4 py-3 rounded-xl cursor-pointer transition-all duration-200
                  ${Array.isArray(values.suggestedTipPercentages) && values.suggestedTipPercentages.includes(percentage) 
                    ? 'bg-gradient-to-br from-brand-orange/10 to-brand-purple/10 border-2 border-brand-purple shadow-md' 
                    : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
                  }
                `}
              >
                <input
                  type="checkbox"
                  name={`${prefix}.suggestedTipPercentages`}
                  value={percentage}
                  checked={Array.isArray(values.suggestedTipPercentages) ? values.suggestedTipPercentages.includes(percentage) : false}
                  className="absolute opacity-0"
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    // Asegurarse de que currentPercentages sea un array
                    const currentPercentages = Array.isArray(values.suggestedTipPercentages) 
                      ? [...values.suggestedTipPercentages] 
                      : [];
                    
                    if (e.target.checked) {
                      if (!currentPercentages.includes(percentage)) {
                        currentPercentages.push(percentage);
                      }
                    } else {
                      const idx = currentPercentages.indexOf(percentage);
                      if (idx > -1) {
                        currentPercentages.splice(idx, 1);
                      }
                    }
                    handleFieldChange(`${prefix}.suggestedTipPercentages`, currentPercentages);
                    // También actualizar el valor en Formik
                    setFieldValue(`${prefix}.suggestedTipPercentages`, currentPercentages);
                  }}
                />
                <span className={`
                  text-base font-medium 
                  ${Array.isArray(values.suggestedTipPercentages) && values.suggestedTipPercentages.includes(percentage) 
                    ? 'text-brand-purple' 
                    : 'text-gray-700'
                  }
                `}>
                  {percentage}
                </span>
              </label>
            ))}
          </div>
          {Array.isArray(values.suggestedTipPercentages) && values.suggestedTipPercentages.includes('Otro') && (
            <div className="mt-3">
              <input
                type="text"
                name={`${prefix}.customTipPercentage`}
                className="w-full rounded-xl border-gray-300 shadow-sm focus:border-brand-purple focus:ring-brand-purple py-3 px-4 bg-gradient-to-br from-orange-50 to-purple-50"
                placeholder="Especifica otros porcentajes (ej: 12%, 23%)"
                value={values.customTipPercentage || ""}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  const newValue = e.target.value;
                  handleFieldChange(`${prefix}.customTipPercentage`, newValue);
                  // También actualizar el valor en Formik
                  setFieldValue(`${prefix}.customTipPercentage`, newValue);
                }}
              />
            </div>
          )}
        </div>

        {/* Política para grupos grandes */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Política para grupos grandes
          </label>
          <select
            name={`${prefix}.largeGroupPolicy`}
            className="mt-1 block w-full rounded-xl border-gray-300 shadow-sm focus:border-brand-orange focus:ring-brand-orange py-3 px-4"
            value={values.largeGroupPolicy || "no_policy"}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
              const newValue = e.target.value;
              handleFieldChange(`${prefix}.largeGroupPolicy`, newValue);
              // También actualizar el valor en Formik
              setFieldValue(`${prefix}.largeGroupPolicy`, newValue);
            }}
          >
            <option value="">Selecciona la política para grupos grandes...</option>
            {LARGE_GROUP_POLICIES.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {values.largeGroupPolicy === 'automatic' && (
            <div className="mt-6 p-5 bg-gradient-to-br from-orange-50 to-purple-50 rounded-xl border border-purple-100 shadow-sm">
              <h5 className="text-base font-semibold text-brand-purple mb-3">Configuración de propina automática</h5>
              <div className="grid grid-cols-1 gap-y-4 gap-x-6 sm:grid-cols-2">
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tamaño mínimo del grupo
                  </label>
                  <input
                    type="number"
                    name={`${prefix}.largeGroupMinSize`}
                    min="1"
                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-brand-orange focus:ring-brand-orange"
                    value={values.largeGroupMinSize || 8}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      const newValue = parseInt(e.target.value, 10) || 0;
                      handleFieldChange(`${prefix}.largeGroupMinSize`, newValue);
                      // También actualizar el valor en Formik
                      setFieldValue(`${prefix}.largeGroupMinSize`, newValue);
                    }}
                  />
                  <p className="mt-2 text-xs text-gray-500">
                    Número mínimo de personas para considerar un grupo grande
                  </p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Porcentaje de propina automática
                  </label>
                  <div className="flex rounded-lg shadow-sm">
                    <input
                      type="number"
                      name={`${prefix}.largeGroupTipPercentage`}
                      min="0"
                      max="100"
                      className="block w-full rounded-l-lg border-gray-300 shadow-sm focus:border-brand-orange focus:ring-brand-orange"
                      value={values.largeGroupTipPercentage || 18}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        const newValue = parseInt(e.target.value, 10) || 0;
                        handleFieldChange(`${prefix}.largeGroupTipPercentage`, newValue);
                        // También actualizar el valor en Formik
                        setFieldValue(`${prefix}.largeGroupTipPercentage`, newValue);
                      }}
                    />
                    <span className="inline-flex items-center px-4 rounded-r-lg border border-l-0 border-gray-300 bg-gradient-to-r from-brand-orange to-brand-purple text-white">
                      %
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    Porcentaje que se aplicará automáticamente
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Política para eventos y catering */}
        <div className="mb-6">
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
            <label className="block text-base font-medium text-gray-700 mb-3">
              Política para eventos y catering
            </label>
            <p className="text-sm text-gray-500 mb-4">
              Define cómo manejan las propinas para servicios de eventos especiales y catering
            </p>
            <textarea
              name={`${prefix}.eventCateringPolicy`}
              className="w-full rounded-xl border-gray-300 shadow-sm focus:border-brand-orange focus:ring-brand-orange py-3 px-4 bg-gradient-to-br from-orange-50/30 to-purple-50/30"
              rows={3}
              placeholder="Describe la política de propinas para eventos privados y servicios de catering..."
              value={values.eventCateringPolicy || ""}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                const newValue = e.target.value;
                handleFieldChange(`${prefix}.eventCateringPolicy`, newValue);
                // También actualizar el valor en Formik
                setFieldValue(`${prefix}.eventCateringPolicy`, newValue);
              }}
            />
          </div>
        </div>

        {/* Manejo de propinas con tarjeta vs efectivo */}
        <div className="mb-6">
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
            <label className="block text-base font-medium text-gray-700 mb-3">
              Manejo de propinas con tarjeta vs efectivo
            </label>
            <p className="text-sm text-gray-500 mb-4">
              Especifica si hay diferencias en el manejo de propinas según el método de pago
            </p>
            <textarea
              name={`${prefix}.cardVsCashPolicy`}
              className="w-full rounded-xl border-gray-300 shadow-sm focus:border-brand-orange focus:ring-brand-orange py-3 px-4 bg-gradient-to-br from-orange-50/30 to-purple-50/30"
              rows={3}
              placeholder="¿Existe alguna diferencia en el manejo de propinas según el método de pago? Descríbela aquí..."
              value={values.cardVsCashPolicy || ""}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                const newValue = e.target.value;
                handleFieldChange(`${prefix}.cardVsCashPolicy`, newValue);
                // También actualizar el valor en Formik
                setFieldValue(`${prefix}.cardVsCashPolicy`, newValue);
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderPolicyFields = (
    prefix: string,
    values: PolicyObject,
    formikProps: any,
    name: string
  ) => {
    const { setFieldValue } = formikProps;
    return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">¿Tu restaurante acepta propinas?</label>
        <div className="mt-2 space-y-4">
          <label
            className={`
              flex items-center p-4 rounded-lg cursor-pointer transition-all duration-200
              ${values.hasTips === 'yes' 
                ? 'bg-gradient-to-br from-brand-orange/10 to-brand-purple/10 border-2 border-brand-purple shadow-md' 
                : 'bg-white border border-gray-200 hover:bg-gray-50'
              }
            `}
          >
            <input
              type="radio"
              name={`${prefix}.hasTips`}
              value="yes"
              id={`${prefix}-tips-yes`}
              className="h-5 w-5 text-brand-purple focus:ring-brand-purple border-gray-300"
              checked={values.hasTips === "yes"}
              onChange={() => {
                handleFieldChange(`${prefix}.hasTips`, "yes");
                // También actualizar el valor en Formik
                setFieldValue(`${prefix}.hasTips`, "yes");
              }}
            />
            <span className="ml-3 block font-medium text-gray-700">
              Sí, aceptamos propinas
            </span>
          </label>
          <label
            className={`
              flex items-center p-4 rounded-lg cursor-pointer transition-all duration-200
              ${values.hasTips === 'no' 
                ? 'bg-gradient-to-br from-brand-orange/10 to-brand-purple/10 border-2 border-brand-purple shadow-md' 
                : 'bg-white border border-gray-200 hover:bg-gray-50'
              }
            `}
          >
            <input
              type="radio"
              name={`${prefix}.hasTips`}
              value="no"
              id={`${prefix}-tips-no`}
              className="h-5 w-5 text-brand-purple focus:ring-brand-purple border-gray-300"
              checked={values.hasTips === "no"}
              onChange={() => {
                handleFieldChange(`${prefix}.hasTips`, "no");
                // También actualizar el valor en Formik
                setFieldValue(`${prefix}.hasTips`, "no");
              }}
            />
            <span className="ml-3 block font-medium text-gray-700">
              No, no aceptamos propinas
            </span>
          </label>
          <label
            className={`
              flex items-center p-4 rounded-lg cursor-pointer transition-all duration-200
              ${values.hasTips === 'depends' 
                ? 'bg-gradient-to-br from-brand-orange/10 to-brand-purple/10 border-2 border-brand-purple shadow-md' 
                : 'bg-white border border-gray-200 hover:bg-gray-50'
              }
            `}
          >
            <input
              type="radio"
              name={`${prefix}.hasTips`}
              value="depends"
              id={`${prefix}-tips-depends`}
              className="h-5 w-5 text-brand-purple focus:ring-brand-purple border-gray-300"
              checked={values.hasTips === "depends"}
              onChange={() => {
                handleFieldChange(`${prefix}.hasTips`, "depends");
                // También actualizar el valor en Formik
                setFieldValue(`${prefix}.hasTips`, "depends");
              }}
            />
            <span className="ml-3 block font-medium text-gray-700">
              Depende (especificar)
            </span>
          </label>
        </div>
      </div>
      
      {values.hasTips === 'depends' && (
        <div className="mt-4 mb-6 bg-gradient-to-br from-orange-50 to-purple-50 rounded-xl p-5 border border-purple-100 shadow-sm">
          <label className="block text-sm font-medium text-gray-700 mb-2">Detalle de política de propinas</label>
          <textarea
            name={`${prefix}.tipDetails`}
            id={`${prefix}-tip-details`}
            className="w-full rounded-xl border-gray-300 shadow-sm focus:border-brand-purple focus:ring-brand-purple py-3 px-4 bg-white"
            rows={3}
            placeholder="Explica en qué casos se aceptan propinas y en cuáles no..."
            value={values.tipDetails || ""}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
              const newValue = e.target.value;
              handleFieldChange(`${prefix}.tipDetails`, newValue);
              // También actualizar el valor en Formik
              setFieldValue(`${prefix}.tipDetails`, newValue);
            }}
          />
        </div>
      )}

      {values.hasTips === 'yes' && (
        <div className="mt-4 mb-6 bg-gradient-to-br from-orange-50 to-purple-50 rounded-xl p-5 border border-purple-100 shadow-sm">
          <label className="block text-sm font-medium text-gray-700 mb-2">Detalles sobre las propinas (opcional)</label>
          <textarea
            name={`${prefix}.tipDetails`}
            id={`${prefix}-tip-details`}
            className="w-full rounded-xl border-gray-300 shadow-sm focus:border-brand-purple focus:ring-brand-purple py-3 px-4 bg-white"
            rows={3}
            placeholder="Propinas sugeridas, política específica, etc."
            value={values.tipDetails || ""}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
              const newValue = e.target.value;
              handleFieldChange(`${prefix}.tipDetails`, newValue);
              // También actualizar el valor en Formik
              setFieldValue(`${prefix}.tipDetails`, newValue);
            }}
          />
        </div>
      )}
      
      <div className="mt-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">¿Tu restaurante cobra cargo por servicio?</label>
        <div className="mt-2 space-y-4">
          <label
            className={`
              flex items-center p-4 rounded-lg cursor-pointer transition-all duration-200
              ${values.hasServiceCharge === true 
                ? 'bg-gradient-to-br from-brand-orange/10 to-brand-purple/10 border-2 border-brand-purple shadow-md' 
                : 'bg-white border border-gray-200 hover:bg-gray-50'
              }
            `}
          >
            <input
              type="radio"
              name={`${prefix}.hasServiceCharge`}
              value="true"
              id={`${prefix}-service-charge-yes`}
              className="h-5 w-5 text-brand-purple focus:ring-brand-purple border-gray-300"
              checked={values.hasServiceCharge === true}
              onChange={() => {
                handleFieldChange(`${prefix}.hasServiceCharge`, true);
                // También actualizar el valor en Formik
                setFieldValue(`${prefix}.hasServiceCharge`, true);
              }}
            />
            <span className="ml-3 block font-medium text-gray-700">
              Sí, cobramos cargo por servicio
            </span>
          </label>
          <label
            className={`
              flex items-center p-4 rounded-lg cursor-pointer transition-all duration-200
              ${values.hasServiceCharge === false 
                ? 'bg-gradient-to-br from-brand-orange/10 to-brand-purple/10 border-2 border-brand-purple shadow-md' 
                : 'bg-white border border-gray-200 hover:bg-gray-50'
              }
            `}
          >
            <input
              type="radio"
              name={`${prefix}.hasServiceCharge`}
              value="false"
              id={`${prefix}-service-charge-no`}
              className="h-5 w-5 text-brand-purple focus:ring-brand-purple border-gray-300"
              checked={values.hasServiceCharge === false}
              onChange={() => {
                handleFieldChange(`${prefix}.hasServiceCharge`, false);
                // También actualizar el valor en Formik
                setFieldValue(`${prefix}.hasServiceCharge`, false);
              }}
            />
            <span className="ml-3 block font-medium text-gray-700">
              No, no cobramos cargo por servicio
            </span>
          </label>
        </div>
      </div>
      
      {values.hasServiceCharge && (
        <div className="mt-4 mb-6 bg-gradient-to-br from-orange-50 to-purple-50 rounded-xl p-5 border border-purple-100 shadow-sm">
          <label className="block text-sm font-medium text-gray-700 mb-2">Detalles del cargo por servicio</label>
          <textarea
            name={`${prefix}.serviceChargeDetails`}
            id={`${prefix}-service-charge-details`}
            className="w-full rounded-xl border-gray-300 shadow-sm focus:border-brand-purple focus:ring-brand-purple py-3 px-4 bg-white"
            rows={3}
            placeholder="Porcentaje del cargo, en qué situaciones se aplica, etc."
            value={values.serviceChargeDetails || ""}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
              const newValue = e.target.value;
              handleFieldChange(`${prefix}.serviceChargeDetails`, newValue);
              // También actualizar el valor en Formik
              setFieldValue(`${prefix}.serviceChargeDetails`, newValue);
            }}
          />
        </div>
      )}

      {values.hasTips === 'yes' && renderAdvancedTipFields(
        prefix, 
        values, 
        formikProps.errors, 
        formikProps.touched, 
        setFieldValue
      )}
    </div>
  )};

  return (
    <div className="min-h-screen bg-white px-4 py-8 pb-24">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand-orange to-brand-purple">
            Política de Propinas
          </h2>
          <p className="mt-3 text-gray-600">
            Define cómo quieres manejar la política de propinas y cargos por servicio en tu restaurante.
          </p>
        </div>
      
        {showNotification && (
          <Notification
            message="Los cambios han sido guardados correctamente"
            onClose={() => setShowNotification(false)}
          />
        )}
        
        <SavePrompt />
        
        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
          enableReinitialize
        >
          {({ isSubmitting, values, setFieldValue, errors, touched, ...formikProps }) => (
            <Form className="space-y-6" data-formik-values={JSON.stringify(values)}>
              <SectionCard title="Configuración general">
                <div className="mb-6">
                  <p className="text-sm text-gray-600 mb-4">
                    Define cómo quieres manejar la política de propinas y cargos por servicio en tu restaurante.
                    Puedes configurar una política única para todas las ubicaciones o establecer políticas específicas por ubicación.
                  </p>
                  
                  <div className="bg-gradient-to-br from-orange-50 to-purple-50 p-5 rounded-xl border border-purple-100 shadow-sm">
                    <h4 className="text-lg font-semibold mb-4 bg-gradient-to-r from-brand-orange to-brand-purple bg-clip-text text-transparent">¿Cómo quieres configurar las políticas de propinas?</h4>
                    <div className="space-y-4">
                      <label 
                        className={`
                          flex items-center p-4 rounded-lg cursor-pointer transition-all duration-200
                          ${values.policyMode === 'individual' 
                            ? 'bg-white border-2 border-brand-purple shadow-md' 
                            : 'bg-white/60 border border-gray-200 hover:bg-white'
                          }
                        `}
                      >
                        <input
                          type="radio"
                          name="policyMode"
                          value="individual"
                          id="policy-mode-individual"
                          className="h-5 w-5 text-brand-purple focus:ring-brand-purple border-gray-300"
                          checked={values.policyMode === 'individual'}
                          onChange={() => {
                            setFieldValue('policyMode', 'individual');
                            handleFieldChange('policyMode', 'individual');
                          }}
                        />
                        <div className="ml-3">
                          <span className="block text-base font-medium text-gray-700">
                            Configurar cada ubicación por separado
                          </span>
                          <span className="block text-sm text-gray-500 mt-1">
                            Cada ubicación tendrá su propia configuración de propinas
                          </span>
                        </div>
                      </label>
                      
                      <label 
                        className={`
                          flex items-center p-4 rounded-lg cursor-pointer transition-all duration-200
                          ${values.policyMode === 'grouped' 
                            ? 'bg-white border-2 border-brand-purple shadow-md' 
                            : 'bg-white/60 border border-gray-200 hover:bg-white'
                          }
                        `}
                      >
                        <input
                          type="radio"
                          name="policyMode"
                          value="grouped"
                          id="policy-mode-grouped"
                          className="h-5 w-5 text-brand-purple focus:ring-brand-purple border-gray-300"
                          checked={values.policyMode === 'grouped'}
                          onChange={() => {
                            setFieldValue('policyMode', 'grouped');
                            handleFieldChange('policyMode', 'grouped');
                          }}
                        />
                        <div className="ml-3">
                          <span className="block text-base font-medium text-gray-700">
                            Agrupar ubicaciones con políticas idénticas
                          </span>
                          <span className="block text-sm text-gray-500 mt-1">
                            Crea grupos de ubicaciones que comparten exactamente las mismas políticas
                          </span>
                        </div>
                      </label>
                      
                      <label 
                        className={`
                          flex items-center p-4 rounded-lg cursor-pointer transition-all duration-200
                          ${values.policyMode === 'single' 
                            ? 'bg-white border-2 border-brand-purple shadow-md' 
                            : 'bg-white/60 border border-gray-200 hover:bg-white'
                          }
                        `}
                      >
                        <input
                          type="radio"
                          name="policyMode"
                          value="single"
                          id="policy-mode-single"
                          className="h-5 w-5 text-brand-purple focus:ring-brand-purple border-gray-300"
                          checked={values.policyMode === 'single'}
                          onChange={() => {
                            setFieldValue('policyMode', 'single');
                            handleFieldChange('policyMode', 'single');
                          }}
                        />
                        <div className="ml-3">
                          <span className="block text-base font-medium text-gray-700">
                            Usar una política única para todas las ubicaciones
                          </span>
                          <span className="block text-sm text-gray-500 mt-1">
                            Aplicar la misma configuración de propinas a todos tus restaurantes
                          </span>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
                
                {/* Renderizar el contenido adecuado según el modo de política seleccionado */}
                {values.policyMode === 'individual' && (
                  <>
                    <div className="mt-8 space-y-4">
                      {values.locationPolicies.map((policy, index) => {
                        const location = locations.find(loc => loc.id === policy.locationId);
                        return (
                          <Accordion
                            key={policy.locationId}
                            title={`Política para ${location?.name || 'Ubicación'}`}
                            isOpen={!!openAccordions[policy.locationId]}
                            onToggle={() => toggleAccordion(policy.locationId)}
                          >
                            {renderPolicyFields(
                              `locationPolicies.${policy.locationId}`,
                              policy,
                              { errors, touched, setFieldValue },
                              policy.locationId
                            )}
                          </Accordion>
                        );
                      })}
                    </div>
                  </>
                )}

                {values.policyMode === 'grouped' && (
                  <>
                    <div className="mt-8">
                      <div className="flex justify-between mb-6">
                        <h3 className="text-3xl font-bold text-brand-orange">
                          Grupos de Propinas
                        </h3>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          // Generar un nombre de grupo automático (Grupo A, Grupo B, etc.)
                          const existingGroups = Object.keys(values.locationGroups);
                          
                          // Determinar la siguiente letra
                          let nextGroupLetter = 'A';
                          const usedLetters = existingGroups
                            .filter(name => name.startsWith('Grupo '))
                            .map(name => name.replace('Grupo ', ''));
                          
                          if (usedLetters.length > 0) {
                            // Encontrar la próxima letra disponible
                            for (let charCode = 65; charCode <= 90; charCode++) {
                              const letter = String.fromCharCode(charCode);
                              if (!usedLetters.includes(letter)) {
                                nextGroupLetter = letter;
                                break;
                              }
                            }
                          }
                          
                          const groupName = `Grupo ${nextGroupLetter}`;
                          
                          if (values.locationGroups[groupName]) {
                            alert('Ya existe un grupo con ese nombre. Por favor, elimine algún grupo existente primero.');
                            return;
                          }
                          
                          // Crear el nuevo grupo
                          const updatedGroups = { 
                            ...values.locationGroups,
                            [groupName]: []
                          };
                          
                          setFieldValue('locationGroups', updatedGroups);
                          handleFieldChange('locationGroups', updatedGroups);
                          
                          // También crear una política para este grupo
                          const updatedGroupPolicies = [...values.groupPolicies];
                          updatedGroupPolicies.push({
                            groupId: groupName,
                            locations: [],
                            ...getEmptyPolicyObject()
                          });
                          
                          setFieldValue('groupPolicies', updatedGroupPolicies);
                          handleFieldChange('groupPolicies', updatedGroupPolicies);
                          
                          // Abrir automáticamente el acordeón para el nuevo grupo
                          setTimeout(() => {
                            console.log(`Abriendo acordeón para nuevo grupo: ${groupName}`);
                            
                            // Forzar apertura del acordeón del nuevo grupo
                            setOpenAccordions(prev => ({
                              ...prev,
                              [groupName]: true
                            }));
                            
                            // Hacer scroll hacia el acordeón
                            setTimeout(() => {
                              const element = document.getElementById(`policy-${groupName}`);
                              if (element) {
                                element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                              } else {
                                console.log(`No se encontró el elemento policy-${groupName} para hacer scroll`);
                              }
                            }, 300);
                          }, 100);
                        }}
                        className="flex items-center justify-center px-8 py-4 rounded-full font-medium text-white bg-gradient-to-r from-brand-orange to-brand-purple hover:opacity-90 transition-colors mb-8"
                      >
                        <span className="text-lg mr-2">+</span> Agregar Grupo
                      </button>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {Object.entries(values.locationGroups).map(([groupId, locationIds], index) => {
                          // Definir gradientes diferentes para cada grupo
                          const gradients = [
                            'from-pink-400 to-orange-400', // rosa a naranja
                            'from-indigo-400 to-blue-400', // índigo a azul
                            'from-green-400 to-teal-400',  // verde a teal
                            'from-yellow-400 to-orange-400' // amarillo a naranja
                          ];
                          
                          const gradient = gradients[index % gradients.length];
                          
                          return (
                            <div 
                              key={groupId} 
                              className={`relative rounded-xl p-6 text-white bg-gradient-to-br ${gradient} shadow-lg`}
                            >
                              <button
                                type="button"
                                onClick={() => {
                                  // Eliminar grupo
                                  const updatedGroups = { ...values.locationGroups };
                                  delete updatedGroups[groupId];
                                  setFieldValue('locationGroups', updatedGroups);
                                  handleFieldChange('locationGroups', updatedGroups);
                                  
                                  // Eliminar la política asociada
                                  const updatedPolicies = values.groupPolicies.filter(
                                    policy => policy.groupId !== groupId
                                  );
                                  setFieldValue('groupPolicies', updatedPolicies);
                                  handleFieldChange('groupPolicies', updatedPolicies);
                                }}
                                className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center bg-white bg-opacity-30 rounded-full hover:bg-opacity-50 transition-all"
                                aria-label="Eliminar grupo"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                              
                              <h4 className="text-2xl font-bold mb-6">{groupId}</h4>
                              
                              <div className="mb-4">
                                <div className="flex items-center mb-2">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                  </svg>
                                  <span className="font-medium">Ubicaciones</span>
                                </div>
                                
                                <div className="space-y-2 bg-white bg-opacity-20 rounded-lg p-3">
                                  {locations.map(loc => {
                                    // Verificar si la ubicación ya está en este grupo
                                    const isInThisGroup = locationIds.includes(loc.id);
                                    // Verificar si está en cualquier otro grupo
                                    const isInAnotherGroup = Object.entries(values.locationGroups).some(
                                      ([gId, locs]) => gId !== groupId && locs.includes(loc.id)
                                    );
                                    
                                    // No mostrar ubicaciones que ya están en otros grupos
                                    if (isInAnotherGroup && !isInThisGroup) {
                                      return null;
                                    }
                                    
                                    return (
                                      <div key={loc.id} className="flex items-center p-2 hover:bg-white hover:bg-opacity-10 rounded">
                                        <input
                                          type="checkbox"
                                          id={`${groupId}-${loc.id}`}
                                          checked={isInThisGroup}
                                          onChange={(e) => {
                                            const isChecked = e.target.checked;
                                            const updatedGroups = { ...values.locationGroups };
                                            
                                            if (isChecked) {
                                              // Añadir ubicación al grupo
                                              updatedGroups[groupId] = [...updatedGroups[groupId], loc.id];
                                            } else {
                                              // Eliminar ubicación del grupo
                                              updatedGroups[groupId] = updatedGroups[groupId].filter(id => id !== loc.id);
                                            }
                                            
                                            setFieldValue('locationGroups', updatedGroups);
                                            handleFieldChange('locationGroups', updatedGroups);
                                          }}
                                          className="h-5 w-5 rounded border-white text-brand-purple focus:ring-brand-purple"
                                        />
                                        <label htmlFor={`${groupId}-${loc.id}`} className="ml-3 block text-sm">
                                          {loc.name}
                                        </label>
                                      </div>
                                    );
                                  })}
                                </div>
                                
                                <div className="mt-4 flex justify-center">
                                  <span className="px-4 py-1 bg-white bg-opacity-30 rounded-full text-sm">
                                    {locationIds.length}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    
                    {/* Sección de configuración de políticas para grupos */}
                    <div className="mt-12">
                      <h3 className="text-2xl font-bold text-brand-orange pb-2 border-b border-gray-200 mb-6">
                        Configuración de Políticas para Grupos
                      </h3>
                      
                      {Object.entries(values.locationGroups).length === 0 ? (
                        <div className="bg-gray-50 rounded-lg p-6 text-center">
                          <p className="text-gray-600">Aún no has creado grupos de propinas. Crea un grupo para configurar su política.</p>
                        </div>
                      ) : (
                        <div className="space-y-6">
                          {Object.entries(values.locationGroups).map(([groupId, locationIds]) => {
                            // Buscar la política correspondiente a este grupo
                            const policyIndex = values.groupPolicies.findIndex(policy => policy.groupId === groupId);
                            
                            // Si no existe política para este grupo, omitirlo 
                            // (debería haber sido creado al crear el grupo)
                            if (policyIndex === -1) return null;
                            
                            // Obtener la política
                            const policy = values.groupPolicies[policyIndex];
                            
                            return (
                              <div 
                                key={groupId}
                                className="bg-white shadow-lg rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl border border-gray-200"
                              >
                                <div 
                                  className="p-5 cursor-pointer flex flex-wrap justify-between items-center border-b border-gray-100"
                                  onClick={() => toggleAccordion(groupId)}
                                >
                                  <div className="flex-1">
                                    <h3 className="text-xl font-bold bg-gradient-to-r from-brand-orange to-brand-purple bg-clip-text text-transparent">
                                      Política para {groupId} 
                                    </h3>
                                    <div className="mt-1 text-sm text-gray-500">
                                      {locationIds.length} {locationIds.length === 1 ? 'ubicación' : 'ubicaciones'} seleccionadas
                                    </div>
                                  </div>
                                  <button 
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleAccordion(groupId);
                                    }}
                                    aria-label={openAccordions[groupId] ? 'Cerrar sección' : 'Abrir sección'}
                                    className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-r from-brand-orange to-brand-purple text-white shadow-md focus:outline-none transition-transform duration-300 transform hover:scale-105"
                                  >
                                    {openAccordions[groupId] ? (
                                      <ChevronUpIcon className="h-5 w-5" />
                                    ) : (
                                      <ChevronDownIcon className="h-5 w-5" />
                                    )}
                                  </button>
                                </div>
                                
                                <div className={`p-6 ${openAccordions[groupId] ? 'block animate-fadeIn' : 'hidden'}`} id={`policy-${groupId}`}>
                                  {/* Listado de ubicaciones del grupo */}
                                  {locationIds.length > 0 ? (
                                    <>
                                      <div className="mb-6 bg-gray-50 p-4 rounded-lg">
                                        <h4 className="text-sm font-semibold text-gray-600 mb-2">Ubicaciones en este grupo:</h4>
                                        <div className="flex flex-wrap gap-2">
                                          {locationIds.map(locId => {
                                            const location = locations.find(l => l.id === locId);
                                            return (
                                              <span 
                                                key={locId} 
                                                className="inline-block px-3 py-1 bg-white rounded-full text-sm border border-gray-200"
                                              >
                                                {location?.name || locId}
                                              </span>
                                            );
                                          })}
                                        </div>
                                      </div>
                                      
                                      {/* Formulario de políticas */}
                                      {renderPolicyFields(
                                        `groupPolicies.${policyIndex}`,
                                        policy,
                                        { errors, touched, setFieldValue },
                                        groupId
                                      )}
                                    </>
                                  ) : (
                                    <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100">
                                      <div className="flex items-start">
                                        <svg className="h-5 w-5 text-yellow-400 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                        <div>
                                          <h4 className="text-sm font-semibold text-yellow-800 mb-1">No hay ubicaciones en este grupo</h4>
                                          <p className="text-sm text-yellow-700">
                                            Agrega al menos una ubicación al grupo para poder configurar su política de propinas.
                                            Puedes hacerlo seleccionando las ubicaciones en la tarjeta del grupo.
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </>
                )}

                {values.policyMode === 'single' && (
                  <div className="mt-8">
                    <SectionCard title="Política de propinas para todas las ubicaciones">
                      {values.locationPolicies.length > 0 ? (
                        renderPolicyFields(
                          'locationPolicies.default',
                          values.locationPolicies[0],
                          { errors, touched, setFieldValue },
                          'default'
                        )
                      ) : (
                        <p className="text-gray-600">No hay políticas configuradas</p>
                      )}
                    </SectionCard>
                  </div>
                )}
              </SectionCard>
              
              <div className="fixed bottom-0 left-0 right-0 py-4 px-6 bg-white border-t border-gray-200 flex justify-between items-center z-10">
                {!hasUnsavedChanges ? (
                  <div className="flex items-center bg-green-50 border border-green-100 rounded-md px-4 py-3">
                    <svg className="w-5 h-5 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                    </svg>
                    <div>
                      <div className="text-green-700 font-medium">Cambios guardados</div>
                      <div className="text-green-600 text-sm">Todo está al día</div>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => navigate('/onboarding/menu-config')}
                    className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-full hover:bg-gray-50 transition-colors"
                  >
                    Atrás
                  </button>
                )}

                <div className="flex space-x-4">
                  {hasUnsavedChanges ? (
                    <button
                      type="button"
                      onClick={() => handleSave(values)}
                      className="px-6 py-3 border border-brand-orange text-brand-orange font-medium rounded-full hover:bg-orange-50 transition-colors"
                    >
                      Guardar cambios
                    </button>
                  ) : (
                    <button disabled className="px-6 py-3 bg-gray-100 text-gray-500 font-medium rounded-full">
                      Cambios guardados
                    </button>
                  )}
                  <button 
                    type="submit"
                    className="px-6 py-3 bg-gradient-to-r from-brand-orange to-brand-purple text-white font-medium rounded-full hover:opacity-90 transition-colors"
                  >
                    Continuar
                  </button>
                </div>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  )
}
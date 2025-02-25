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
  useGroups: boolean
  locationPolicies: { [key: string]: PolicyObject }
  groupPolicies: { [key: string]: PolicyObject }
}

interface FormValues {
  useGroups: boolean
  locationPolicies: LocationPolicy[]
  groupPolicies: GroupPolicy[]
}

const validationSchema = Yup.object().shape({
  useGroups: Yup.boolean().required(),
  locationPolicies: Yup.array().when('useGroups', {
    is: false,
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
  groupPolicies: Yup.array().when('useGroups', {
    is: true,
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
  <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
    <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
      <h2 className="text-lg font-medium text-gray-900">{title}</h2>
    </div>
    <div className="px-6 py-5">{children}</div>
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
    <div className="border border-gray-200 rounded-lg overflow-hidden mb-4">
      <div 
        className="flex justify-between items-center p-4 bg-gray-50 cursor-pointer" 
        onClick={onToggle}
      >
        <h3 className="text-lg font-medium text-gray-900">{title}</h3>
        <div className="text-brand-purple">
          {isOpen ? (
            <ChevronUpIcon className="h-5 w-5" />
          ) : (
            <ChevronDownIcon className="h-5 w-5" />
          )}
        </div>
      </div>
      {isOpen && (
        <div className="p-4 border-t border-gray-200 bg-white">
          {children}
        </div>
      )}
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
  }, [state.locations, formData.locations]);

  const toggleAccordion = (id: string) => {
    setOpenAccordions(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
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

  const initialValues: FormValues = {
    useGroups: state.tipsPolicy?.useGroups || false,
    locationPolicies: ensureLocationPolicies(),
    groupPolicies: state.menuGroups.map(group => ({
      groupId: group.name,
      locations: group.locations || [],
      ...getEmptyPolicyObject(),
      ...state.tipsPolicy?.groupPolicies?.[group.name]
    })),
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
      locationPolicies[locationId] = rest;
    })

    const groupPolicies: { [key: string]: PolicyObject } = {}
    values.groupPolicies.forEach(policy => {
      const { groupId, ...rest } = policy;
      groupPolicies[groupId] = rest;
    })

    dispatch({
      type: 'SET_TIPS_POLICY',
      payload: {
        useGroups: values.useGroups,
        locationPolicies,
        groupPolicies
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
        locationPolicies[locationId] = rest;
      })

      const groupPolicies: { [key: string]: PolicyObject } = {}
      values.groupPolicies.forEach(policy => {
        const { groupId, ...rest } = policy;
        groupPolicies[groupId] = rest;
      })

      dispatch({
        type: 'SET_TIPS_POLICY',
        payload: {
          useGroups: values.useGroups,
          locationPolicies,
          groupPolicies
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
        
        {/* Distribución de propinas */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Distribución de propinas entre el personal
          </label>
          <select
            name={`${prefix}.tipDistribution`}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-purple focus:ring-brand-purple sm:text-sm"
            value={values.tipDistribution || "equal"}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
              const newValue = e.target.value;
              handleFieldChange(`${prefix}.tipDistribution`, newValue);
              // También actualizar el valor en Formik
              setFieldValue(`${prefix}.tipDistribution`, newValue);
            }}
          >
            <option value="">Selecciona el método de distribución...</option>
            {TIP_DISTRIBUTION_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {values.tipDistribution === 'other' && (
            <div className="mt-2">
              <textarea
                name={`${prefix}.tipDetails`}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-brand-purple focus:ring-brand-purple sm:text-sm"
                rows={2}
                placeholder="Describe el método de distribución de propinas..."
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
        </div>

        {/* Porcentajes de propina sugeridos */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Porcentajes de propina sugeridos
          </label>
          <div className="flex flex-wrap gap-3">
            {COMMON_TIP_PERCENTAGES.map(percentage => (
              <label 
                key={percentage} 
                className="flex items-center cursor-pointer p-2 rounded-md hover:bg-gray-50 transition-colors"
              >
                <input
                  type="checkbox"
                  name={`${prefix}.suggestedTipPercentages`}
                  value={percentage}
                  checked={Array.isArray(values.suggestedTipPercentages) ? values.suggestedTipPercentages.includes(percentage) : false}
                  className="h-5 w-5 rounded border-gray-300 text-brand-purple focus:ring-brand-purple"
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
                <span className="ml-2 mr-1 text-sm font-medium text-gray-700">{percentage}</span>
              </label>
            ))}
          </div>
          {Array.isArray(values.suggestedTipPercentages) && values.suggestedTipPercentages.includes('Otro') && (
            <div className="mt-3">
              <input
                type="text"
                name={`${prefix}.customTipPercentage`}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-brand-purple focus:ring-brand-purple sm:text-sm"
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
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-purple focus:ring-brand-purple sm:text-sm"
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
            <div className="mt-4 grid grid-cols-1 gap-y-4 gap-x-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tamaño mínimo del grupo
                </label>
                <input
                  type="number"
                  name={`${prefix}.largeGroupMinSize`}
                  min="1"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-purple focus:ring-brand-purple sm:text-sm"
                  value={values.largeGroupMinSize || 8}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    const newValue = parseInt(e.target.value, 10) || 0;
                    handleFieldChange(`${prefix}.largeGroupMinSize`, newValue);
                    // También actualizar el valor en Formik
                    setFieldValue(`${prefix}.largeGroupMinSize`, newValue);
                  }}
                />
                <p className="mt-1 text-xs text-gray-500">
                  Número mínimo de personas para considerar un grupo grande
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Porcentaje de propina automática
                </label>
                <div className="mt-1 flex rounded-md shadow-sm">
                  <input
                    type="number"
                    name={`${prefix}.largeGroupTipPercentage`}
                    min="0"
                    max="100"
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-purple focus:ring-brand-purple sm:text-sm"
                    value={values.largeGroupTipPercentage || 18}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      const newValue = parseInt(e.target.value, 10) || 0;
                      handleFieldChange(`${prefix}.largeGroupTipPercentage`, newValue);
                      // También actualizar el valor en Formik
                      setFieldValue(`${prefix}.largeGroupTipPercentage`, newValue);
                    }}
                  />
                  <span className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
                    %
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Política para eventos y catering */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Política para eventos y catering
          </label>
          <textarea
            name={`${prefix}.eventCateringPolicy`}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-brand-purple focus:ring-brand-purple sm:text-sm"
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

        {/* Manejo de propinas con tarjeta vs efectivo */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Manejo de propinas con tarjeta vs efectivo
          </label>
          <textarea
            name={`${prefix}.cardVsCashPolicy`}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-brand-purple focus:ring-brand-purple sm:text-sm"
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
        <label className="block text-sm font-medium text-gray-700 mb-2">¿Tu restaurante acepta propinas?</label>
        <div className="mt-2 space-y-3">
          <div className="flex items-center">
            <input
              type="radio"
              name={`${prefix}.hasTips`}
              value="yes"
              id={`${prefix}-tips-yes`}
              className="h-4 w-4 text-brand-purple focus:ring-brand-purple border-gray-300"
              checked={values.hasTips === "yes"}
              onChange={() => {
                handleFieldChange(`${prefix}.hasTips`, "yes");
                // También actualizar el valor en Formik
                setFieldValue(`${prefix}.hasTips`, "yes");
              }}
            />
            <label htmlFor={`${prefix}-tips-yes`} className="ml-3 block text-sm text-gray-700">
              Sí, aceptamos propinas
            </label>
          </div>
          <div className="flex items-center">
            <input
              type="radio"
              name={`${prefix}.hasTips`}
              value="no"
              id={`${prefix}-tips-no`}
              className="h-4 w-4 text-brand-purple focus:ring-brand-purple border-gray-300"
              checked={values.hasTips === "no"}
              onChange={() => {
                handleFieldChange(`${prefix}.hasTips`, "no");
                // También actualizar el valor en Formik
                setFieldValue(`${prefix}.hasTips`, "no");
              }}
            />
            <label htmlFor={`${prefix}-tips-no`} className="ml-3 block text-sm text-gray-700">
              No, no aceptamos propinas
            </label>
          </div>
          <div className="flex items-center">
            <input
              type="radio"
              name={`${prefix}.hasTips`}
              value="depends"
              id={`${prefix}-tips-depends`}
              className="h-4 w-4 text-brand-purple focus:ring-brand-purple border-gray-300"
              checked={values.hasTips === "depends"}
              onChange={() => {
                handleFieldChange(`${prefix}.hasTips`, "depends");
                // También actualizar el valor en Formik
                setFieldValue(`${prefix}.hasTips`, "depends");
              }}
            />
            <label htmlFor={`${prefix}-tips-depends`} className="ml-3 block text-sm text-gray-700">
              Depende (especificar)
            </label>
          </div>
        </div>
      </div>
      
      {values.hasTips === 'depends' && (
        <div className="pl-6 border-l-2 border-brand-purple-100">
          <label className="block text-sm font-medium text-gray-700 mb-2">Detalle de política de propinas</label>
          <textarea
            name={`${prefix}.tipDetails`}
            id={`${prefix}-tip-details`}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-brand-purple focus:ring-brand-purple sm:text-sm"
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
        <div className="pl-6 border-l-2 border-brand-purple-100">
          <label className="block text-sm font-medium text-gray-700 mb-2">Detalles sobre las propinas (opcional)</label>
          <textarea
            name={`${prefix}.tipDetails`}
            id={`${prefix}-tip-details`}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-brand-purple focus:ring-brand-purple sm:text-sm"
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
        <label className="block text-sm font-medium text-gray-700 mb-2">¿Tu restaurante cobra cargo por servicio?</label>
        <div className="mt-2 space-y-3">
          <div className="flex items-center">
            <input
              type="radio"
              name={`${prefix}.hasServiceCharge`}
              value="true"
              id={`${prefix}-service-charge-yes`}
              className="h-4 w-4 text-brand-purple focus:ring-brand-purple border-gray-300"
              checked={values.hasServiceCharge === true}
              onChange={() => {
                handleFieldChange(`${prefix}.hasServiceCharge`, true);
                // También actualizar el valor en Formik
                setFieldValue(`${prefix}.hasServiceCharge`, true);
              }}
            />
            <label htmlFor={`${prefix}-service-charge-yes`} className="ml-3 block text-sm text-gray-700">
              Sí, cobramos cargo por servicio
            </label>
          </div>
          <div className="flex items-center">
            <input
              type="radio"
              name={`${prefix}.hasServiceCharge`}
              value="false"
              id={`${prefix}-service-charge-no`}
              className="h-4 w-4 text-brand-purple focus:ring-brand-purple border-gray-300"
              checked={values.hasServiceCharge === false}
              onChange={() => {
                handleFieldChange(`${prefix}.hasServiceCharge`, false);
                // También actualizar el valor en Formik
                setFieldValue(`${prefix}.hasServiceCharge`, false);
              }}
            />
            <label htmlFor={`${prefix}-service-charge-no`} className="ml-3 block text-sm text-gray-700">
              No, no cobramos cargo por servicio
            </label>
          </div>
        </div>
      </div>
      
      {values.hasServiceCharge && (
        <div className="pl-6 border-l-2 border-brand-purple-100">
          <label className="block text-sm font-medium text-gray-700 mb-2">Detalles del cargo por servicio</label>
          <textarea
            name={`${prefix}.serviceChargeDetails`}
            id={`${prefix}-service-charge-details`}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-brand-purple focus:ring-brand-purple sm:text-sm"
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
    <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Política de Propinas</h1>
      
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
                
                <div className="bg-gray-50 p-4 rounded-md border border-gray-200 mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-3">¿Deseas usar políticas específicas por ubicación?</label>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <input
                        type="radio"
                        name="useGroups"
                        value="true"
                        id="use-groups-yes"
                        className="h-4 w-4 text-brand-purple focus:ring-brand-purple border-gray-300"
                        checked={values.useGroups === true}
                        onChange={() => {
                          setFieldValue('useGroups', true);
                          handleFieldChange('useGroups', true);
                        }}
                      />
                      <label htmlFor="use-groups-yes" className="ml-3 block text-sm text-gray-700">
                        Sí, usar políticas específicas por ubicación
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="radio"
                        name="useGroups"
                        value="false"
                        id="use-groups-no"
                        className="h-4 w-4 text-brand-purple focus:ring-brand-purple border-gray-300"
                        checked={values.useGroups === false}
                        onChange={() => {
                          setFieldValue('useGroups', false);
                          handleFieldChange('useGroups', false);
                        }}
                      />
                      <label htmlFor="use-groups-no" className="ml-3 block text-sm text-gray-700">
                        No, usar una política única para todas las ubicaciones
                      </label>
                    </div>
                  </div>
                </div>
              </div>
              
              {!values.useGroups && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Política única para todas las ubicaciones</h3>
                  {/* Siempre mostramos el formulario de política única */}
                  {(() => {
                    // Usar la primera ubicación como referencia para la política única, o una predeterminada si no hay
                    const firstLocation = locations.length > 0 
                      ? locations[0] 
                      : { id: 'default', name: 'Todas las ubicaciones' };
                    
                    const locationPolicyIndex = values.locationPolicies.findIndex(p => p.locationId === firstLocation.id);
                    let locationPolicy;
                    
                    if (locationPolicyIndex === -1) {
                      // Si no existe una política para esta ubicación, usar el objeto vacío
                      locationPolicy = { 
                        locationId: firstLocation.id, 
                        ...getEmptyPolicyObject() 
                      };
                    } else {
                      // Si existe, usarla
                      locationPolicy = values.locationPolicies[locationPolicyIndex];
                    }

                    return renderPolicyFields(
                      `locationPolicies.${locationPolicyIndex !== -1 ? locationPolicyIndex : 0}`,
                      locationPolicy,
                      { errors, touched, setFieldValue },
                      firstLocation.id
                    );
                  })()}
                </div>
              )}
            </SectionCard>
            
            {values.useGroups && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Políticas por ubicación</h3>
                
                {/* Verificar si hay ubicaciones configuradas */}
                {locations.length === 0 ? (
                  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-yellow-700">
                          No hay ubicaciones configuradas. Por favor, añade y confirma ubicaciones en el paso de Datos Legales.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Renderizar los acordeones de ubicación cuando hay ubicaciones configuradas
                  locations.map(location => {
                    // Encontrar o crear la política para esta ubicación
                    const locationPolicyIndex = values.locationPolicies.findIndex(p => p.locationId === location.id);
                    let locationPolicy;
                    
                    if (locationPolicyIndex === -1) {
                      // Si no existe una política para esta ubicación, usar el objeto vacío
                      locationPolicy = { 
                        locationId: location.id, 
                        ...getEmptyPolicyObject() 
                      };
                    } else {
                      // Si existe, usarla
                      locationPolicy = values.locationPolicies[locationPolicyIndex];
                    }
                    
                    return (
                      <Accordion 
                        key={location.id} 
                        title={`Política para: ${location.name}`}
                        isOpen={!!openAccordions[location.id]}
                        onToggle={() => toggleAccordion(location.id)}
                      >
                        {renderPolicyFields(
                          `locationPolicies.${locationPolicyIndex !== -1 ? locationPolicyIndex : values.locationPolicies.length}`,
                          locationPolicy,
                          { errors, touched, setFieldValue },
                          location.id
                        )}
                      </Accordion>
                    );
                  })
                )}
              </div>
            )}
            
            <div className="flex justify-between pt-4">
              <button
                type="button"
                onClick={() => navigate('/onboarding/menu-config')}
                className="btn-secondary"
              >
                Atrás
              </button>
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => handleSave(values)}
                  className={hasUnsavedChanges ? 'btn-unsaved' : 'btn-saved'}
                  disabled={!hasUnsavedChanges}
                >
                  {hasUnsavedChanges ? 'Guardar cambios' : 'Cambios guardados'}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary"
                >
                  Continuar
                </button>
              </div>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  )
}
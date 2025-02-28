import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useFormProgress } from '../hooks/useFormProgress'
import { useTranslation } from '../hooks/useTranslation'
import { Formik, Form, Field, FormikProps } from 'formik'
import * as Yup from 'yup'
import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline'
import { Notification } from '../components/Notification'
import { MenuGroup } from '../context/FormContext'

// Extender la interfaz Window para incluir saveCurrentFormData
declare global {
  interface Window {
    onFormStateChange?: (hasChanges: boolean) => void;
    saveCurrentFormData?: () => Promise<boolean>;
  }
}

// Función para crear un MenuGroup a partir de un grupo confirmado
const createMenuGroupFromConfirmedGroup = (group: any): MenuGroup => {
  // Asegurar que solo se usen ubicaciones válidas que existen actualmente
  const validLocations = group.locations || [];
  
  return {
    name: group.name || "",
    locations: validLocations,
    regularMenu: null,
    regularMenuUrl: "",
    hasDietaryMenu: false,
    dietaryMenu: null,
    dietaryMenuUrl: "",
    hasVeganMenu: false,
    veganMenu: null,
    veganMenuUrl: "",
    hasOtherMenus: false,
    otherMenus: [],
    otherMenuUrls: [],
    sharedDishes: "",
    sharedDrinks: "",
    popularAppetizers: "",
    popularMainCourses: "",
    popularDesserts: "",
    popularAlcoholicDrinks: "",
    popularNonAlcoholicDrinks: "",
  };
};

// Función para crear un grupo por defecto
const createDefaultMenuGroup = (allLocations: string[]): MenuGroup => ({
  name: "Menú General",
  locations: allLocations,
  regularMenu: null,
  regularMenuUrl: "",
  hasDietaryMenu: false,
  dietaryMenu: null,
  dietaryMenuUrl: "",
  hasVeganMenu: false,
  veganMenu: null,
  veganMenuUrl: "",
  hasOtherMenus: false,
  otherMenus: [],
  otherMenuUrls: [],
  sharedDishes: "",
  sharedDrinks: "",
  popularAppetizers: "",
  popularMainCourses: "",
  popularDesserts: "",
  popularAlcoholicDrinks: "",
  popularNonAlcoholicDrinks: "",
});

// Componente Acordeón
interface AccordionProps {
  title: string;
  locations?: string[];
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

const Accordion = ({ title, locations, isOpen, onToggle, children }: AccordionProps) => {
  // Manejar el clic en el encabezado para evitar propagación de eventos
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Detener propagación para evitar múltiples activaciones
    onToggle();
    console.log(`Accordion ${title} clicked, nuevo estado será: ${!isOpen}`);
  };
  
  return (
    <div className="bg-white shadow-lg rounded-2xl mb-6 overflow-hidden transition-all duration-300 hover:shadow-xl">
      <div 
        className="p-5 cursor-pointer flex justify-between items-center border-b border-gray-100"
        onClick={handleClick}
      >
        <div>
          <h3 className="text-xl font-bold bg-gradient-to-r from-orange-400 to-pink-500 bg-clip-text text-transparent">{title}</h3>
          {locations && locations.length > 0 && (
            <p className="text-sm text-gray-500 mt-1">
              Ubicaciones: {locations.join(', ')}
            </p>
          )}
        </div>
        <button 
          type="button"
          onClick={handleClick}
          aria-label={isOpen ? 'Cerrar sección' : 'Abrir sección'}
          className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-r from-orange-400 to-pink-500 text-white shadow-md focus:outline-none transition-transform duration-300 transform hover:scale-105"
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

interface FormValues {
  menuGroups: MenuGroup[]
}

// Schema básico de validación
const validationSchema = Yup.object().shape({
  menuGroups: Yup.array().of(
    Yup.object().shape({
      name: Yup.string().required('El nombre del grupo es requerido'),
      locations: Yup.array().of(Yup.string()),
      // Campos más simples para la validación
      regularMenuUrl: Yup.string(),
      sharedDishes: Yup.string(),
      sharedDrinks: Yup.string(),
      popularAppetizers: Yup.string(),
      popularMainCourses: Yup.string(),
      popularDesserts: Yup.string(),
      popularAlcoholicDrinks: Yup.string(),
      popularNonAlcoholicDrinks: Yup.string(),
    })
  )
})

// Componente MenuConfig con lógica simplificada
export default function MenuConfig() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { formData, updateField, uploadFile, saveFormData, refreshFormData } = useFormProgress()
  const [showNotification, setShowNotification] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [showSavePrompt, setShowSavePrompt] = useState(false)
  const formikRef = useRef<FormikProps<FormValues>>(null)
  const [openAccordions, setOpenAccordions] = useState<Record<number, boolean>>({})
  const [isLoading, setIsLoading] = useState(true)

  // Efecto para cargar datos
  useEffect(() => {
    const loadData = async () => {
      console.log("MenuConfig: Cargando datos iniciales...");
      try {
        await refreshFormData();
        console.log("Datos cargados correctamente");
      } catch (error) {
        console.error("Error al cargar datos:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [refreshFormData]);

  // Usar useMemo para calcular los valores iniciales en base a sameMenuForAll y grupos confirmados
  const initialValues = React.useMemo(() => {
    // Log de depuración detallado para ver el estado exacto de los datos
    console.log("ESTADO ACTUAL EN INITIAL VALUES:", {
      isLoading,
      sameMenuForAll: formData.sameMenuForAll,
      groups: formData.groups && formData.groups.length > 0 ? 
        formData.groups.map(g => ({name: g.name, nameConfirmed: g.nameConfirmed})) : 
        "No hay grupos",
      confirmedGroups: formData.groups ? 
        formData.groups.filter(g => g.nameConfirmed).length : 
        "No hay grupos",
      menuGroups: formData.menuGroups ? 
        formData.menuGroups.map(mg => mg.name) : 
        "No hay menuGroups",
      // Incluir ubicaciones para depuración
      locations: formData.locations || [],
    });
    
    // NUEVO: Función para asignar nombre basado en índice
    const generateUniqueGroupName = (index: number): string => {
      return `Grupo ${String.fromCharCode(65 + (index % 26))}${index >= 26 ? Math.floor(index / 26) : ''}`; // A, B, C, ... Z, A1, B1, etc.
    };
    
    // NUEVO: Función para asegurar nombres únicos en un array de grupos
    const ensureUniqueGroupNames = (groups: any[]): any[] => {
      // Imprimir cada grupo para diagnóstico
      console.log("Grupos antes de corregir nombres:", groups.map((g, i) => 
        `Grupo[${i}]: nombre="${g.name}", locations=${g.locations?.length || 0}`)
      );
      
      // Cada grupo tendrá un nombre basado en su índice, ignorando el nombre original
      return groups.map((group, index) => {
        const newGroupName = generateUniqueGroupName(index);
        if (group.name !== newGroupName) {
          console.log(`🔄 Reemplazando nombre "${group.name || '(vacío)'}" por "${newGroupName}" para el grupo ${index}`);
        }
        
        // Crear copia para no modificar el original y asignar nuevo nombre
        const groupCopy = {...group, name: newGroupName};
        
        // NUEVO: Filtrar las ubicaciones para asegurar que solo se incluyan las que existen actualmente
        const currentLocationNames = (formData.locations || [])
          .filter(loc => loc.nameConfirmed)
          .map(loc => loc.name);
          
        groupCopy.locations = (groupCopy.locations || []).filter(
          (location: string) => currentLocationNames.includes(location)
        );
        
        console.log(`Grupo ${index} actualizado:`, {
          nombre: groupCopy.name,
          ubicaciones_originales: group.locations || [],
          ubicaciones_actuales: groupCopy.locations,
        });
        
        return groupCopy;
      });
    };
    
    // Si todavía estamos cargando, devolver un valor temporal
    if (isLoading) {
      console.log("Aún cargando datos, retornando array vacío");
      return { menuGroups: [] };
    }
    
    // Obtener la lista de grupos confirmados actual
    const confirmedGroups = (formData.groups || []).filter(g => g.nameConfirmed);
    
    // NUEVO: Obtener lista actualizada de ubicaciones confirmadas
    const currentLocationNames = (formData.locations || [])
      .filter(loc => loc.nameConfirmed)
      .map(loc => loc.name);
    console.log("Ubicaciones confirmadas actuales:", currentLocationNames);
    
    // NUEVO: Verificar si hay discrepancia entre menuGroups guardados y grupos confirmados
    if (formData.menuGroups && formData.menuGroups.length > 0) {
      // Crear copia de menuGroups para actualizar las ubicaciones
      const updatedMenuGroups = JSON.parse(JSON.stringify(formData.menuGroups));
      
      // Actualizar las ubicaciones de cada menuGroup para incluir solo las ubicaciones actuales
      updatedMenuGroups.forEach((menuGroup: MenuGroup) => {
        menuGroup.locations = menuGroup.locations.filter(
          location => currentLocationNames.includes(location)
        );
      });
      
      // Verificar si hay más grupos confirmados que menuGroups guardados
      if (confirmedGroups.length > updatedMenuGroups.length) {
        console.log("⚠️ Discrepancia detectada: Hay más grupos confirmados que menuGroups guardados");
        console.log("Reconstruyendo menuGroups a partir de grupos confirmados");
        
        // Asegurar nombres únicos y reconstruir menuGroups
        const uniqueGroups = ensureUniqueGroupNames(confirmedGroups);
        const menuGroups = uniqueGroups.map(createMenuGroupFromConfirmedGroup);
        
        return { menuGroups };
      }
      
      // Verificar si todos los nombres de grupos confirmados están en menuGroups
      const menuGroupNames = updatedMenuGroups.map((mg: MenuGroup) => mg.name);
      const missingGroups = confirmedGroups.filter(group => 
        !menuGroupNames.includes(group.name)
      );
      
      if (missingGroups.length > 0) {
        console.log("⚠️ Discrepancia detectada: Hay grupos confirmados que no están en menuGroups");
        console.log("Grupos faltantes:", missingGroups.map(g => g.name));
        console.log("Reconstruyendo menuGroups a partir de grupos confirmados");
        
        // Asegurar nombres únicos y reconstruir menuGroups
        const uniqueGroups = ensureUniqueGroupNames(confirmedGroups);
        const menuGroups = uniqueGroups.map(createMenuGroupFromConfirmedGroup);
        
        return { menuGroups };
      }
      
      // No hay discrepancias en grupos, usar menuGroups existentes con ubicaciones actualizadas
      console.log("✅ Usando menuGroups existentes con ubicaciones actualizadas:", updatedMenuGroups);
      return { menuGroups: updatedMenuGroups };
    }
    
    // 2. Si no hay menuGroups guardados, evaluamos según sameMenuForAll
    if (formData.sameMenuForAll) {
      // Caso: Mismo menú para todas las ubicaciones
      const allLocations = (formData.locations || [])
        .filter(loc => loc.nameConfirmed)
        .map(loc => loc.name);
      
      console.log("✅ Mismo menú para todas. Creando grupo único con ubicaciones:", allLocations);
      return { 
        menuGroups: [createDefaultMenuGroup(allLocations)] 
      };
    } else {
      // Caso: Múltiples grupos desde Paso 1
      if (confirmedGroups.length > 0) {
        // Hay grupos confirmados, usamos esos
        console.log("✅ Usando grupos confirmados:", confirmedGroups.map(g => g.name));
        
        // Asegurar nombres únicos y reconstruir menuGroups
        const uniqueGroups = ensureUniqueGroupNames(confirmedGroups);
        const menuGroups = uniqueGroups.map(createMenuGroupFromConfirmedGroup);
        
        return { menuGroups };
      } else {
        // No hay grupos confirmados aunque eligió "varios grupos"
        // => advertencia y grupo por defecto
        console.warn("⚠️ No hay grupos confirmados aunque se eligió múltiples grupos");
        const allLocations = (formData.locations || [])
          .filter(loc => loc.nameConfirmed)
          .map(loc => loc.name);
        
        return { 
          menuGroups: [createDefaultMenuGroup(allLocations)] 
        };
      }
    }
  }, [formData, isLoading]); // Simplificamos las dependencias

  // Modificar useEffect para inicializar acordeones
  useEffect(() => {
    if (!isLoading && initialValues.menuGroups && initialValues.menuGroups.length > 0) {
      console.log("Inicializando acordeones para", initialValues.menuGroups.length, "grupos");
      
      // Solo inicializamos los acordeones si no se han inicializado previamente
      // o si ha cambiado el número de grupos
      if (Object.keys(openAccordions).length !== initialValues.menuGroups.length) {
        // Inicializar con un objeto limpio para evitar problemas con acordeones previos
        const initialAccordions: Record<number, boolean> = {};
        
        // Solo el primer acordeón estará abierto inicialmente
        initialValues.menuGroups.forEach((_: MenuGroup, index: number) => {
          initialAccordions[index] = index === 0;
        });
        
        console.log("Estado inicial de acordeones:", initialAccordions);
        setOpenAccordions(initialAccordions);
      }
    }
  }, [initialValues.menuGroups, isLoading]);

  // Función mejorada para toggle de acordeón
  const toggleAccordion = (index: number) => {
    console.log(`Toggling accordion ${index} from ${openAccordions[index] ? 'open' : 'closed'} to ${!openAccordions[index] ? 'open' : 'closed'}`);
    
    setOpenAccordions(prev => {
      // Crear una copia para no mutar el estado directamente
      const newState = {...prev};
      // Cambiar el estado del acordeón específico
      newState[index] = !prev[index];
      
      console.log("Nuevo estado de acordeones:", newState);
      return newState;
    });
  };

  // Función para manejar cambios en campos del formulario
  const handleFieldChange = (groupIndex: number, field: string, value: any) => {
    setHasUnsavedChanges(true);
    
    if (window.onFormStateChange) {
      window.onFormStateChange(true);
    }
    
    if (formikRef.current) {
      const updatedGroups = [...formikRef.current.values.menuGroups];
      updatedGroups[groupIndex] = {
        ...updatedGroups[groupIndex],
        [field]: value
      };
      
      // Actualizar solo el estado local de Formik primero
      formikRef.current.setFieldValue('menuGroups', updatedGroups);
      
      // Para checkboxes, retrasamos la actualización del estado global
      // para evitar que enableReinitialize cause problemas
      if (typeof value === 'boolean') {
        // No actualizar el estado global inmediatamente para checkboxes
        // Lo haremos más tarde cuando se guarde el formulario
      } else {
        // Para otros tipos de campos, actualizar normalmente
        updateField('menuGroups', updatedGroups);
      }
    }
  };

  // Función para manejar subida de archivos
  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
    setFieldValue: (field: string, value: any) => void,
    field: string,
    groupIndex: number
  ) => {
    const file = event.currentTarget.files?.[0];
    if (!file) return;
    
    try {
      setFieldValue(field, file);
      
      const fileUrl = await uploadFile(file, `menuGroups/${groupIndex}/${field}`);
      
      const urlField = field + 'Url';
      handleFieldChange(groupIndex, urlField, fileUrl);
    } catch (error) {
      console.error('Error al procesar archivo:', error);
    }
  };

  // Función para guardar
  const handleSave = async () => {
    try {
      if (formikRef.current) {
        // Obtener los valores actuales de Formik para guardar
        const currentValues = formikRef.current.values;
        // Actualizar el estado global con los valores actuales
        updateField('menuGroups', currentValues.menuGroups);
      }
      
      await saveFormData();
      setHasUnsavedChanges(false);
      
      if (window.onFormStateChange) {
        window.onFormStateChange(false);
      }
      
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);
      return true;
    } catch (error) {
      console.error('Error al guardar:', error);
      return false;
    }
  };

  // Exponer handleSave
  useEffect(() => {
    window.saveCurrentFormData = handleSave;
    return () => {
      window.saveCurrentFormData = undefined;
    };
  }, [handleSave]);

  // Función para manejar envío del formulario
  const handleSubmit = () => {
    if (hasUnsavedChanges) {
      setShowSavePrompt(true);
    } else {
      navigate('/onboarding/observations');
    }
  };

  // Componente para el modal de confirmación
  const SavePrompt = () => {
    if (!showSavePrompt) return null;

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
                setShowSavePrompt(false);
                navigate('/onboarding/observations');
              }}
              className="btn-secondary"
            >
              Continuar sin guardar
            </button>
            <button
              onClick={async () => {
                const success = await handleSave();
                if (success) {
                  setShowSavePrompt(false);
                  navigate('/onboarding/observations');
                }
              }}
              className="btn-primary"
            >
              Guardar y continuar
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Si no eligió "mismo menú" y no tiene grupos confirmados, mostrar advertencia
  const shouldShowWarning = !isLoading && !formData.sameMenuForAll && 
    (!formData.groups || formData.groups.filter(g => g.nameConfirmed).length === 0);

  // Mostrar estado de carga mientras no tengamos datos
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-purple"></div>
        <span className="ml-3 text-gray-600">Cargando datos del menú...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {showNotification && (
        <Notification
          message="Los cambios han sido guardados correctamente"
          onClose={() => setShowNotification(false)}
        />
      )}

      <SavePrompt />

      <div>
        <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-pink-500 mb-2">Configuración de Menús</h2>
        <p className="mt-2 text-gray-600">
          Configure los diferentes tipos de menús disponibles en su restaurante.
        </p>
        
        {/* Información de depuración con estilo mejorado */}
        <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-orange-50 to-pink-50 border border-orange-100 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center">
              <div className="h-8 w-8 rounded-full bg-gradient-to-r from-orange-400 to-pink-500 flex items-center justify-center shadow-sm mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div>
                <span className="text-sm text-gray-500">Modo:</span>
                <p className="font-medium text-gray-800">{formData.sameMenuForAll ? 'Mismo menú para todas las ubicaciones' : 'Múltiples grupos'}</p>
              </div>
            </div>
            <div className="flex items-center">
              <div className="h-8 w-8 rounded-full bg-gradient-to-r from-orange-400 to-pink-500 flex items-center justify-center shadow-sm mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <span className="text-sm text-gray-500">Grupos confirmados:</span>
                <p className="font-medium text-gray-800">{formData.groups ? formData.groups.filter(g => g.nameConfirmed).length : 0}</p>
              </div>
            </div>
            <div className="flex items-center">
              <div className="h-8 w-8 rounded-full bg-gradient-to-r from-orange-400 to-pink-500 flex items-center justify-center shadow-sm mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </div>
              <div>
                <span className="text-sm text-gray-500">Mostrando:</span>
                <p className="font-medium text-gray-800">{initialValues.menuGroups.length} grupo(s)</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {shouldShowWarning && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                No se encontraron grupos confirmados en el Paso 1, a pesar de que seleccionó "Varios grupos". 
                Se utilizará un menú general para todas las ubicaciones.
              </p>
            </div>
          </div>
        </div>
      )}

      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
        innerRef={formikRef}
        enableReinitialize={isLoading}
      >
        {({ values, setFieldValue }) => (
          <Form className="space-y-8">
            <div className="space-y-4">
              {values.menuGroups.map((group: MenuGroup, groupIndex: number) => (
                <Accordion
                  key={groupIndex}
                  title={group.name || `Menú ${groupIndex + 1}`}
                  locations={group.locations}
                  isOpen={!!openAccordions[groupIndex]}
                  onToggle={() => toggleAccordion(groupIndex)}
                >
                  <div className="space-y-6 p-4">
                    {/* Sección Menús con diseño moderno */}
                    <div className="border-b border-gray-200 pb-8">
                      <h3 className="text-xl font-semibold mb-6 bg-gradient-to-r from-orange-400 to-pink-500 bg-clip-text text-transparent inline-block">
                        Archivos de Menú
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Menú Regular - Tarjeta moderna */}
                        <div className="relative overflow-hidden rounded-2xl bg-white shadow-xl p-6 transition-all duration-300 hover:shadow-2xl">
                          <div className="absolute right-0 top-0 h-40 w-40 opacity-10 transform translate-x-8 -translate-y-8">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-full w-full text-orange-400" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
                            </svg>
                          </div>
                          <div className="relative z-10">
                            <label className="form-label text-lg font-bold text-gray-800 mb-3 block">Menú Regular PDF/Imagen</label>
                            <div className="mt-2">
                              <input
                                type="file"
                                onChange={(e) => handleFileChange(e, setFieldValue, `menuGroups[${groupIndex}].regularMenu`, groupIndex)}
                                className="relative block w-full min-w-0 flex-auto rounded-xl border border-gray-200 bg-white/95 px-4 py-3 text-base text-gray-700 transition-all duration-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:bg-gradient-to-r file:from-orange-400 file:to-pink-500 file:text-white hover:shadow-md focus:border-orange-400 focus:outline-none"
                                accept=".pdf,.jpg,.jpeg,.png"
                              />
                            </div>
                            {values.menuGroups[groupIndex].regularMenuUrl && (
                              <div className="mt-3">
                                <a
                                  href={values.menuGroups[groupIndex].regularMenuUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center px-4 py-2 rounded-xl bg-gradient-to-r from-orange-400/10 to-pink-500/10 text-orange-500 hover:from-orange-400/20 hover:to-pink-500/20 transition-all duration-300"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                  </svg>
                                  Ver menú subido
                                </a>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Menús Especiales - Tarjeta moderna con checkboxes */}
                        <div className="relative overflow-hidden rounded-2xl bg-white shadow-xl p-6 transition-all duration-300 hover:shadow-2xl">
                          <div className="absolute right-0 top-0 h-40 w-40 opacity-10 transform translate-x-8 -translate-y-8">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-full w-full text-pink-400" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-9.03C11.34 12.84 13 11.12 13 9V2h-2v7zm5-3v8h2.5v8H21V2c-2.76 0-5 2.24-5 4z"/>
                            </svg>
                          </div>
                          <div className="relative z-10">
                            <h4 className="text-lg font-bold text-gray-800 mb-4">Menús Especiales</h4>
                            
                            {/* Menú Dietético - Checkbox normal */}
                            <div className="space-y-5">
                              <div className="flex items-center mb-3">
                                <input
                                  type="checkbox"
                                  id={`hasDietaryMenu-${groupIndex}`}
                                  checked={values.menuGroups[groupIndex].hasDietaryMenu}
                                  onChange={(e) => {
                                    console.log(`Checkbox Dietético [${groupIndex}]: Cambiando de ${values.menuGroups[groupIndex].hasDietaryMenu} a ${e.target.checked}`);
                                    handleFieldChange(groupIndex, 'hasDietaryMenu', e.target.checked);
                                  }}
                                  className="h-5 w-5 rounded border-gray-300 text-orange-500 focus:ring-orange-300"
                                />
                                <label htmlFor={`hasDietaryMenu-${groupIndex}`} className="ml-3 font-medium text-gray-700">
                                  ¿Tiene menú para dietas especiales?
                                </label>
                              </div>
                              
                              {values.menuGroups[groupIndex].hasDietaryMenu && (
                                <div className="ml-8 mt-3 space-y-3">
                                  <label className="block text-sm font-medium text-gray-700">Menú Dietético PDF/Imagen</label>
                                  <input
                                    type="file"
                                    onChange={(e) => handleFileChange(e, setFieldValue, `menuGroups[${groupIndex}].dietaryMenu`, groupIndex)}
                                    className="relative block w-full min-w-0 flex-auto rounded-xl border border-gray-200 bg-white/95 px-4 py-3 text-sm text-gray-700 transition-all duration-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:bg-gradient-to-r file:from-orange-400 file:to-pink-500 file:text-white hover:shadow-md focus:border-orange-400 focus:outline-none"
                                    accept=".pdf,.jpg,.jpeg,.png"
                                  />
                                  {values.menuGroups[groupIndex].dietaryMenuUrl && (
                                    <a
                                      href={values.menuGroups[groupIndex].dietaryMenuUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center px-3 py-1.5 text-sm rounded-lg bg-gradient-to-r from-orange-400/10 to-pink-500/10 text-orange-500 hover:from-orange-400/20 hover:to-pink-500/20 transition-all duration-300"
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                      </svg>
                                      Ver menú dietético
                                    </a>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Menú Vegano - Checkbox normal */}
                            <div className="space-y-3 mt-5">
                              <div className="flex items-center mb-3">
                                <input
                                  type="checkbox"
                                  id={`hasVeganMenu-${groupIndex}`}
                                  checked={values.menuGroups[groupIndex].hasVeganMenu}
                                  onChange={(e) => {
                                    console.log(`Checkbox Vegano [${groupIndex}]: Cambiando de ${values.menuGroups[groupIndex].hasVeganMenu} a ${e.target.checked}`);
                                    handleFieldChange(groupIndex, 'hasVeganMenu', e.target.checked);
                                  }}
                                  className="h-5 w-5 rounded border-gray-300 text-orange-500 focus:ring-orange-300"
                                />
                                <label htmlFor={`hasVeganMenu-${groupIndex}`} className="ml-3 font-medium text-gray-700">
                                  ¿Tiene menú vegano?
                                </label>
                              </div>
                              
                              {values.menuGroups[groupIndex].hasVeganMenu && (
                                <div className="ml-8 mt-3 space-y-3">
                                  <label className="block text-sm font-medium text-gray-700">Menú Vegano PDF/Imagen</label>
                                  <input
                                    type="file"
                                    onChange={(e) => handleFileChange(e, setFieldValue, `menuGroups[${groupIndex}].veganMenu`, groupIndex)}
                                    className="relative block w-full min-w-0 flex-auto rounded-xl border border-gray-200 bg-white/95 px-4 py-3 text-sm text-gray-700 transition-all duration-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:bg-gradient-to-r file:from-orange-400 file:to-pink-500 file:text-white hover:shadow-md focus:border-orange-400 focus:outline-none"
                                    accept=".pdf,.jpg,.jpeg,.png"
                                  />
                                  {values.menuGroups[groupIndex].veganMenuUrl && (
                                    <a
                                      href={values.menuGroups[groupIndex].veganMenuUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center px-3 py-1.5 text-sm rounded-lg bg-gradient-to-r from-orange-400/10 to-pink-500/10 text-orange-500 hover:from-orange-400/20 hover:to-pink-500/20 transition-all duration-300"
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                      </svg>
                                      Ver menú vegano
                                    </a>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Otros Menús - Checkbox normal */}
                            <div className="mt-5">
                              <div className="flex items-center">
                                <input
                                  type="checkbox"
                                  id={`hasOtherMenus-${groupIndex}`}
                                  checked={values.menuGroups[groupIndex].hasOtherMenus}
                                  onChange={(e) => {
                                    console.log(`Checkbox Otros Menús [${groupIndex}]: Cambiando de ${values.menuGroups[groupIndex].hasOtherMenus} a ${e.target.checked}`);
                                    handleFieldChange(groupIndex, 'hasOtherMenus', e.target.checked);
                                  }}
                                  className="h-5 w-5 rounded border-gray-300 text-orange-500 focus:ring-orange-300"
                                />
                                <label htmlFor={`hasOtherMenus-${groupIndex}`} className="ml-3 font-medium text-gray-700">
                                  ¿Tiene otros tipos de menús?
                                </label>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Sección Platos y Bebidas con diseño moderno */}
                    <div className="mt-8">
                      <h3 className="text-2xl font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-pink-500">
                        Platos y Bebidas Destacados
                      </h3>

                      {/* Sección principal: Platos y Bebidas Populares */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                        {/* Card: Platos Populares */}
                        <div className="relative overflow-hidden rounded-2xl bg-white shadow-xl transition-all duration-300 hover:shadow-2xl">
                          <div className="absolute right-0 top-0 h-40 w-40 opacity-10 transform translate-x-8 -translate-y-8">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-full w-full text-orange-400" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-9.03C11.34 12.84 13 11.12 13 9V2h-2v7zm5-3v8h2.5v8H21V2c-2.76 0-5 2.24-5 4z"/>
                            </svg>
                          </div>
                          <div className="p-6 relative z-10">
                            <div className="flex items-center mb-4">
                              <div className="p-3 rounded-full bg-gradient-to-r from-orange-400 to-pink-500 text-white mr-4 shadow-md">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                              </div>
                              <label className="text-xl font-bold text-gray-800">Platos Populares</label>
                            </div>
                            <textarea
                              value={values.menuGroups[groupIndex].sharedDishes}
                              onChange={(e) => handleFieldChange(groupIndex, 'sharedDishes', e.target.value)}
                              className="w-full p-4 rounded-xl border border-gray-200 bg-white/95 focus:border-orange-400 focus:ring focus:ring-orange-200 focus:ring-opacity-50 text-gray-700 transition-all shadow-sm hover:shadow-md resize-none"
                              rows={4}
                              placeholder="Ingresa todos los platos más populares de tu restaurante (principales, entradas, etc.)"
                            />
                          </div>
                        </div>

                        {/* Card: Bebidas Populares */}
                        <div className="relative overflow-hidden rounded-2xl bg-white shadow-xl transition-all duration-300 hover:shadow-2xl">
                          <div className="absolute right-0 top-0 h-40 w-40 opacity-10 transform translate-x-8 -translate-y-8">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-full w-full text-pink-400" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M3 2l2.01 18.23C5.13 21.23 5.97 22 7 22h10c1.03 0 1.87-.77 1.99-1.77L21 2H3zm9 17c-1.66 0-3-1.34-3-3 0-2 3-5.4 3-5.4s3 3.4 3 5.4c0 1.66-1.34 3-3 3zm6.33-11H5.67l-.44-4h13.53l-.43 4z"/>
                            </svg>
                          </div>
                          <div className="p-6 relative z-10">
                            <div className="flex items-center mb-4">
                              <div className="p-3 rounded-full bg-gradient-to-r from-orange-400 to-pink-500 text-white mr-4 shadow-md">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                                </svg>
                              </div>
                              <label className="text-xl font-bold text-gray-800">Bebidas Populares</label>
                            </div>
                            <textarea
                              value={values.menuGroups[groupIndex].sharedDrinks}
                              onChange={(e) => handleFieldChange(groupIndex, 'sharedDrinks', e.target.value)}
                              className="w-full p-4 rounded-xl border border-gray-200 bg-white/95 focus:border-pink-400 focus:ring focus:ring-pink-200 focus:ring-opacity-50 text-gray-700 transition-all shadow-sm hover:shadow-md resize-none"
                              rows={4}
                              placeholder="Ingresa las bebidas más populares de tu restaurante"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Sección de categorías: Entradas, Postres */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
                        {/* Entradas Populares */}
                        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-50 to-pink-50 shadow-xl p-6 transition-all duration-300 hover:shadow-2xl">
                          <div className="flex items-center mb-4">
                            <div className="p-3 rounded-full bg-gradient-to-r from-orange-400 to-pink-500 text-white mr-3 shadow-md">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                              </svg>
                            </div>
                            <label className="text-lg font-bold text-gray-800">Entradas Populares</label>
                          </div>
                          <textarea
                            value={values.menuGroups[groupIndex].popularAppetizers}
                            onChange={(e) => handleFieldChange(groupIndex, 'popularAppetizers', e.target.value)}
                            className="w-full p-4 rounded-xl border border-orange-100 bg-white/90 focus:border-orange-400 focus:ring focus:ring-orange-200 focus:ring-opacity-50 text-gray-700 transition-all shadow-sm hover:shadow-md resize-none"
                            rows={3}
                            placeholder="Ingresa las entradas más populares de tu restaurante"
                          />
                        </div>

                        {/* Postres Populares */}
                        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-50 to-pink-50 shadow-xl p-6 transition-all duration-300 hover:shadow-2xl">
                          <div className="flex items-center mb-4">
                            <div className="p-3 rounded-full bg-gradient-to-r from-orange-400 to-pink-500 text-white mr-3 shadow-md">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 15.546c-.523 0-1.046.151-1.5.454a2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.701 2.701 0 00-1.5-.454M9 6v2m3-2v2m3-2v2M9 3h.01M12 3h.01M15 3h.01M21 21v-7a2 2 0 00-2-2H5a2 2 0 00-2 2v7h18zm-3-9v-2a2 2 0 00-2-2H8a2 2 0 00-2 2v2h12z" />
                              </svg>
                            </div>
                            <label className="text-lg font-bold text-gray-800">Postres Populares</label>
                          </div>
                          <textarea
                            value={values.menuGroups[groupIndex].popularDesserts}
                            onChange={(e) => handleFieldChange(groupIndex, 'popularDesserts', e.target.value)}
                            className="w-full p-4 rounded-xl border border-pink-100 bg-white/90 focus:border-pink-400 focus:ring focus:ring-pink-200 focus:ring-opacity-50 text-gray-700 transition-all shadow-sm hover:shadow-md resize-none"
                            rows={3}
                            placeholder="Ingresa los postres más populares de tu restaurante"
                          />
                        </div>
                      </div>

                      {/* Sección de Bebidas Alcohólicas y No Alcohólicas */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Bebidas Alcohólicas */}
                        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-50 to-pink-50 shadow-xl p-6 transition-all duration-300 hover:shadow-2xl">
                          <div className="absolute right-0 bottom-0 h-32 w-32 opacity-10 transform translate-x-8 translate-y-8">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-full w-full text-orange-400" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M7.5 7l-2-2h13l-2 2M11 13.95V21h2v-7.05m5-7L13.05 2H10.95L6 6.95 14 15l1-1 1 1 4-4-4-4z"/>
                            </svg>
                          </div>
                          <div className="relative z-10">
                            <div className="flex items-center mb-4">
                              <div className="p-3 rounded-full bg-gradient-to-r from-orange-400 to-pink-500 text-white mr-3 shadow-md">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                              </div>
                              <label className="text-lg font-bold text-gray-800">Bebidas Alcohólicas Populares</label>
                            </div>
                            <textarea
                              value={values.menuGroups[groupIndex].popularAlcoholicDrinks}
                              onChange={(e) => handleFieldChange(groupIndex, 'popularAlcoholicDrinks', e.target.value)}
                              className="w-full p-4 rounded-xl border border-orange-100 bg-white/90 focus:border-orange-400 focus:ring focus:ring-orange-200 focus:ring-opacity-50 text-gray-700 transition-all shadow-sm hover:shadow-md resize-none"
                              rows={3}
                              placeholder="Ingresa las bebidas alcohólicas más populares"
                            />
                          </div>
                        </div>

                        {/* Bebidas No Alcohólicas */}
                        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-50 to-pink-50 shadow-xl p-6 transition-all duration-300 hover:shadow-2xl">
                          <div className="absolute right-0 bottom-0 h-32 w-32 opacity-10 transform translate-x-8 translate-y-8">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-full w-full text-pink-400" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M6 4l1.5 9h9L18 4M2 2v2h20V2M4 22h16v-3H4"/>
                            </svg>
                          </div>
                          <div className="relative z-10">
                            <div className="flex items-center mb-4">
                              <div className="p-3 rounded-full bg-gradient-to-r from-orange-400 to-pink-500 text-white mr-3 shadow-md">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                </svg>
                              </div>
                              <label className="text-lg font-bold text-gray-800">Bebidas No Alcohólicas Populares</label>
                            </div>
                            <textarea
                              value={values.menuGroups[groupIndex].popularNonAlcoholicDrinks}
                              onChange={(e) => handleFieldChange(groupIndex, 'popularNonAlcoholicDrinks', e.target.value)}
                              className="w-full p-4 rounded-xl border border-pink-100 bg-white/90 focus:border-pink-400 focus:ring focus:ring-pink-200 focus:ring-opacity-50 text-gray-700 transition-all shadow-sm hover:shadow-md resize-none"
                              rows={3}
                              placeholder="Ingresa las bebidas no alcohólicas más populares"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Accordion>
              ))}
            </div>

            <div className="flex justify-between">
              <button
                type="button"
                onClick={handleSave}
                className={hasUnsavedChanges ? 
                  'px-6 py-3 rounded-xl bg-gradient-to-r from-orange-400 to-pink-500 text-white font-medium shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105' : 
                  'px-6 py-3 rounded-xl bg-gray-100 text-gray-400 font-medium cursor-not-allowed transition-colors'}
                disabled={!hasUnsavedChanges}
              >
                {hasUnsavedChanges ? 'Guardar cambios' : 'Cambios guardados'}
              </button>
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => navigate('/onboarding/tips-policy')}
                  className="px-8 py-3 rounded-xl border-2 border-orange-400 bg-white text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-pink-500 font-medium shadow-sm hover:shadow-md transition-all duration-300 transform hover:scale-105"
                >
                  {t('back')}
                </button>
                <button 
                  type="submit"
                  className="px-8 py-3 rounded-xl bg-gradient-to-r from-orange-400 to-pink-500 text-white font-medium shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105"
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
} 
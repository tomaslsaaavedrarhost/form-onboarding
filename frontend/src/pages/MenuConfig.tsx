import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useFormProgress } from '../hooks/useFormProgress'
import { useTranslation } from '../hooks/useTranslation'
import { Formik, Form, Field, FormikProps } from 'formik'
import * as Yup from 'yup'
import { DocumentIcon, TrashIcon, LinkIcon } from '@heroicons/react/24/outline'
import FormActions from '../components/FormActions'
import { Notification } from '../components/Notification'
import { MenuGroup } from '../context/FormContext'

// Extender la interfaz Window para incluir saveCurrentFormData
declare global {
  interface Window {
    onFormStateChange?: (hasChanges: boolean) => void;
    saveCurrentFormData?: () => Promise<boolean>;
  }
}

interface FormValues {
  menuGroups: MenuGroup[]
}

const validationSchema = Yup.object().shape({
  menuGroups: Yup.array().of(
    Yup.object().shape({
      name: Yup.string().required('El nombre del grupo es requerido'),
      locations: Yup.array().of(Yup.string()).required('Las ubicaciones son requeridas'),
      regularMenu: Yup.mixed().nullable(),
      regularMenuUrl: Yup.string().url('Debe ser una URL válida').required('La URL del menú regular es requerida'),
      hasDietaryMenu: Yup.boolean(),
      dietaryMenu: Yup.mixed().nullable(),
      dietaryMenuUrl: Yup.string().url('Debe ser una URL válida').when('hasDietaryMenu', {
        is: true,
        then: () => Yup.string().required('La URL del menú dietético es requerida si tiene uno')
      }),
      hasVeganMenu: Yup.boolean(),
      veganMenu: Yup.mixed().nullable(),
      veganMenuUrl: Yup.string().url('Debe ser una URL válida').when('hasVeganMenu', {
        is: true,
        then: () => Yup.string().required('La URL del menú vegano es requerida si tiene uno')
      }),
      hasOtherMenus: Yup.boolean(),
      otherMenus: Yup.array().of(Yup.mixed()),
      otherMenuUrls: Yup.array().of(Yup.string().url('Debe ser una URL válida')),
      sharedDishes: Yup.string().required('Los platos compartidos son requeridos'),
      sharedDrinks: Yup.string().required('Las bebidas compartidas son requeridas'),
      popularAppetizers: Yup.string().required('Los aperitivos populares son requeridos'),
      popularMainCourses: Yup.string().required('Los platos principales populares son requeridos'),
      popularDesserts: Yup.string().required('Los postres populares son requeridos'),
      popularAlcoholicDrinks: Yup.string().required('Las bebidas alcohólicas populares son requeridas'),
      popularNonAlcoholicDrinks: Yup.string().required('Las bebidas no alcohólicas populares son requeridas'),
    })
  ),
})

export default function MenuConfig() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { formData, updateField, uploadFile, saveFormData } = useFormProgress()
  const [showNotification, setShowNotification] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [showSavePrompt, setShowSavePrompt] = useState(false)
  const formikRef = useRef<FormikProps<FormValues>>(null)

  // Simplificamos el initialValues para que sea más directo
  const initialValues: FormValues = {
    menuGroups: formData.menuGroups ? JSON.parse(JSON.stringify(formData.menuGroups)) : [
      {
        name: '',
        locations: [],
        regularMenu: null,
        regularMenuUrl: '',
        hasDietaryMenu: false,
        dietaryMenu: null,
        dietaryMenuUrl: '',
        hasVeganMenu: false,
        veganMenu: null,
        veganMenuUrl: '',
        hasOtherMenus: false,
        otherMenus: [],
        otherMenuUrls: [],
        sharedDishes: '',
        sharedDrinks: '',
        popularAppetizers: '',
        popularMainCourses: '',
        popularDesserts: '',
        popularAlcoholicDrinks: '',
        popularNonAlcoholicDrinks: '',
      },
    ],
  }

  // Comunicar cambios al componente padre
  useEffect(() => {
    if (window.onFormStateChange) {
      window.onFormStateChange(hasUnsavedChanges);
    }
  }, [hasUnsavedChanges]);

  // Mejoramos completamente el handleFieldChange para que sea más robusto
  const handleFieldChange = (groupIndex: number, field: string, value: any) => {
    console.log(`⚡ Actualizando campo: menuGroups[${groupIndex}].${field}`, value);
    
    // Marcar que hay cambios sin guardar
    setHasUnsavedChanges(true);
    
    // Comunicar al componente padre
    if (window.onFormStateChange) {
      window.onFormStateChange(true);
    }
    
    try {
      // Paso 1: Obtenemos los grupos actuales del formData para asegurar que estamos actualizando datos frescos
      const currentGroups = formData.menuGroups || [];
      console.log('📋 Grupos actuales del formData:', currentGroups);
      
      // Paso 2: Creamos una copia profunda para evitar problemas de referencia
      const updatedGroups = JSON.parse(JSON.stringify(currentGroups));
      
      // Paso 3: Aseguramos que el grupo exista
      if (!updatedGroups[groupIndex]) {
        updatedGroups[groupIndex] = {
          name: '',
          locations: [],
          regularMenu: null,
          regularMenuUrl: '',
          hasDietaryMenu: false,
          dietaryMenu: null,
          dietaryMenuUrl: '',
          hasVeganMenu: false,
          veganMenu: null,
          veganMenuUrl: '',
          hasOtherMenus: false,
          otherMenus: [],
          otherMenuUrls: [],
          sharedDishes: '',
          sharedDrinks: '',
          popularAppetizers: '',
          popularMainCourses: '',
          popularDesserts: '',
          popularAlcoholicDrinks: '',
          popularNonAlcoholicDrinks: '',
        };
      }
      
      // Paso 4: Actualizar el valor específico
      updatedGroups[groupIndex][field] = value;
      
      // Paso 5: Actualizar directamente en el estado global
      console.log('📋 Actualizando menuGroups con:', updatedGroups);
      updateField('menuGroups', updatedGroups);
      
      console.log(`✅ Campo actualizado exitosamente`);
      return true;
    } catch (error) {
      console.error(`❌ Error al actualizar menuGroups[${groupIndex}].${field}:`, error);
      return false;
    }
  }

  // Mejoramos el handleFileChange para que sea más robusto
  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
    setFieldValue: (field: string, value: any) => void,
    field: string,
    groupIndex: number
  ) => {
    const file = event.currentTarget.files?.[0];
    if (!file) {
      console.log('❌ No se seleccionó ningún archivo');
      return;
    }
    
    try {
      console.log(`⚡ Procesando cambio de archivo para ${field}`);
      
      // Paso 1: Actualizar Formik con el archivo
      console.log('📋 Actualizando Formik con el archivo');
      setFieldValue(field, file);
      
      // Paso 2: Subir el archivo
      console.log('🔄 Subiendo archivo...');
      const fileUrl = await uploadFile(file, `menuGroups/${groupIndex}/${field}`);
      console.log('✅ Archivo subido correctamente, URL:', fileUrl);
      
      // Paso 3: Actualizar el estado global con la URL
      console.log('📋 Actualizando estado global con la URL del archivo');
      const success = handleFieldChange(groupIndex, field, fileUrl);
      
      if (success) {
        console.log('✅ Estado actualizado correctamente con la URL del archivo');
      } else {
        console.error('❌ Error al actualizar el estado con la URL del archivo');
        alert('Se subió el archivo, pero hubo un error al actualizar el formulario. Por favor intente nuevamente.');
      }
    } catch (error) {
      console.error('❌ Error al procesar el archivo:', error);
      alert('Error al subir el archivo. Por favor intente nuevamente.');
    }
  }

  // Completamente reconstruimos handleSave para asegurar su funcionamiento
  const handleSave = useCallback(async (values: FormValues) => {
    try {
      console.log('⚡ INICIO DE GUARDADO');
      console.log('📋 Valores recibidos:', values);
      
      // Paso 1: Hacer una copia profunda de los valores
      const menuGroupsCopy = JSON.parse(JSON.stringify(values.menuGroups));
      console.log('📋 Copia profunda creada');
      
      // Paso 2: Verificar que cada grupo tenga todos los campos necesarios
      menuGroupsCopy.forEach((group: any, index: number) => {
        console.log(`🔍 Verificando grupo ${index}:`, group.name || 'Sin nombre');
      });
      
      // Paso 3: Actualizar el estado global directamente
      console.log('⚡ Actualizando estado global con menuGroups');
      updateField('menuGroups', menuGroupsCopy);
      
      // Paso 4: Verificar que el estado global se haya actualizado
      console.log('🔍 Formdata después de actualizar:', formData.menuGroups);
      
      // Paso 5: Guardar los datos
      console.log('⚡ Llamando a saveFormData()');
      const success = await saveFormData();
      console.log('📋 Resultado de saveFormData:', success);
      
      if (success) {
        console.log('✅ ÉXITO: Datos guardados correctamente');
        setHasUnsavedChanges(false);
        
        // Notificar al componente padre
        if (window.onFormStateChange) {
          window.onFormStateChange(false);
        }
        
        setShowNotification(true);
        setTimeout(() => setShowNotification(false), 3000);
        return true;
      } else {
        console.error('❌ ERROR: Falló saveFormData()');
        alert('Error al guardar los datos. Por favor intente de nuevo.');
        return false;
      }
    } catch (error) {
      console.error('❌ ERROR CRÍTICO durante el guardado:', error);
      alert('Error al procesar el guardado. Por favor intente de nuevo.');
      return false;
    }
  }, [updateField, saveFormData, formData]);

  // Mejoramos la exposición de saveCurrentFormData
  useEffect(() => {
    window.saveCurrentFormData = async () => {
      console.log('⚡ INVOCANDO saveCurrentFormData');
      
      try {
        // Método 1: Utilizar la referencia directa a Formik (mejor opción)
        if (formikRef.current) {
          console.log('📋 MÉTODO 1: Usando valores directos de Formik');
          const formikValues = formikRef.current.values;
          console.log('📋 Valores obtenidos de Formik:', formikValues);
          
          // Ejecutamos el guardado usando estos valores
          return await handleSave(formikValues);
        }
        
        // Método 2: Intentar recuperar valores desde el atributo data
        try {
          console.log('📋 MÉTODO 2: Intentando recuperar valores desde data-formik-values');
          const formElement = document.querySelector('form');
          const formikValuesAttr = formElement?.getAttribute('data-formik-values');
          
          if (formikValuesAttr) {
            console.log('📋 Valores encontrados en data-formik-values');
            const formikValues = JSON.parse(formikValuesAttr);
            return await handleSave(formikValues);
          }
        } catch (dataError) {
          console.error('❌ Error al obtener valores desde data-formik-values:', dataError);
        }
        
        // Si llegamos aquí, no hay forma de obtener los valores
        console.error('❌ NO SE PUDIERON OBTENER LOS VALORES DEL FORMULARIO');
        alert('Error: No se pudieron recuperar los datos del formulario. Por favor intente nuevamente.');
        return false;
      } catch (error) {
        console.error('❌ ERROR CRÍTICO en saveCurrentFormData:', error);
        alert('Error grave al procesar el guardado. Por favor intente nuevamente.');
        return false;
      }
    };
    
    return () => {
      window.saveCurrentFormData = undefined;
    };
  }, [handleSave]);

  // Simplificamos handleSubmit
  const handleSubmit = (values: FormValues) => {
    console.log('Enviando formulario. ¿Hay cambios sin guardar?', hasUnsavedChanges);
    
    // Actualiza el estado global con los valores actuales
    updateField('menuGroups', values.menuGroups);
    
    if (hasUnsavedChanges) {
      console.log('Mostrando prompt de guardado');
      setShowSavePrompt(true);
    } else {
      console.log('Navegando a observaciones');
      navigate('/onboarding/observations');
    }
  }

  // Componente para el modal de confirmación
  const SavePrompt = () => {
    if (!showSavePrompt) return null

    console.log('📋 Renderizando SavePrompt modal');
    
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
                console.log('⚡ Continuar sin guardar');
                setShowSavePrompt(false);
                navigate('/onboarding/observations');
              }}
              className="btn-secondary"
            >
              Continuar sin guardar
            </button>
            <button
              onClick={async () => {
                console.log('⚡ Guardar y continuar');
                try {
                  if (formikRef.current) {
                    console.log('📋 Valores obtenidos de formikRef:', formikRef.current.values);
                    // Creamos una copia profunda para evitar problemas de referencia
                    const valuesCopy = JSON.parse(JSON.stringify(formikRef.current.values));
                    console.log('📋 Copia de valores para guardar:', valuesCopy);
                    
                    // Actualizamos el estado global
                    updateField('menuGroups', valuesCopy.menuGroups);
                    console.log('✅ Estado global actualizado con menuGroups');
                    
                    // Persistimos los cambios
                    const success = await saveFormData();
                    console.log('📋 Resultado de saveFormData:', success);
                    
                    if (success) {
                      console.log('✅ Guardado exitoso, navegando...');
                      setShowSavePrompt(false);
                      setHasUnsavedChanges(false);
                      navigate('/onboarding/observations');
                    } else {
                      console.error('❌ Error al guardar');
                      alert('Error al guardar los datos. Por favor intente nuevamente.');
                    }
                  } else {
                    console.error('❌ No se pudo acceder a los valores del formulario');
                    alert('Error al acceder a los datos del formulario. Por favor intente nuevamente.');
                  }
                } catch (error) {
                  console.error('❌ Error en el proceso:', error);
                  alert('Error al procesar los datos. Por favor intente nuevamente.');
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
        <h2 className="text-2xl font-semibold text-gray-900">Configuración de Menús</h2>
        <p className="mt-2 text-sm text-gray-600">
          Configure los diferentes tipos de menús disponibles en su restaurante. Puede agrupar los menús por categorías
          y especificar detalles sobre los platos y bebidas más populares.
        </p>
      </div>

      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
        // Solo detectar si hay cambios en el formulario
        validate={() => {
          // Si Formik está ejecutando la validación, es porque algo cambió
          setHasUnsavedChanges(true);
          // Comunicar al componente padre
          if (window.onFormStateChange) {
            window.onFormStateChange(true);
          }
          return {}; // No hay errores de validación
        }}
        innerRef={formikRef}
      >
        {(formikProps: FormikProps<FormValues>) => {
          const { values, errors, touched, setFieldValue, dirty } = formikProps
          
          // Efecto para detectar cambios en el formulario
          React.useEffect(() => {
            if (dirty) {
              setHasUnsavedChanges(true);
              if (window.onFormStateChange) {
                window.onFormStateChange(true);
              }
            }
          }, [dirty, values]);
          
          return (
            <Form className="space-y-8" data-formik-values={JSON.stringify(values)}>
              {values.menuGroups.map((group, groupIndex) => (
                <div
                  key={groupIndex}
                  className="bg-white shadow rounded-lg overflow-hidden"
                >
                  <div className="p-6 space-y-6">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">
                        Grupo de Menú {groupIndex + 1}
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Agrupe sus menús por categoría (por ejemplo: Almuerzo, Cena, Brunch) y proporcione los detalles correspondientes.
                      </p>
                    </div>

                    <div>
                      <label htmlFor={`menuGroups.${groupIndex}.name`} className="block text-sm font-medium text-gray-700">
                        Nombre del Grupo
                      </label>
                      <p className="mt-1 text-sm text-gray-500">
                        Asigne un nombre descriptivo a este grupo de menús
                      </p>
                      <Field
                        type="text"
                        name={`menuGroups.${groupIndex}.name`}
                        className="mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        placeholder="Ej: Menú de Almuerzo, Menú de Cena"
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          // Primero actualizar el estado de Formik
                          setFieldValue(`menuGroups.${groupIndex}.name`, e.target.value);
                          // Luego actualizar el estado global
                          handleFieldChange(groupIndex, 'name', e.target.value);
                        }}
                      />
                    </div>

                    <div>
                      <label htmlFor={`menuGroups.${groupIndex}.regularMenuUrl`} className="block text-sm font-medium text-gray-700">
                        URL del Menú Regular
                      </label>
                      <p className="mt-1 text-sm text-gray-500">
                        Proporcione el enlace al menú regular de su restaurante
                      </p>
                      <div className="mt-2 flex rounded-md shadow-sm">
                        <span className="inline-flex items-center rounded-l-md border border-r-0 border-gray-300 bg-gray-50 px-3 text-gray-500 sm:text-sm">
                          <LinkIcon className="h-4 w-4" />
                        </span>
                        <Field
                          type="text"
                          name={`menuGroups.${groupIndex}.regularMenuUrl`}
                          className="block w-full flex-1 rounded-none rounded-r-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          placeholder="https://ejemplo.com/menu"
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            // Primero actualizar el estado de Formik
                            setFieldValue(`menuGroups.${groupIndex}.regularMenuUrl`, e.target.value);
                            // Luego actualizar el estado global
                            handleFieldChange(groupIndex, 'regularMenuUrl', e.target.value);
                          }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-start">
                        <div className="flex h-5 items-center">
                          <Field
                            type="checkbox"
                            name={`menuGroups.${groupIndex}.hasDietaryMenu`}
                            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                              // Primero actualizar el estado de Formik
                              setFieldValue(`menuGroups.${groupIndex}.hasDietaryMenu`, e.target.checked);
                              // Luego actualizar el estado global
                              handleFieldChange(groupIndex, 'hasDietaryMenu', e.target.checked);
                            }}
                          />
                        </div>
                        <div className="ml-3 text-sm">
                          <label htmlFor={`menuGroups.${groupIndex}.hasDietaryMenu`} className="font-medium text-gray-700">
                            ¿Tiene menú dietético?
                          </label>
                          <p className="text-gray-500">Indique si dispone de un menú especial para dietas específicas</p>
                        </div>
                      </div>

                      {values.menuGroups[groupIndex].hasDietaryMenu && (
                        <div className="mt-4 space-y-4">
                          <div>
                            <label htmlFor={`menuGroups.${groupIndex}.dietaryMenuUrl`} className="block text-sm font-medium text-gray-700">
                              URL del Menú Dietético
                            </label>
                            <div className="mt-2 flex rounded-md shadow-sm">
                              <span className="inline-flex items-center rounded-l-md border border-r-0 border-gray-300 bg-gray-50 px-3 text-gray-500 sm:text-sm">
                                <LinkIcon className="h-4 w-4" />
                              </span>
                              <Field
                                type="text"
                                name={`menuGroups.${groupIndex}.dietaryMenuUrl`}
                                className="block w-full flex-1 rounded-none rounded-r-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                placeholder="https://ejemplo.com/menu-dietetico"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                              Archivo del Menú Dietético (opcional)
                            </label>
                            <input
                              type="file"
                              onChange={(e) =>
                                handleFileChange(
                                  e,
                                  setFieldValue,
                                  `menuGroups.${groupIndex}.dietaryMenu`,
                                  groupIndex
                                )
                              }
                              className="mt-2 block w-full text-sm text-gray-500
                                file:mr-4 file:py-2 file:px-4
                                file:rounded-md file:border-0
                                file:text-sm file:font-medium
                                file:bg-indigo-50 file:text-indigo-700
                                hover:file:bg-indigo-100"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="flex items-start">
                        <div className="flex h-5 items-center">
                          <Field
                            type="checkbox"
                            name={`menuGroups.${groupIndex}.hasVeganMenu`}
                            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                              // Actualizar Formik
                              formikProps.handleChange(e);
                              // Actualizar el estado global directamente
                              handleFieldChange(groupIndex, 'hasVeganMenu', e.target.checked);
                            }}
                          />
                        </div>
                        <div className="ml-3 text-sm">
                          <label htmlFor={`menuGroups.${groupIndex}.hasVeganMenu`} className="font-medium text-gray-700">
                            ¿Tiene menú vegano?
                          </label>
                          <p className="text-gray-500">Indique si dispone de un menú específico para veganos</p>
                        </div>
                      </div>

                      {values.menuGroups[groupIndex].hasVeganMenu && (
                        <div className="mt-4 space-y-4">
                          <div>
                            <label htmlFor={`menuGroups.${groupIndex}.veganMenuUrl`} className="block text-sm font-medium text-gray-700">
                              URL del Menú Vegano
                            </label>
                            <div className="mt-2 flex rounded-md shadow-sm">
                              <span className="inline-flex items-center rounded-l-md border border-r-0 border-gray-300 bg-gray-50 px-3 text-gray-500 sm:text-sm">
                                <LinkIcon className="h-4 w-4" />
                              </span>
                              <Field
                                type="text"
                                name={`menuGroups.${groupIndex}.veganMenuUrl`}
                                className="block w-full flex-1 rounded-none rounded-r-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                placeholder="https://ejemplo.com/menu-vegano"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                              Archivo del Menú Vegano (opcional)
                            </label>
                            <input
                              type="file"
                              onChange={(e) =>
                                handleFileChange(
                                  e,
                                  setFieldValue,
                                  `menuGroups.${groupIndex}.veganMenu`,
                                  groupIndex
                                )
                              }
                              className="mt-2 block w-full text-sm text-gray-500
                                file:mr-4 file:py-2 file:px-4
                                file:rounded-md file:border-0
                                file:text-sm file:font-medium
                                file:bg-indigo-50 file:text-indigo-700
                                hover:file:bg-indigo-100"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Otros Menús
                      </label>
                      <p className="mt-1 text-sm text-gray-500">
                        Agregue enlaces a otros menús especiales (por ejemplo: menú de postres, menú de vinos)
                      </p>
                      <div className="mt-2 space-y-2">
                        {values.menuGroups[groupIndex].otherMenuUrls.map((_, urlIndex) => (
                          <div key={urlIndex} className="flex rounded-md shadow-sm">
                            <span className="inline-flex items-center rounded-l-md border border-r-0 border-gray-300 bg-gray-50 px-3 text-gray-500 sm:text-sm">
                              <LinkIcon className="h-4 w-4" />
                            </span>
                            <Field
                              type="text"
                              name={`menuGroups.${groupIndex}.otherMenuUrls.${urlIndex}`}
                              className="block w-full flex-1 rounded-none rounded-r-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                              placeholder="https://ejemplo.com/otro-menu"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const newUrls = [...values.menuGroups[groupIndex].otherMenuUrls];
                                newUrls.splice(urlIndex, 1);
                                setFieldValue(`menuGroups.${groupIndex}.otherMenuUrls`, newUrls);
                              }}
                              className="ml-2 inline-flex items-center rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                            >
                              <TrashIcon className="h-4 w-4 text-gray-500" />
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => {
                            const newUrls = [...values.menuGroups[groupIndex].otherMenuUrls, ''];
                            setFieldValue(`menuGroups.${groupIndex}.otherMenuUrls`, newUrls);
                          }}
                          className="mt-2 inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                        >
                          Agregar otro menú
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                      <div>
                        <label htmlFor={`menuGroups.${groupIndex}.sharedDishes`} className="block text-sm font-medium text-gray-700">
                          Platos Compartidos
                        </label>
                        <Field
                          as="textarea"
                          name={`menuGroups.${groupIndex}.sharedDishes`}
                          rows={3}
                          className="mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          placeholder="Liste los platos más populares para compartir"
                          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                            // Primero actualizar el estado de Formik
                            setFieldValue(`menuGroups.${groupIndex}.sharedDishes`, e.target.value);
                            // Luego actualizar el estado global
                            handleFieldChange(groupIndex, 'sharedDishes', e.target.value);
                          }}
                        />
                      </div>

                      <div>
                        <label htmlFor={`menuGroups.${groupIndex}.sharedDrinks`} className="block text-sm font-medium text-gray-700">
                          Bebidas Compartidas
                        </label>
                        <Field
                          as="textarea"
                          name={`menuGroups.${groupIndex}.sharedDrinks`}
                          rows={3}
                          className="mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          placeholder="Liste las bebidas más populares para compartir"
                          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                            // Actualizar Formik
                            formikProps.handleChange(e);
                            // Actualizar también el estado global directamente
                            handleFieldChange(groupIndex, 'sharedDrinks', e.target.value);
                          }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                      <div>
                        <label htmlFor={`menuGroups.${groupIndex}.popularAppetizers`} className="block text-sm font-medium text-gray-700">
                          Aperitivos Populares
                        </label>
                        <Field
                          as="textarea"
                          name={`menuGroups.${groupIndex}.popularAppetizers`}
                          rows={3}
                          className="mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          placeholder="Liste los aperitivos más populares"
                          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                            // Actualizar Formik
                            formikProps.handleChange(e);
                            // Actualizar también el estado global directamente
                            handleFieldChange(groupIndex, 'popularAppetizers', e.target.value);
                          }}
                        />
                      </div>

                      <div>
                        <label htmlFor={`menuGroups.${groupIndex}.popularMainCourses`} className="block text-sm font-medium text-gray-700">
                          Platos Principales Populares
                        </label>
                        <Field
                          as="textarea"
                          name={`menuGroups.${groupIndex}.popularMainCourses`}
                          rows={3}
                          className="mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          placeholder="Liste los platos principales más populares"
                          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                            // Actualizar Formik
                            formikProps.handleChange(e);
                            // Actualizar también el estado global directamente
                            handleFieldChange(groupIndex, 'popularMainCourses', e.target.value);
                          }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                      <div>
                        <label htmlFor={`menuGroups.${groupIndex}.popularDesserts`} className="block text-sm font-medium text-gray-700">
                          Postres Populares
                        </label>
                        <Field
                          as="textarea"
                          name={`menuGroups.${groupIndex}.popularDesserts`}
                          rows={3}
                          className="mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          placeholder="Liste los postres más populares"
                          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                            // Actualizar Formik
                            formikProps.handleChange(e);
                            // Actualizar también el estado global directamente
                            handleFieldChange(groupIndex, 'popularDesserts', e.target.value);
                          }}
                        />
                      </div>

                      <div>
                        <label htmlFor={`menuGroups.${groupIndex}.popularAlcoholicDrinks`} className="block text-sm font-medium text-gray-700">
                          Bebidas Alcohólicas Populares
                        </label>
                        <Field
                          as="textarea"
                          name={`menuGroups.${groupIndex}.popularAlcoholicDrinks`}
                          rows={3}
                          className="mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          placeholder="Liste las bebidas alcohólicas más populares"
                          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                            // Actualizar Formik
                            formikProps.handleChange(e);
                            // Actualizar también el estado global directamente
                            handleFieldChange(groupIndex, 'popularAlcoholicDrinks', e.target.value);
                          }}
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor={`menuGroups.${groupIndex}.popularNonAlcoholicDrinks`} className="block text-sm font-medium text-gray-700">
                        Bebidas No Alcohólicas Populares
                      </label>
                      <Field
                        as="textarea"
                        name={`menuGroups.${groupIndex}.popularNonAlcoholicDrinks`}
                        rows={3}
                        className="mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        placeholder="Liste las bebidas no alcohólicas más populares"
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                          // Actualizar Formik
                          formikProps.handleChange(e);
                          // Actualizar también el estado global directamente
                          handleFieldChange(groupIndex, 'popularNonAlcoholicDrinks', e.target.value);
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}

              <div className="flex justify-between pt-6">
                <button
                  type="button"
                  onClick={() => navigate('/onboarding/ai-config')}
                  className="btn-secondary"
                >
                  Atrás
                </button>
                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={() => {
                      console.log('⚡ Botón Guardar cambios presionado');
                      if (formikRef.current) {
                        console.log('📋 Valores obtenidos directamente de formikRef:', formikRef.current.values);
                        // Creamos una copia profunda para evitar problemas de referencia
                        const valuesCopy = JSON.parse(JSON.stringify(formikRef.current.values));
                        console.log('📋 Copia de valores para guardar:', valuesCopy);
                        
                        // Primero actualizamos el estado global
                        updateField('menuGroups', valuesCopy.menuGroups);
                        console.log('✅ Estado global actualizado con menuGroups:', valuesCopy.menuGroups);
                        
                        // Luego persistimos
                        saveFormData()
                          .then(success => {
                            console.log('📋 Resultado de saveFormData:', success);
                            if (success) {
                              console.log('✅ Guardado exitoso');
                              setHasUnsavedChanges(false);
                              setShowNotification(true);
                              setTimeout(() => setShowNotification(false), 3000);
                            } else {
                              console.error('❌ Error al guardar');
                              alert('Error al guardar los datos. Por favor intente nuevamente.');
                            }
                          })
                          .catch(err => {
                            console.error('❌ Error en saveFormData:', err);
                            alert('Error al guardar los datos. Por favor intente nuevamente.');
                          });
                      } else {
                        console.error('❌ No se pudo acceder a los valores del formulario');
                        alert('Error al acceder a los datos del formulario. Por favor intente nuevamente.');
                      }
                    }}
                    className={hasUnsavedChanges ? 'btn-unsaved' : 'btn-saved'}
                    disabled={!hasUnsavedChanges}
                  >
                    {hasUnsavedChanges ? 'Guardar cambios' : 'Cambios guardados'}
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                  >
                    Continuar
                  </button>
                </div>
              </div>
            </Form>
          )
        }}
      </Formik>
    </div>
  )
} 
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useFormProgress } from '../hooks/useFormProgress'
import { useTranslation } from '../hooks/useTranslation'
import { Formik, Form, Field, FormikProps } from 'formik'
import * as Yup from 'yup'
import { DocumentIcon, TrashIcon, LinkIcon } from '@heroicons/react/24/outline'
import FormActions from '../components/FormActions'
import { Notification } from '../components/Notification'

interface MenuGroup {
  name: string
  regularMenuUrl: string
  hasDietaryMenu: boolean
  dietaryMenu: File | null
  dietaryMenuUrl: string
  hasVeganMenu: boolean
  veganMenu: File | null
  veganMenuUrl: string
  otherMenus: File[]
  otherMenuUrls: string[]
  sharedDishes: string
  sharedDrinks: string
  popularAppetizers: string
  popularMainCourses: string
  popularDesserts: string
  popularAlcoholicDrinks: string
  popularNonAlcoholicDrinks: string
}

interface FormValues {
  menuGroups: MenuGroup[]
}

const validationSchema = Yup.object().shape({
  menuGroups: Yup.array().of(
    Yup.object().shape({
      name: Yup.string().required('El nombre del grupo es requerido'),
      regularMenuUrl: Yup.string().url('Debe ser una URL válida').required('La URL del menú regular es requerida'),
      hasDietaryMenu: Yup.boolean(),
      dietaryMenuUrl: Yup.string().url('Debe ser una URL válida').when('hasDietaryMenu', {
        is: true,
        then: () => Yup.string().required('La URL del menú dietético es requerida si tiene uno')
      }),
      hasVeganMenu: Yup.boolean(),
      veganMenuUrl: Yup.string().url('Debe ser una URL válida').when('hasVeganMenu', {
        is: true,
        then: () => Yup.string().required('La URL del menú vegano es requerida si tiene uno')
      }),
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
  const { formData, updateField, uploadFile } = useFormProgress()
  const [showNotification, setShowNotification] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  const initialValues: FormValues = {
    menuGroups: formData.menuGroups?.map(group => ({
      name: group.name || '',
      regularMenuUrl: group.regularMenuUrl || '',
      hasDietaryMenu: group.hasDietaryMenu || false,
      dietaryMenu: group.dietaryMenu || null,
      dietaryMenuUrl: group.dietaryMenuUrl || '',
      hasVeganMenu: group.hasVeganMenu || false,
      veganMenu: group.veganMenu || null,
      veganMenuUrl: group.veganMenuUrl || '',
      otherMenus: group.otherMenus || [],
      otherMenuUrls: group.otherMenuUrls || [],
      sharedDishes: group.sharedDishes || '',
      sharedDrinks: group.sharedDrinks || '',
      popularAppetizers: group.popularAppetizers || '',
      popularMainCourses: group.popularMainCourses || '',
      popularDesserts: group.popularDesserts || '',
      popularAlcoholicDrinks: group.popularAlcoholicDrinks || '',
      popularNonAlcoholicDrinks: group.popularNonAlcoholicDrinks || '',
    })) || [
      {
        name: '',
        regularMenuUrl: '',
        hasDietaryMenu: false,
        dietaryMenu: null,
        dietaryMenuUrl: '',
        hasVeganMenu: false,
        veganMenu: null,
        veganMenuUrl: '',
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

  const handleFieldChange = (groupIndex: number, field: string, value: any) => {
    setHasUnsavedChanges(true)
    const updatedGroups = [...(formData.menuGroups || [])]
    if (!updatedGroups[groupIndex]) {
      updatedGroups[groupIndex] = {
        name: '',
        regularMenuUrl: '',
        hasDietaryMenu: false,
        dietaryMenu: null,
        dietaryMenuUrl: '',
        hasVeganMenu: false,
        veganMenu: null,
        veganMenuUrl: '',
        otherMenus: [],
        otherMenuUrls: [],
        sharedDishes: '',
        sharedDrinks: '',
        popularAppetizers: '',
        popularMainCourses: '',
        popularDesserts: '',
        popularAlcoholicDrinks: '',
        popularNonAlcoholicDrinks: '',
      }
    }
    updatedGroups[groupIndex] = {
      ...updatedGroups[groupIndex],
      [field]: value,
    }
    updateField('menuGroups', updatedGroups)
  }

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
    setFieldValue: (field: string, value: any) => void,
    field: string,
    groupIndex: number
  ) => {
    const file = event.currentTarget.files?.[0]
    if (file) {
      setFieldValue(field, file)
      try {
        const fileUrl = await uploadFile(file, `menuGroups/${groupIndex}/${field}`)
        handleFieldChange(groupIndex, field, fileUrl)
      } catch (err) {
        console.error('Error uploading file:', err)
      }
    }
  }

  const handleSubmit = (values: FormValues) => {
    updateField('menuGroups', values.menuGroups)
    navigate('/onboarding/observations')
  }

  return (
    <div className="space-y-8">
      {showNotification && (
        <Notification
          message="Los cambios han sido guardados correctamente"
          onClose={() => setShowNotification(false)}
        />
      )}

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
      >
        {(formikProps: FormikProps<FormValues>) => {
          const { values, errors, touched, setFieldValue } = formikProps
          return (
            <Form className="space-y-8">
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
                      />
                    </div>
                  </div>
                </div>
              ))}

              <div className="flex justify-between pt-6">
                <button
                  type="button"
                  onClick={() => navigate('/onboarding/ai-config')}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2563eb] transition-all"
                >
                  Atrás
                </button>
                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={() => {
                      handleSubmit(values);
                      setShowNotification(true);
                    }}
                    className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2563eb] transition-all ${
                      hasUnsavedChanges
                        ? 'text-white bg-gradient-to-r from-[#2563eb] to-[#1d4ed8] hover:from-[#1d4ed8] hover:to-[#1e40af]'
                        : 'text-gray-400 bg-gray-100 cursor-not-allowed'
                    }`}
                    disabled={!hasUnsavedChanges}
                  >
                    {hasUnsavedChanges ? 'Guardar cambios' : 'Cambios guardados'}
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-[#2563eb] to-[#1d4ed8] rounded-md shadow-sm hover:from-[#1d4ed8] hover:to-[#1e40af] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2563eb] transition-all"
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
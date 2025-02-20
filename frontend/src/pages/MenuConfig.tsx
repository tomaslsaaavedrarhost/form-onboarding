import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Formik, Form, FormikProps, Field, FormikErrors } from 'formik'
import * as Yup from 'yup'
import { DocumentIcon, TrashIcon } from '@heroicons/react/24/outline'
import { useForm } from '../context/FormContext'

const validationSchema = Yup.object().shape({
  menuGroups: Yup.array().of(
    Yup.object().shape({
      name: Yup.string().required('Group name is required'),
      regularMenu: Yup.mixed().required('Regular menu file is required'),
      dietaryMenu: Yup.mixed(),
      veganMenu: Yup.mixed(),
      otherMenus: Yup.array().of(
        Yup.object().shape({
          file: Yup.mixed(),
          name: Yup.string()
        })
      ),
      sharedDishes: Yup.string().required('Please provide suggested shared dishes'),
      sharedDrinks: Yup.string().required('Please provide suggested shared drinks'),
      popularAppetizers: Yup.string().required('Please provide popular appetizers'),
      popularMainCourses: Yup.string().required('Please provide popular main courses'),
      popularDesserts: Yup.string().required('Please provide popular desserts'),
      popularAlcoholicDrinks: Yup.string().required('Please provide popular alcoholic drinks'),
      popularNonAlcoholicDrinks: Yup.string().required('Please provide popular non-alcoholic drinks'),
    })
  ).required('At least one menu group is required'),
})

interface MenuFile {
  file: File
  name: string
}

interface MenuGroup {
  name: string
  locations: string[]
  regularMenu: File | null
  dietaryMenu: File | null
  veganMenu: File | null
  otherMenus: MenuFile[]
  hasDietaryMenu: boolean
  hasVeganMenu: boolean
  hasOtherMenus: boolean
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

interface MenuGroupErrors {
  name?: string
  regularMenu?: string
  dietaryMenu?: string
  veganMenu?: string
  otherMenus?: Array<{
    file?: string
    name?: string
  }>
  sharedDishes?: string
  sharedDrinks?: string
  popularAppetizers?: string
  popularMainCourses?: string
  popularDesserts?: string
  popularAlcoholicDrinks?: string
  popularNonAlcoholicDrinks?: string
}

interface FormErrors {
  menuGroups?: MenuGroupErrors[]
}

// This would come from your global state
const mockMenuGroups = [
  {
    name: 'All Locations',
    locations: ['Downtown Location', 'Airport Branch'],
  },
  {
    name: 'Special Menu Group',
    locations: ['Premium Location'],
  },
]

export default function MenuConfig() {
  const navigate = useNavigate()
  const { state, dispatch } = useForm()

  const initialValues: FormValues = {
    menuGroups: state.menuGroups.map(group => ({
      ...group,
      regularMenu: state.menuFiles[group.name]?.regularMenu || null,
      dietaryMenu: state.menuFiles[group.name]?.dietaryMenu || null,
      veganMenu: state.menuFiles[group.name]?.veganMenu || null,
      otherMenus: state.menuFiles[group.name]?.otherMenus || [],
      hasDietaryMenu: state.menuFiles[group.name]?.hasDietaryMenu || false,
      hasVeganMenu: state.menuFiles[group.name]?.hasVeganMenu || false,
      hasOtherMenus: state.menuFiles[group.name]?.hasOtherMenus || false,
      sharedDishes: state.menuFiles[group.name]?.sharedDishes || '',
      sharedDrinks: state.menuFiles[group.name]?.sharedDrinks || '',
      popularAppetizers: state.menuFiles[group.name]?.popularAppetizers || '',
      popularMainCourses: state.menuFiles[group.name]?.popularMainCourses || '',
      popularDesserts: state.menuFiles[group.name]?.popularDesserts || '',
      popularAlcoholicDrinks: state.menuFiles[group.name]?.popularAlcoholicDrinks || '',
      popularNonAlcoholicDrinks: state.menuFiles[group.name]?.popularNonAlcoholicDrinks || '',
    })),
  }

  const handleSubmit = (values: FormValues) => {
    values.menuGroups.forEach(group => {
      dispatch({
        type: 'SET_MENU_FILES',
        payload: {
          groupId: group.name,
          files: {
            regularMenu: group.regularMenu,
            dietaryMenu: group.dietaryMenu,
            veganMenu: group.veganMenu,
            otherMenus: group.otherMenus,
            hasDietaryMenu: group.hasDietaryMenu,
            hasVeganMenu: group.hasVeganMenu,
            hasOtherMenus: group.hasOtherMenus,
            sharedDishes: group.sharedDishes,
            sharedDrinks: group.sharedDrinks,
            popularAppetizers: group.popularAppetizers,
            popularMainCourses: group.popularMainCourses,
            popularDesserts: group.popularDesserts,
            popularAlcoholicDrinks: group.popularAlcoholicDrinks,
            popularNonAlcoholicDrinks: group.popularNonAlcoholicDrinks,
          },
        },
      })
    })
    
    navigate('/onboarding/tips-policy')
  }

  const handleFieldChange = (groupIndex: number, field: string, value: any) => {
    const currentGroup = state.menuGroups[groupIndex]
    const currentFiles = state.menuFiles[currentGroup.name] || {}

    dispatch({
      type: 'SET_MENU_FILES',
      payload: {
        groupId: currentGroup.name,
        files: {
          ...currentFiles,
          regularMenu: field === 'regularMenu' ? value : currentFiles.regularMenu,
          dietaryMenu: field === 'dietaryMenu' ? value : currentFiles.dietaryMenu,
          veganMenu: field === 'veganMenu' ? value : currentFiles.veganMenu,
          otherMenus: field === 'otherMenus' ? value : currentFiles.otherMenus || [],
          sharedDishes: field === 'sharedDishes' ? value : currentFiles.sharedDishes || '',
          sharedDrinks: field === 'sharedDrinks' ? value : currentFiles.sharedDrinks || '',
          popularAppetizers: field === 'popularAppetizers' ? value : currentFiles.popularAppetizers || '',
          popularMainCourses: field === 'popularMainCourses' ? value : currentFiles.popularMainCourses || '',
          popularDesserts: field === 'popularDesserts' ? value : currentFiles.popularDesserts || '',
          popularAlcoholicDrinks: field === 'popularAlcoholicDrinks' ? value : currentFiles.popularAlcoholicDrinks || '',
          popularNonAlcoholicDrinks: field === 'popularNonAlcoholicDrinks' ? value : currentFiles.popularNonAlcoholicDrinks || '',
        },
      },
    })
  }

  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    setFieldValue: (field: string, value: any) => void,
    field: string,
    groupIndex: number
  ) => {
    const file = event.currentTarget.files?.[0]
    if (file) {
      setFieldValue(field, file)
      const fieldName = field.split('.').pop() || ''
      handleFieldChange(groupIndex, fieldName, file)
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">Menu Configuration</h2>
        <p className="mt-2 text-sm text-gray-600">
          Configure your menu information and upload menu files for each location group.
        </p>
      </div>

      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
        enableReinitialize
      >
        {(formikProps: FormikProps<FormValues>) => {
          const { values, errors, touched, setFieldValue } = formikProps
          return (
            <Form className="space-y-6">
              {values.menuGroups.map((group, groupIndex) => (
                <div
                  key={groupIndex}
                  className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
                >
                  <div className="mb-6">
                    <h3 className="text-xl font-semibold bg-gradient-brand bg-clip-text text-transparent">
                      {group.name}
                    </h3>
                    <p className="mt-2 text-sm">
                      <span className="font-medium text-brand-purple">Locations: </span>
                      <span className="text-gray-600">
                        {state.menuGroups[groupIndex]?.locations
                          .map(locId => state.locations.find(l => l.id === locId)?.name)
                          .filter(Boolean)
                          .join(', ')}
                      </span>
                    </p>
                  </div>

                  <div className="space-y-6">
                    {/* Menu Information Section */}
                    <div className="space-y-6">
                      <h4 className="text-lg font-medium bg-gradient-brand-reverse bg-clip-text text-transparent">
                        Menu Information
                      </h4>
                      
                      <div>
                        <label htmlFor={`menuGroups.${groupIndex}.sharedDishes`} className="form-label">
                          Suggested Shared Dishes (Priority Order)<span className="text-red-500">*</span>
                        </label>
                        <Field
                          as="textarea"
                          name={`menuGroups.${groupIndex}.sharedDishes`}
                          id={`menuGroups.${groupIndex}.sharedDishes`}
                          rows={4}
                          className="input-field mt-2"
                          placeholder="List appetizers, main courses, and desserts recommended for sharing..."
                          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                            const value = e.target.value;
                            setFieldValue(`menuGroups.${groupIndex}.sharedDishes`, value);
                            handleFieldChange(groupIndex, 'sharedDishes', value);
                          }}
                          value={values.menuGroups[groupIndex].sharedDishes}
                        />
                        {errors.menuGroups?.[groupIndex] && 
                         touched.menuGroups?.[groupIndex]?.sharedDishes && (
                          <div className="error-message">
                            {(errors.menuGroups[groupIndex] as MenuGroupErrors).sharedDishes}
                          </div>
                        )}
                      </div>

                      <div>
                        <label htmlFor={`menuGroups.${groupIndex}.sharedDrinks`} className="form-label">
                          Suggested Shared Drinks (Priority Order)<span className="text-red-500">*</span>
                        </label>
                        <Field
                          as="textarea"
                          name={`menuGroups.${groupIndex}.sharedDrinks`}
                          id={`menuGroups.${groupIndex}.sharedDrinks`}
                          rows={4}
                          className="input-field mt-2"
                          placeholder="List drinks recommended for sharing, specifying the number of people..."
                          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                            const value = e.target.value;
                            setFieldValue(`menuGroups.${groupIndex}.sharedDrinks`, value);
                            handleFieldChange(groupIndex, 'sharedDrinks', value);
                          }}
                          value={values.menuGroups[groupIndex].sharedDrinks}
                        />
                        {errors.menuGroups?.[groupIndex] && 
                         touched.menuGroups?.[groupIndex]?.sharedDrinks && (
                          <div className="error-message">
                            {(errors.menuGroups[groupIndex] as MenuGroupErrors).sharedDrinks}
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label htmlFor={`menuGroups.${groupIndex}.popularAppetizers`} className="form-label">
                            Most Popular Appetizers<span className="text-red-500">*</span>
                          </label>
                          <Field
                            as="textarea"
                            name={`menuGroups.${groupIndex}.popularAppetizers`}
                            id={`menuGroups.${groupIndex}.popularAppetizers`}
                            rows={4}
                            className="input-field mt-2"
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                              const value = e.target.value;
                              setFieldValue(`menuGroups.${groupIndex}.popularAppetizers`, value);
                              handleFieldChange(groupIndex, 'popularAppetizers', value);
                            }}
                            value={values.menuGroups[groupIndex].popularAppetizers}
                          />
                          {errors.menuGroups?.[groupIndex] && 
                           touched.menuGroups?.[groupIndex]?.popularAppetizers && (
                            <div className="error-message">
                              {(errors.menuGroups[groupIndex] as MenuGroupErrors).popularAppetizers}
                            </div>
                          )}
                        </div>

                        <div>
                          <label htmlFor={`menuGroups.${groupIndex}.popularMainCourses`} className="form-label">
                            Most Popular Main Courses<span className="text-red-500">*</span>
                          </label>
                          <Field
                            as="textarea"
                            name={`menuGroups.${groupIndex}.popularMainCourses`}
                            id={`menuGroups.${groupIndex}.popularMainCourses`}
                            rows={4}
                            className="input-field mt-2"
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                              const value = e.target.value;
                              setFieldValue(`menuGroups.${groupIndex}.popularMainCourses`, value);
                              handleFieldChange(groupIndex, 'popularMainCourses', value);
                            }}
                            value={values.menuGroups[groupIndex].popularMainCourses}
                          />
                          {errors.menuGroups?.[groupIndex] && 
                           touched.menuGroups?.[groupIndex]?.popularMainCourses && (
                            <div className="error-message">
                              {(errors.menuGroups[groupIndex] as MenuGroupErrors).popularMainCourses}
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        <label htmlFor={`menuGroups.${groupIndex}.popularDesserts`} className="form-label">
                          Most Popular Desserts<span className="text-red-500">*</span>
                        </label>
                        <Field
                          as="textarea"
                          name={`menuGroups.${groupIndex}.popularDesserts`}
                          id={`menuGroups.${groupIndex}.popularDesserts`}
                          rows={4}
                          className="input-field mt-2"
                          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                            setFieldValue(`menuGroups.${groupIndex}.popularDesserts`, e.target.value)
                            handleFieldChange(groupIndex, 'popularDesserts', e.target.value)
                          }}
                        />
                        {errors.menuGroups?.[groupIndex] && 
                         touched.menuGroups?.[groupIndex]?.popularDesserts && (
                          <div className="error-message">
                            {(errors.menuGroups[groupIndex] as MenuGroupErrors).popularDesserts}
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label htmlFor={`menuGroups.${groupIndex}.popularAlcoholicDrinks`} className="form-label">
                            Most Popular Alcoholic Drinks<span className="text-red-500">*</span>
                          </label>
                          <Field
                            as="textarea"
                            name={`menuGroups.${groupIndex}.popularAlcoholicDrinks`}
                            id={`menuGroups.${groupIndex}.popularAlcoholicDrinks`}
                            rows={4}
                            className="input-field mt-2"
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                              setFieldValue(`menuGroups.${groupIndex}.popularAlcoholicDrinks`, e.target.value)
                              handleFieldChange(groupIndex, 'popularAlcoholicDrinks', e.target.value)
                            }}
                          />
                          {errors.menuGroups?.[groupIndex] && 
                           touched.menuGroups?.[groupIndex]?.popularAlcoholicDrinks && (
                            <div className="error-message">
                              {(errors.menuGroups[groupIndex] as MenuGroupErrors).popularAlcoholicDrinks}
                            </div>
                          )}
                        </div>

                        <div>
                          <label htmlFor={`menuGroups.${groupIndex}.popularNonAlcoholicDrinks`} className="form-label">
                            Most Popular Non-Alcoholic Drinks<span className="text-red-500">*</span>
                          </label>
                          <Field
                            as="textarea"
                            name={`menuGroups.${groupIndex}.popularNonAlcoholicDrinks`}
                            id={`menuGroups.${groupIndex}.popularNonAlcoholicDrinks`}
                            rows={4}
                            className="input-field mt-2"
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                              setFieldValue(`menuGroups.${groupIndex}.popularNonAlcoholicDrinks`, e.target.value)
                              handleFieldChange(groupIndex, 'popularNonAlcoholicDrinks', e.target.value)
                            }}
                          />
                          {errors.menuGroups?.[groupIndex] && 
                           touched.menuGroups?.[groupIndex]?.popularNonAlcoholicDrinks && (
                            <div className="error-message">
                              {(errors.menuGroups[groupIndex] as MenuGroupErrors).popularNonAlcoholicDrinks}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Menu Files Section */}
                    <div className="space-y-6">
                      <h4 className="text-md font-medium text-gray-900">Menu Files</h4>

                      {/* Regular Menu */}
                      <div>
                        <label className="form-label">Regular Menu (Required)</label>
                        <div className="mt-2">
                          <input
                            type="file"
                            onChange={(e) =>
                              handleFileChange(
                                e,
                                setFieldValue,
                                `menuGroups.${groupIndex}.regularMenu`,
                                groupIndex
                              )
                            }
                            accept=".jpg,.jpeg,.png"
                            className="block w-full text-sm text-gray-500
                              file:mr-4 file:py-2 file:px-4
                              file:rounded-md file:border-0
                              file:text-sm file:font-semibold
                              file:bg-primary-50 file:text-primary-700
                              hover:file:bg-primary-100"
                          />
                        </div>
                        {errors.menuGroups?.[groupIndex] && 
                         touched.menuGroups?.[groupIndex]?.regularMenu && (
                          <div className="error-message">
                            {(errors.menuGroups[groupIndex] as MenuGroupErrors).regularMenu}
                          </div>
                        )}
                        {group.regularMenu && (
                          <div className="mt-2 flex items-center text-sm text-gray-500">
                            <DocumentIcon className="mr-2 h-5 w-5" />
                            {group.regularMenu.name}
                          </div>
                        )}
                      </div>

                      {/* Dietary Menu */}
                      <div className="space-y-4">
                        <div className="flex items-center">
                          <Field
                            type="checkbox"
                            name={`menuGroups.${groupIndex}.hasDietaryMenu`}
                            id={`menuGroups.${groupIndex}.hasDietaryMenu`}
                            className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-600"
                          />
                          <label htmlFor={`menuGroups.${groupIndex}.hasDietaryMenu`} className="ml-2 block text-sm text-gray-900">
                            This location has a Dietary Restrictions Menu
                          </label>
                        </div>
                        
                        {values.menuGroups[groupIndex].hasDietaryMenu && (
                          <div>
                            <label className="form-label">Dietary Restrictions Menu</label>
                            <div className="mt-2">
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
                                accept=".jpg,.jpeg,.png"
                                className="block w-full text-sm text-gray-500
                                  file:mr-4 file:py-2 file:px-4
                                  file:rounded-md file:border-0
                                  file:text-sm file:font-semibold
                                  file:bg-primary-50 file:text-primary-700
                                  hover:file:bg-primary-100"
                                required
                              />
                            </div>
                            {group.dietaryMenu && (
                              <div className="mt-2 flex items-center text-sm text-gray-500">
                                <DocumentIcon className="mr-2 h-5 w-5" />
                                {group.dietaryMenu.name}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Vegan Menu */}
                      <div className="space-y-4">
                        <div className="flex items-center">
                          <Field
                            type="checkbox"
                            name={`menuGroups.${groupIndex}.hasVeganMenu`}
                            id={`menuGroups.${groupIndex}.hasVeganMenu`}
                            className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-600"
                          />
                          <label htmlFor={`menuGroups.${groupIndex}.hasVeganMenu`} className="ml-2 block text-sm text-gray-900">
                            This location has a Vegan Menu
                          </label>
                        </div>
                        
                        {values.menuGroups[groupIndex].hasVeganMenu && (
                          <div>
                            <label className="form-label">Vegan Menu</label>
                            <div className="mt-2">
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
                                accept=".jpg,.jpeg,.png"
                                className="block w-full text-sm text-gray-500
                                  file:mr-4 file:py-2 file:px-4
                                  file:rounded-md file:border-0
                                  file:text-sm file:font-semibold
                                  file:bg-primary-50 file:text-primary-700
                                  hover:file:bg-primary-100"
                                required
                              />
                            </div>
                            {group.veganMenu && (
                              <div className="mt-2 flex items-center text-sm text-gray-500">
                                <DocumentIcon className="mr-2 h-5 w-5" />
                                {group.veganMenu.name}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Other Menus */}
                      <div className="space-y-4">
                        <div className="flex items-center">
                          <Field
                            type="checkbox"
                            name={`menuGroups.${groupIndex}.hasOtherMenus`}
                            id={`menuGroups.${groupIndex}.hasOtherMenus`}
                            className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-600"
                          />
                          <label htmlFor={`menuGroups.${groupIndex}.hasOtherMenus`} className="ml-2 block text-sm text-gray-900">
                            Add additional menu types
                          </label>
                        </div>
                        
                        {values.menuGroups[groupIndex].hasOtherMenus && (
                          <div>
                            <label className="form-label">Additional Menus</label>
                            <div className="mt-2 space-y-4">
                              {group.otherMenus.map((menu, menuIndex) => (
                                <div key={menuIndex} className="flex items-center justify-between">
                                  <div className="flex items-center text-sm text-gray-500">
                                    <DocumentIcon className="mr-2 h-5 w-5" />
                                    {menu.name}
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const newOtherMenus = group.otherMenus.filter(
                                        (_, index) => index !== menuIndex
                                      )
                                      setFieldValue(
                                        `menuGroups.${groupIndex}.otherMenus`,
                                        newOtherMenus
                                      )
                                    }}
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    <TrashIcon className="h-5 w-5" />
                                  </button>
                                </div>
                              ))}
                              <input
                                type="file"
                                onChange={(e) => {
                                  const file = e.currentTarget.files?.[0]
                                  if (file) {
                                    const newMenu = {
                                      file,
                                      name: file.name,
                                    }
                                    setFieldValue(
                                      `menuGroups.${groupIndex}.otherMenus`,
                                      [...group.otherMenus, newMenu]
                                    )
                                  }
                                }}
                                accept=".jpg,.jpeg,.png"
                                className="block w-full text-sm text-gray-500
                                  file:mr-4 file:py-2 file:px-4
                                  file:rounded-md file:border-0
                                  file:text-sm file:font-semibold
                                  file:bg-primary-50 file:text-primary-700
                                  hover:file:bg-primary-100"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={() => navigate('/onboarding/ai-config')}
                  className="btn-secondary"
                >
                  Back
                </button>
                <button type="submit" className="btn-primary">
                  Continue
                </button>
              </div>
            </Form>
          )
        }}
      </Formik>
    </div>
  )
} 
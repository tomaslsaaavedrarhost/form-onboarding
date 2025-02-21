import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useFormProgress } from '../hooks/useFormProgress'
import { useTranslation } from '../hooks/useTranslation'
import { Formik, Form, Field, FormikProps } from 'formik'
import * as Yup from 'yup'
import { DocumentIcon, TrashIcon } from '@heroicons/react/24/outline'

interface MenuGroup {
  name: string
  regularMenu: File | null
  dietaryMenu: File | null
  veganMenu: File | null
  otherMenus: File[]
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
  otherMenus?: string[]
  sharedDishes?: string
  sharedDrinks?: string
  popularAppetizers?: string
  popularMainCourses?: string
  popularDesserts?: string
  popularAlcoholicDrinks?: string
  popularNonAlcoholicDrinks?: string
}

const validationSchema = Yup.object().shape({
  menuGroups: Yup.array().of(
    Yup.object().shape({
      name: Yup.string().required('Required'),
      regularMenu: Yup.mixed().required('Required'),
      dietaryMenu: Yup.mixed(),
      veganMenu: Yup.mixed(),
      otherMenus: Yup.array(),
      sharedDishes: Yup.string().required('Required'),
      sharedDrinks: Yup.string().required('Required'),
      popularAppetizers: Yup.string().required('Required'),
      popularMainCourses: Yup.string().required('Required'),
      popularDesserts: Yup.string().required('Required'),
      popularAlcoholicDrinks: Yup.string().required('Required'),
      popularNonAlcoholicDrinks: Yup.string().required('Required'),
    })
  ),
})

export default function MenuConfig() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { formData, updateField, uploadFile } = useFormProgress()

  const initialValues: FormValues = {
    menuGroups: formData.menuGroups || [
      {
        name: '',
        regularMenu: null,
        dietaryMenu: null,
        veganMenu: null,
        otherMenus: [],
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
    const updatedGroups = [...(formData.menuGroups || [])]
    if (!updatedGroups[groupIndex]) {
      updatedGroups[groupIndex] = {
        name: '',
        regularMenu: null,
        dietaryMenu: null,
        veganMenu: null,
        otherMenus: [],
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
    <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-8">{t('menuConfiguration')}</h2>
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
                  className="bg-white rounded-lg border border-gray-200 p-6 space-y-6"
                >
                  <h3 className="text-lg font-medium text-gray-900">
                    {t('menuGroup')} {groupIndex + 1}
                  </h3>

                  <div>
                    <label htmlFor={`menuGroups.${groupIndex}.name`} className="form-label">
                      {t('groupName')}
                    </label>
                    <Field
                      type="text"
                      name={`menuGroups.${groupIndex}.name`}
                      id={`menuGroups.${groupIndex}.name`}
                      className="input-field mt-2"
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        const value = e.target.value
                        setFieldValue(`menuGroups.${groupIndex}.name`, value)
                        handleFieldChange(groupIndex, 'name', value)
                      }}
                    />
                    {errors.menuGroups?.[groupIndex]?.name &&
                      touched.menuGroups?.[groupIndex]?.name && (
                        <div className="error-message">
                          {(errors.menuGroups[groupIndex] as MenuGroupErrors).name}
                        </div>
                      )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor={`menuGroups.${groupIndex}.regularMenu`} className="form-label">
                        {t('regularMenu')}
                      </label>
                      <input
                        type="file"
                        id={`menuGroups.${groupIndex}.regularMenu`}
                        className="input-field mt-2"
                        onChange={(e) =>
                          handleFileChange(
                            e,
                            setFieldValue,
                            `menuGroups.${groupIndex}.regularMenu`,
                            groupIndex
                          )
                        }
                      />
                      {errors.menuGroups?.[groupIndex]?.regularMenu &&
                        touched.menuGroups?.[groupIndex]?.regularMenu && (
                          <div className="error-message">
                            {(errors.menuGroups[groupIndex] as MenuGroupErrors).regularMenu}
                          </div>
                        )}
                    </div>

                    <div>
                      <label htmlFor={`menuGroups.${groupIndex}.dietaryMenu`} className="form-label">
                        {t('dietaryMenu')}
                      </label>
                      <input
                        type="file"
                        id={`menuGroups.${groupIndex}.dietaryMenu`}
                        className="input-field mt-2"
                        onChange={(e) =>
                          handleFileChange(
                            e,
                            setFieldValue,
                            `menuGroups.${groupIndex}.dietaryMenu`,
                            groupIndex
                          )
                        }
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor={`menuGroups.${groupIndex}.veganMenu`} className="form-label">
                        {t('veganMenu')}
                      </label>
                      <input
                        type="file"
                        id={`menuGroups.${groupIndex}.veganMenu`}
                        className="input-field mt-2"
                        onChange={(e) =>
                          handleFileChange(
                            e,
                            setFieldValue,
                            `menuGroups.${groupIndex}.veganMenu`,
                            groupIndex
                          )
                        }
                      />
                    </div>

                    <div>
                      <label htmlFor={`menuGroups.${groupIndex}.otherMenus`} className="form-label">
                        {t('otherMenus')}
                      </label>
                      <input
                        type="file"
                        multiple
                        id={`menuGroups.${groupIndex}.otherMenus`}
                        className="input-field mt-2"
                        onChange={(e) =>
                          handleFileChange(
                            e,
                            setFieldValue,
                            `menuGroups.${groupIndex}.otherMenus`,
                            groupIndex
                          )
                        }
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor={`menuGroups.${groupIndex}.sharedDishes`} className="form-label">
                        {t('sharedDishes')}
                      </label>
                      <Field
                        as="textarea"
                        name={`menuGroups.${groupIndex}.sharedDishes`}
                        id={`menuGroups.${groupIndex}.sharedDishes`}
                        rows={4}
                        className="input-field mt-2"
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                          const value = e.target.value
                          setFieldValue(`menuGroups.${groupIndex}.sharedDishes`, value)
                          handleFieldChange(groupIndex, 'sharedDishes', value)
                        }}
                      />
                      {errors.menuGroups?.[groupIndex]?.sharedDishes &&
                        touched.menuGroups?.[groupIndex]?.sharedDishes && (
                          <div className="error-message">
                            {(errors.menuGroups[groupIndex] as MenuGroupErrors).sharedDishes}
                          </div>
                        )}
                    </div>

                    <div>
                      <label htmlFor={`menuGroups.${groupIndex}.sharedDrinks`} className="form-label">
                        {t('sharedDrinks')}
                      </label>
                      <Field
                        as="textarea"
                        name={`menuGroups.${groupIndex}.sharedDrinks`}
                        id={`menuGroups.${groupIndex}.sharedDrinks`}
                        rows={4}
                        className="input-field mt-2"
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                          const value = e.target.value
                          setFieldValue(`menuGroups.${groupIndex}.sharedDrinks`, value)
                          handleFieldChange(groupIndex, 'sharedDrinks', value)
                        }}
                      />
                      {errors.menuGroups?.[groupIndex]?.sharedDrinks &&
                        touched.menuGroups?.[groupIndex]?.sharedDrinks && (
                          <div className="error-message">
                            {(errors.menuGroups[groupIndex] as MenuGroupErrors).sharedDrinks}
                          </div>
                        )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label
                        htmlFor={`menuGroups.${groupIndex}.popularAppetizers`}
                        className="form-label"
                      >
                        {t('popularAppetizers')}
                      </label>
                      <Field
                        as="textarea"
                        name={`menuGroups.${groupIndex}.popularAppetizers`}
                        id={`menuGroups.${groupIndex}.popularAppetizers`}
                        rows={4}
                        className="input-field mt-2"
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                          const value = e.target.value
                          setFieldValue(`menuGroups.${groupIndex}.popularAppetizers`, value)
                          handleFieldChange(groupIndex, 'popularAppetizers', value)
                        }}
                      />
                      {errors.menuGroups?.[groupIndex]?.popularAppetizers &&
                        touched.menuGroups?.[groupIndex]?.popularAppetizers && (
                          <div className="error-message">
                            {(errors.menuGroups[groupIndex] as MenuGroupErrors).popularAppetizers}
                          </div>
                        )}
                    </div>

                    <div>
                      <label
                        htmlFor={`menuGroups.${groupIndex}.popularMainCourses`}
                        className="form-label"
                      >
                        {t('popularMainCourses')}
                      </label>
                      <Field
                        as="textarea"
                        name={`menuGroups.${groupIndex}.popularMainCourses`}
                        id={`menuGroups.${groupIndex}.popularMainCourses`}
                        rows={4}
                        className="input-field mt-2"
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                          const value = e.target.value
                          setFieldValue(`menuGroups.${groupIndex}.popularMainCourses`, value)
                          handleFieldChange(groupIndex, 'popularMainCourses', value)
                        }}
                      />
                      {errors.menuGroups?.[groupIndex]?.popularMainCourses &&
                        touched.menuGroups?.[groupIndex]?.popularMainCourses && (
                          <div className="error-message">
                            {(errors.menuGroups[groupIndex] as MenuGroupErrors).popularMainCourses}
                          </div>
                        )}
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor={`menuGroups.${groupIndex}.popularDesserts`}
                      className="form-label"
                    >
                      {t('popularDesserts')}
                    </label>
                    <Field
                      as="textarea"
                      name={`menuGroups.${groupIndex}.popularDesserts`}
                      id={`menuGroups.${groupIndex}.popularDesserts`}
                      rows={4}
                      className="input-field mt-2"
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                        const value = e.target.value
                        setFieldValue(`menuGroups.${groupIndex}.popularDesserts`, value)
                        handleFieldChange(groupIndex, 'popularDesserts', value)
                      }}
                    />
                    {errors.menuGroups?.[groupIndex]?.popularDesserts &&
                      touched.menuGroups?.[groupIndex]?.popularDesserts && (
                        <div className="error-message">
                          {(errors.menuGroups[groupIndex] as MenuGroupErrors).popularDesserts}
                        </div>
                      )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label
                        htmlFor={`menuGroups.${groupIndex}.popularAlcoholicDrinks`}
                        className="form-label"
                      >
                        {t('popularAlcoholicDrinks')}
                      </label>
                      <Field
                        as="textarea"
                        name={`menuGroups.${groupIndex}.popularAlcoholicDrinks`}
                        id={`menuGroups.${groupIndex}.popularAlcoholicDrinks`}
                        rows={4}
                        className="input-field mt-2"
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                          const value = e.target.value
                          setFieldValue(`menuGroups.${groupIndex}.popularAlcoholicDrinks`, value)
                          handleFieldChange(groupIndex, 'popularAlcoholicDrinks', value)
                        }}
                      />
                      {errors.menuGroups?.[groupIndex]?.popularAlcoholicDrinks &&
                        touched.menuGroups?.[groupIndex]?.popularAlcoholicDrinks && (
                          <div className="error-message">
                            {(errors.menuGroups[groupIndex] as MenuGroupErrors).popularAlcoholicDrinks}
                          </div>
                        )}
                    </div>

                    <div>
                      <label
                        htmlFor={`menuGroups.${groupIndex}.popularNonAlcoholicDrinks`}
                        className="form-label"
                      >
                        {t('popularNonAlcoholicDrinks')}
                      </label>
                      <Field
                        as="textarea"
                        name={`menuGroups.${groupIndex}.popularNonAlcoholicDrinks`}
                        id={`menuGroups.${groupIndex}.popularNonAlcoholicDrinks`}
                        rows={4}
                        className="input-field mt-2"
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                          const value = e.target.value
                          setFieldValue(`menuGroups.${groupIndex}.popularNonAlcoholicDrinks`, value)
                          handleFieldChange(groupIndex, 'popularNonAlcoholicDrinks', value)
                        }}
                      />
                      {errors.menuGroups?.[groupIndex]?.popularNonAlcoholicDrinks &&
                        touched.menuGroups?.[groupIndex]?.popularNonAlcoholicDrinks && (
                          <div className="error-message">
                            {
                              (errors.menuGroups[groupIndex] as MenuGroupErrors)
                                .popularNonAlcoholicDrinks
                            }
                          </div>
                        )}
                    </div>
                  </div>
                </div>
              ))}

              <div className="flex justify-end space-x-4">
                <button type="button" onClick={() => navigate(-1)} className="btn-secondary">
                  {t('back')}
                </button>
                <button type="submit" className="btn-primary">
                  {t('continue')}
                </button>
              </div>
            </Form>
          )
        }}
      </Formik>
    </div>
  )
} 
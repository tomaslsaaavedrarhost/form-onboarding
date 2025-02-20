import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Formik, Form, Field } from 'formik'
import * as Yup from 'yup'
import { useForm } from '../context/FormContext'
import { useTranslation } from '../hooks/useTranslation'

const createValidationSchema = (t: (key: string) => string) => Yup.object().shape({
  legalBusinessName: Yup.string()
    .required(t('fieldRequired'))
    .min(2, t('nameTooShort')),
  restaurantType: Yup.string()
    .required(t('fieldRequired')),
  otherRestaurantType: Yup.string().when('restaurantType', {
    is: 'other',
    then: () => Yup.string().required(t('fieldRequired')),
    otherwise: () => Yup.string(),
  }),
  taxId: Yup.string()
    .required(t('fieldRequired')),
  irsLetter: Yup.mixed()
    .required(t('fieldRequired')),
  locationCount: Yup.number()
    .required(t('fieldRequired'))
    .min(1, t('fieldRequired'))
    .max(50, t('invalidInput')),
  sameMenuForAll: Yup.boolean()
    .required(t('fieldRequired')),
  locations: Yup.array().of(
    Yup.object().shape({
      name: Yup.string().required(t('fieldRequired')),
      nameConfirmed: Yup.boolean()
        .oneOf([true], t('nameConfirmationRequired'))
        .required(t('nameConfirmationRequired'))
    })
  ),
  groups: Yup.array().when('sameMenuForAll', {
    is: false,
    then: () => Yup.array().of(
      Yup.object().shape({
        id: Yup.string().required(),
        name: Yup.string().required(),
        locations: Yup.array().of(Yup.string()).min(1, t('groupMinLocations'))
      })
    ).min(1, t('groupsRequired')),
    otherwise: () => Yup.array()
  })
})

interface Location {
  name: string
  nameConfirmed: boolean
  groupId?: string
}

interface Group {
  id: string
  name: string
  locations: string[]
}

interface MenuGroup {
  name: string
  locations: string[]
}

interface FormValues {
  legalBusinessName: string
  restaurantType: string
  otherRestaurantType: string
  taxId: string
  irsLetter: File | null
  locationCount: number
  sameMenuForAll: boolean
  locations: Location[]
  groups: Group[]
}

const restaurantTypes = [
  { value: 'sports_bar', label: 'Sports Bar' },
  { value: 'fine_dining', label: 'Fine Dining' },
  { value: 'casual_dining', label: 'Casual Dining' },
  { value: 'fast_casual', label: 'Fast Casual' },
  { value: 'bistro', label: 'Bistro' },
  { value: 'steakhouse', label: 'Steakhouse' },
  { value: 'seafood', label: 'Seafood Restaurant' },
  { value: 'italian', label: 'Italian Restaurant' },
  { value: 'asian_fusion', label: 'Asian Fusion' },
  { value: 'pub', label: 'Pub & Brewery' },
  { value: 'other', label: 'Other' },
]

export default function LegalData() {
  const navigate = useNavigate()
  const { state, dispatch } = useForm()
  const [showLocationInputs, setShowLocationInputs] = React.useState(false)
  const { t } = useTranslation()

  const validationSchema = createValidationSchema(t)

  const initialValues: FormValues = {
    legalBusinessName: state.legalData?.legalBusinessName || '',
    restaurantType: state.legalData?.restaurantType || '',
    otherRestaurantType: state.legalData?.otherRestaurantType || '',
    taxId: state.legalData?.taxId || '',
    irsLetter: null,
    locationCount: state.locations.length || 1,
    sameMenuForAll: false,
    locations: state.locations.length > 0 
      ? state.locations.map(loc => ({
          name: loc.name,
          nameConfirmed: true,
          groupId: state.menuGroups.find(g => g.locations.includes(loc.id))?.name
        }))
      : [{ name: '', nameConfirmed: false, groupId: '' }],
    groups: state.menuGroups.length > 0
      ? state.menuGroups.map((group, index) => ({
          id: String(index + 1),
          name: group.name,
          locations: group.locations
        }))
      : [
          { id: '1', name: t('group') + ' 1', locations: [] },
          { id: '2', name: t('group') + ' 2', locations: [] }
        ],
  }

  const handleSubmit = (values: FormValues) => {
    const locations = values.locations.map((location, index) => ({
      id: String(index + 1),
      name: location.name,
      nameConfirmed: location.nameConfirmed,
    }))

    let menuGroups: MenuGroup[] = []
    if (locations.length === 1) {
      menuGroups = [{
        name: 'All Locations',
        locations: locations.map(loc => loc.id)
      }]
    } else if (!values.sameMenuForAll) {
      menuGroups = values.groups.map(group => ({
        name: group.name,
        locations: group.locations
      }))
    } else {
      menuGroups = [{
        name: 'All Locations',
        locations: locations.map(loc => loc.id)
      }]
    }

    dispatch({ 
      type: 'SET_LEGAL_DATA', 
      payload: {
        legalBusinessName: values.legalBusinessName,
        restaurantType: values.restaurantType,
        otherRestaurantType: values.otherRestaurantType,
        taxId: values.taxId,
        irsLetter: values.irsLetter,
        sameMenuForAll: values.sameMenuForAll
      }
    })
    dispatch({ type: 'SET_LOCATIONS', payload: locations })
    dispatch({ type: 'SET_MENU_GROUPS', payload: menuGroups })
    
    navigate('/onboarding/contact-info')
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">{t('legalDataTitle')}</h2>
        <p className="mt-2 text-sm text-gray-600">
          {t('legalDataSubtitle')}
        </p>
      </div>

      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {({ values, errors, touched, setFieldValue }) => {
          const handleLocationCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const count = parseInt(e.target.value)
            setFieldValue('locationCount', count)
            
            // Update locations array
            const newLocations = Array(count).fill(null).map((_, i) => ({
              name: values.locations[i]?.name || '',
              nameConfirmed: values.locations[i]?.nameConfirmed || false,
              groupId: values.locations[i]?.groupId || ''
            }))
            setFieldValue('locations', newLocations)

            if (count >= 1) {
              setShowLocationInputs(true)
            }
          }

          const handleSameMenuChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
            const sameMenu = e.target.value === 'yes'
            setFieldValue('sameMenuForAll', sameMenu)
            
            if (!sameMenu) {
              // Create default groups when selecting different menus
              setFieldValue('groups', [
                { id: '1', name: t('group') + ' 1', locations: [] },
                { id: '2', name: t('group') + ' 2', locations: [] }
              ])
            } else {
              // Clear groups when selecting same menu for all
              setFieldValue('groups', [])
            }
          }

          const handleGroupLocationChange = (groupId: string, locationId: string, checked: boolean) => {
            const newGroups = values.groups.map(group => {
              if (group.id === groupId) {
                return {
                  ...group,
                  locations: checked 
                    ? [...group.locations, locationId]
                    : group.locations.filter(id => id !== locationId)
                }
              }
              // Remove location from other groups if checked
              if (checked) {
                return {
                  ...group,
                  locations: group.locations.filter(id => id !== locationId)
                }
              }
              return group
            })
            setFieldValue('groups', newGroups)
          }

          const addNewGroup = () => {
            const newGroupId = String(values.groups.length + 1)
            setFieldValue('groups', [
              ...values.groups,
              { id: newGroupId, name: t('group') + ' ' + newGroupId, locations: [] }
            ])
          }

          return (
            <Form className="space-y-6">
              {/* Basic Information Section */}
              <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
                <h3 className="text-lg font-medium text-gray-900">{t('basicInformation')}</h3>
                
                <div>
                  <label htmlFor="legalBusinessName" className="form-label">
                    {t('legalBusinessName')}<span className="text-red-500">*</span>
                  </label>
                  <Field
                    type="text"
                    name="legalBusinessName"
                    id="legalBusinessName"
                    className="input-field mt-2"
                  />
                  {errors.legalBusinessName && touched.legalBusinessName && (
                    <div className="error-message">{errors.legalBusinessName}</div>
                  )}
                </div>

                <div>
                  <label htmlFor="restaurantType" className="form-label">
                    {t('restaurantType')}<span className="text-red-500">*</span>
                  </label>
                  <Field
                    as="select"
                    name="restaurantType"
                    id="restaurantType"
                    className="select-brand mt-2"
                  >
                    <option value="">{t('selectRestaurantType')}</option>
                    {restaurantTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </Field>
                  {errors.restaurantType && touched.restaurantType && (
                    <div className="error-message">{errors.restaurantType}</div>
                  )}
                </div>

                {values.restaurantType === 'other' && (
                  <div>
                    <label htmlFor="otherRestaurantType" className="form-label">
                      {t('specifyRestaurantType')}<span className="text-red-500">*</span>
                    </label>
                    <Field
                      type="text"
                      name="otherRestaurantType"
                      id="otherRestaurantType"
                      className="input-field mt-2"
                      placeholder={t('enterRestaurantType')}
                    />
                    {errors.otherRestaurantType && touched.otherRestaurantType && (
                      <div className="error-message">{errors.otherRestaurantType}</div>
                    )}
                  </div>
                )}

                <div>
                  <label htmlFor="taxId" className="form-label">
                    {t('taxId')}<span className="text-red-500">*</span>
                  </label>
                  <Field
                    type="text"
                    name="taxId"
                    id="taxId"
                    className="input-field mt-2"
                  />
                  {errors.taxId && touched.taxId && (
                    <div className="error-message">{errors.taxId}</div>
                  )}
                </div>
              </div>

              {/* IRS Letter Section */}
              <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
                <h3 className="text-lg font-medium text-gray-900">{t('einConfirmation')}</h3>
                
                <div>
                  <label className="form-label">
                    {t('irsApprovalLetter')}<span className="text-red-500">*</span>
                  </label>
                  <div className="mt-2">
                    <input
                      type="file"
                      onChange={(e) => {
                        const file = e.currentTarget.files?.[0]
                        if (file) {
                          setFieldValue('irsLetter', file)
                        }
                      }}
                      className="block w-full text-sm text-gray-500
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-md file:border-0
                        file:text-sm file:font-semibold
                        file:bg-primary-50 file:text-primary-700
                        hover:file:bg-primary-100"
                    />
                  </div>
                  {errors.irsLetter && touched.irsLetter && (
                    <div className="error-message">{errors.irsLetter}</div>
                  )}
                </div>
              </div>

              {/* Locations Section */}
              <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
                <h3 className="text-lg font-medium text-gray-900">{t('locationsConfiguration')}</h3>

                <div>
                  <label htmlFor="locationCount" className="form-label">
                    {t('numberOfLocations')}<span className="text-red-500">*</span>
                  </label>
                  <Field
                    type="number"
                    name="locationCount"
                    id="locationCount"
                    min="1"
                    max="50"
                    className="input-field mt-2"
                    onChange={handleLocationCountChange}
                  />
                  {errors.locationCount && touched.locationCount && (
                    <div className="error-message">{errors.locationCount}</div>
                  )}
                </div>

                {showLocationInputs && (
                  <div className="space-y-4">
                    {values.locations.map((location, index) => (
                      <div key={index} className="rounded-lg border border-gray-200 p-4 space-y-4">
                        <div>
                          <label htmlFor={`locations.${index}.name`} className="form-label">
                            {t('locationName')} {index + 1}<span className="text-red-500">*</span>
                          </label>
                          <Field
                            type="text"
                            name={`locations.${index}.name`}
                            id={`locations.${index}.name`}
                            className="input-field mt-2"
                          />
                          {errors.locations?.[index] && typeof errors.locations[index] === 'object' && (
                            <>
                              {errors.locations[index] && 'name' in errors.locations[index] && touched.locations?.[index]?.name && (
                                <div className="error-message">
                                  {(errors.locations[index] as { name: string }).name}
                                </div>
                              )}
                            </>
                          )}
                        </div>

                        {location.name && (
                          <div className="rounded-md bg-gray-50 p-4">
                            <div className="flex items-start">
                              <div className="flex h-6 items-center">
                                <Field
                                  type="checkbox"
                                  name={`locations.${index}.nameConfirmed`}
                                  id={`locations.${index}.nameConfirmed`}
                                  className="checkbox-brand"
                                />
                              </div>
                              <div className="ml-3">
                                <label
                                  htmlFor={`locations.${index}.nameConfirmed`}
                                  className="text-sm text-gray-700"
                                >
                                  {t('confirmLocationName')} "{location.name}"
                                </label>
                                {errors.locations?.[index] && typeof errors.locations[index] === 'object' && (
                                  <>
                                    {errors.locations[index] && 'nameConfirmed' in errors.locations[index] && touched.locations?.[index]?.nameConfirmed && (
                                      <p className="error-message mt-1">
                                        {(errors.locations[index] as { nameConfirmed: string }).nameConfirmed}
                                      </p>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Menu Configuration - Only show after all locations are confirmed AND there is more than one location */}
              {values.locations.length > 1 && values.locations.every(loc => loc.nameConfirmed) && (
                <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
                  <h3 className="text-lg font-medium text-gray-900">{t('menuConfiguration')}</h3>
                  
                  <div>
                    <label htmlFor="sameMenuForAll" className="form-label">
                      {t('sameMenuQuestion')}<span className="text-red-500">*</span>
                    </label>
                    <Field
                      as="select"
                      name="sameMenuForAll"
                      id="sameMenuForAll"
                      className="select-brand mt-2"
                      onChange={handleSameMenuChange}
                    >
                      <option value="">{t('selectOption')}</option>
                      <option value="yes">{t('yes')}</option>
                      <option value="no">{t('no')}</option>
                    </Field>
                    {errors.sameMenuForAll && touched.sameMenuForAll && (
                      <div className="error-message">{errors.sameMenuForAll}</div>
                    )}
                  </div>

                  {/* Show selection status */}
                  {values.sameMenuForAll !== undefined && (
                    <div className="mt-2 text-sm">
                      {values.sameMenuForAll ? (
                        <p className="text-green-600">✓ {t('allLocationsShareMenu')}</p>
                      ) : (
                        <p className="text-blue-600">ℹ {t('differentMenusPerLocation')}</p>
                      )}
                    </div>
                  )}

                  {/* Only show groups section after selecting "No" */}
                  {values.sameMenuForAll === false && (
                    <div className="mt-6 space-y-6">
                      <div className="border-t border-gray-200 pt-6">
                        <h4 className="text-lg font-medium text-gray-900">{t('groupConfiguration')}</h4>
                        <p className="mt-2 text-sm text-gray-600">
                          {t('groupsExplanation')}
                        </p>
                        
                        {/* Groups Section */}
                        <div className="mt-4 space-y-4">
                          {values.groups.map((group, groupIndex) => (
                            <div key={group.id} className="rounded-lg border border-gray-200 p-4 space-y-4">
                              <h4 className="font-medium text-gray-900">{group.name}</h4>
                              <div className="space-y-2">
                                {values.locations.map((location, locationIndex) => (
                                  <div key={locationIndex} className="flex items-center space-x-2">
                                    <input
                                      type="checkbox"
                                      id={`group-${group.id}-location-${locationIndex}`}
                                      checked={group.locations.includes(String(locationIndex + 1))}
                                      onChange={(e) => {
                                        handleGroupLocationChange(group.id, String(locationIndex + 1), e.target.checked)
                                      }}
                                      className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-600"
                                      disabled={
                                        values.groups.some(g => 
                                          g.id !== group.id && 
                                          g.locations.includes(String(locationIndex + 1))
                                        )
                                      }
                                    />
                                    <label 
                                      htmlFor={`group-${group.id}-location-${locationIndex}`}
                                      className="text-sm text-gray-700"
                                    >
                                      {location.name}
                                    </label>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Add Group Button */}
                        <button
                          type="button"
                          onClick={addNewGroup}
                          className="mt-4 inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-primary-700 bg-primary-100 hover:bg-primary-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                        >
                          {t('addNewGroup')}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-between pt-6">
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  className="btn-secondary"
                >
                  {t('back')}
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
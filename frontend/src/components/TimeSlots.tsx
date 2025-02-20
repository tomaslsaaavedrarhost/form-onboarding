import React from 'react'
import { useFormikContext, Field } from 'formik'
import { useTranslation } from '../hooks/useTranslation'

interface TimeSlotsProps {
  day: string
  index: number
}

export const TimeSlots: React.FC<TimeSlotsProps> = ({ day, index }) => {
  const { t } = useTranslation()
  const { values, setFieldValue } = useFormikContext<any>()

  const addTimeSlot = () => {
    const currentTimeSlots = values.locationDetails[index].schedule[day].timeSlots
    setFieldValue(`locationDetails.${index}.schedule.${day}.timeSlots`, [
      ...currentTimeSlots,
      {
        start: '',
        end: '',
        type: 'open',
        kitchenClosingTime: ''
      }
    ])
  }

  const removeTimeSlot = (slotIndex: number) => {
    const currentTimeSlots = values.locationDetails[index].schedule[day].timeSlots
    setFieldValue(
      `locationDetails.${index}.schedule.${day}.timeSlots`,
      currentTimeSlots.filter((_: any, i: number) => i !== slotIndex)
    )
  }

  return (
    <div className="space-y-4">
      {values.locationDetails[index].schedule[day].timeSlots.map((slot: any, slotIndex: number) => (
        <div key={slotIndex} className="flex items-center space-x-4">
          <div className="flex-1 space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              {t('startTime')}
            </label>
            <Field
              type="time"
              name={`locationDetails.${index}.schedule.${day}.timeSlots.${slotIndex}.start`}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            />
          </div>

          <div className="flex-1 space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              {t('endTime')}
            </label>
            <Field
              type="time"
              name={`locationDetails.${index}.schedule.${day}.timeSlots.${slotIndex}.end`}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            />
          </div>

          <div className="flex-1 space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              {t('type')}
            </label>
            <Field
              as="select"
              name={`locationDetails.${index}.schedule.${day}.timeSlots.${slotIndex}.type`}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            >
              <option value="open">{t('open')}</option>
              <option value="delivery">{t('delivery')}</option>
              <option value="takeout">{t('takeout')}</option>
            </Field>
          </div>

          <div className="flex-1 space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              {t('kitchenClosingTime')}
            </label>
            <Field
              type="time"
              name={`locationDetails.${index}.schedule.${day}.timeSlots.${slotIndex}.kitchenClosingTime`}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            />
          </div>

          <button
            type="button"
            onClick={() => removeTimeSlot(slotIndex)}
            className="mt-6 inline-flex items-center rounded-md border border-transparent bg-red-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            {t('remove')}
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={addTimeSlot}
        className="inline-flex items-center rounded-md border border-transparent bg-primary-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
      >
        {t('addTimeSlot')}
      </button>
    </div>
  )
}

export default TimeSlots 
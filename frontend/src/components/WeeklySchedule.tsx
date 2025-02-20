import React from 'react'
import { useFormikContext, Field } from 'formik'
import { useTranslation } from '../hooks/useTranslation'
import { TimeSlots } from './TimeSlots'

interface WeeklyScheduleProps {
  index: number
}

export const WeeklySchedule: React.FC<WeeklyScheduleProps> = ({ index }) => {
  const { t } = useTranslation()
  const { values, setFieldValue } = useFormikContext<any>()

  const days = [
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
    'sunday'
  ]

  const handleDayToggle = (day: string, checked: boolean) => {
    setFieldValue(`locationDetails.${index}.schedule.${day}.enabled`, checked)
    if (checked) {
      setFieldValue(`locationDetails.${index}.schedule.${day}.timeSlots`, [{
        start: '',
        end: '',
        type: 'open',
        kitchenClosingTime: ''
      }])
    }
  }

  return (
    <div className="space-y-6">
      {days.map((day) => (
        <div key={day} className="space-y-4">
          <div className="flex items-center">
            <Field
              type="checkbox"
              name={`locationDetails.${index}.schedule.${day}.enabled`}
              id={`locationDetails.${index}.schedule.${day}.enabled`}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleDayToggle(day, e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-600"
            />
            <label
              htmlFor={`locationDetails.${index}.schedule.${day}.enabled`}
              className="ml-2 block text-sm font-medium text-gray-900"
            >
              {t(day)}
            </label>
          </div>

          {values.locationDetails[index].schedule[day].enabled && (
            <div className="ml-6">
              <h4 className="text-sm font-medium text-gray-900 mb-2">
                {t(`${day}TimeSlots`)}
              </h4>
              <TimeSlots day={day} index={index} />
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

export default WeeklySchedule 
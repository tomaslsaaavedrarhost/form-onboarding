import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useFormProgress } from '../hooks/useFormProgress'
import { useTranslation } from '../hooks/useTranslation'

interface FormActionsProps {
  onSubmit?: () => void
  nextPath?: string
  showBack?: boolean
  isValid?: boolean
  submitButtonText?: string
}

export default function FormActions({
  onSubmit,
  nextPath,
  showBack = true,
  isValid = true,
  submitButtonText
}: FormActionsProps) {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { saveFormData, unsavedChanges } = useFormProgress()

  const handleNext = async () => {
    if (unsavedChanges) {
      const shouldSave = window.confirm(t('unsavedChangesWarning'))
      if (shouldSave) {
        const saved = await saveFormData()
        if (saved) {
          if (onSubmit) onSubmit()
          if (nextPath) navigate(nextPath)
        }
      }
    } else {
      if (onSubmit) onSubmit()
      if (nextPath) navigate(nextPath)
    }
  }

  return (
    <div className="flex justify-end space-x-4">
      {showBack && (
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="btn-secondary"
        >
          {t('back')}
        </button>
      )}
      <button
        type="button"
        onClick={saveFormData}
        disabled={!unsavedChanges}
        className={`
          inline-flex items-center rounded-md px-3 py-2 text-sm font-semibold shadow-sm
          ${unsavedChanges
            ? 'bg-indigo-600 text-white hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }
        `}
      >
        {t('save')}
        {unsavedChanges && (
          <span className="ml-2 h-2 w-2 rounded-full bg-red-400"></span>
        )}
      </button>
      <button
        type="button"
        onClick={handleNext}
        disabled={!isValid}
        className={`btn-primary ${!isValid ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {submitButtonText || t('continue')}
      </button>
    </div>
  )
} 
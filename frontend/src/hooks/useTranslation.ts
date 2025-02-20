import { useForm } from '../lib/FormContext'
import { translations } from '../translations'

export function useTranslation() {
  const { formData } = useForm()
  const language = formData?.language || 'en'

  const t = (key: string): string => {
    return translations[language][key] || translations['en'][key] || key
  }

  return { t, language }
} 
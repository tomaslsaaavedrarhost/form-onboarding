import { useForm } from '../context/FormContext'
import { translations } from '../translations'

export function useTranslation() {
  const { state } = useForm()
  const language = state.language || 'en'

  const t = (key: string): string => {
    return translations[language][key] || translations['en'][key] || key
  }

  return { t, language }
} 
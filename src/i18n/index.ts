import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { bn } from './locales/bn'
import { en } from './locales/en'

export const LANGUAGE_STORAGE_KEY = 'sfo-admin-language'
export type AppLanguage = 'en' | 'bn'

const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY)
const initialLanguage: AppLanguage = stored === 'bn' ? 'bn' : 'en'

void i18n.use(initReactI18next).init({
  resources: { en, bn },
  lng: initialLanguage,
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  returnNull: false,
})

document.documentElement.lang = initialLanguage

export function changeLanguage(language: AppLanguage) {
  localStorage.setItem(LANGUAGE_STORAGE_KEY, language)
  document.documentElement.lang = language
  void i18n.changeLanguage(language)
}

export default i18n

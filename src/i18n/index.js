import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

import tr from './translations/tr.json'
import en from './translations/en.json'

const resources = {
  tr: {
    translation: tr
  },
  en: {
    translation: en
  }
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    lng: 'en',
    debug: false,
    
    detection: {
      order: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
      caches: ['localStorage'],
    },

    interpolation: {
      escapeValue: false,
    }
  })

export default i18n
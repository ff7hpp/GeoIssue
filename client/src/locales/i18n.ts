import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './en.json';
import ar from './ar.json';
import tr from './tr.json';

const resources = {
  en: { translation: en },
  ar: { translation: ar },
  tr: { translation: tr },
};

const savedLang = localStorage.getItem('geoissue_lang') || 'en';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    lng: savedLang,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'geoissue_lang',
    },
  });

export function updateDocumentDirection(lang: string) {
  const isRtl = lang === 'ar';
  document.documentElement.setAttribute('dir', isRtl ? 'rtl' : 'ltr');
  document.documentElement.setAttribute('lang', lang);
}

// Initial sync
updateDocumentDirection(i18n.language || savedLang);

i18n.on('languageChanged', (lng) => {
  localStorage.setItem('geoissue_lang', lng);
  updateDocumentDirection(lng);
});

export default i18n;

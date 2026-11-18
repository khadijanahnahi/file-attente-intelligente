import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import fr from './fr.json';
import ar from './ar.json';

export type Langue = 'fr' | 'ar';
const CLE = 'langue';

function lire(): Langue | null {
  try {
    const v = localStorage.getItem(CLE);
    return v === 'fr' || v === 'ar' ? v : null;
  } catch {
    return null;
  }
}

/** Applique la langue au document : attribut lang et sens d'écriture (arabe = de droite à gauche). */
function appliquer(l: string) {
  document.documentElement.lang = l;
  document.documentElement.dir = l === 'ar' ? 'rtl' : 'ltr';
}

void i18n.use(initReactI18next).init({
  resources: { fr: { translation: fr }, ar: { translation: ar } },
  lng: lire() ?? (navigator.language.startsWith('ar') ? 'ar' : 'fr'),
  fallbackLng: 'fr',
  interpolation: { escapeValue: false },
});

i18n.on('languageChanged', appliquer);
appliquer(i18n.language);

export function changerLangue(l: Langue) {
  try {
    localStorage.setItem(CLE, l);
  } catch {
    /* stockage indisponible : la langue ne sera simplement pas mémorisée */
  }
  void i18n.changeLanguage(l);
}

export default i18n;

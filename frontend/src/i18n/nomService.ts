import i18n from './index';

/**
 * Les noms de services viennent de la base de données (en français). En arabe on cherche une traduction
 * dans ar.json, sous services.noms.<nom sans accents, en minuscules, séparé par _>.
 * Un service ajouté plus tard sans traduction garde simplement son nom d'origine.
 */
const cle = (nom: string) =>
  'services.noms.' +
  nom
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');

export function nomService(nom: string): string {
  if (i18n.language !== 'ar') return nom;
  const k = cle(nom);
  return i18n.exists(k, { lng: 'ar' }) ? i18n.t(k, { lng: 'ar' }) : nom;
}

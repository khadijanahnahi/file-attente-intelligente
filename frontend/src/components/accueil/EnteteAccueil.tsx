import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { changerLangue, type Langue } from '../../i18n';

function Logo() {
  return (
    <span className="relative grid size-11 shrink-0 place-items-center rounded-[14px] bg-gradient-to-br from-[#4f63f0] to-majorelle shadow-[0_10px_20px_-10px_rgb(30_58_138/0.8),inset_0_-3px_0_rgb(0_0_0/0.18)] transition-transform group-hover:-rotate-6 group-hover:scale-105">
      <svg viewBox="0 0 32 32" className="size-7" aria-hidden="true">
        <path d="M5 8h22a1 1 0 0 1 1 1v4.2a3 3 0 0 0 0 5.6V23a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-4.2a3 3 0 0 0 0-5.6V9a1 1 0 0 1 1-1z" fill="#fff" />
        <path d="M11 12.5v7" stroke="var(--color-majorelle)" strokeWidth="1.8" strokeLinecap="round" strokeDasharray="1.2 2.6" />
        <path d="M15.5 13h8M15.5 16h8M15.5 19h5" stroke="var(--color-majorelle)" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
      <span className="absolute -end-1 -top-1 size-3.5 rounded-full border-2 border-white bg-ok">
        <span className="absolute inset-0 animate-[lp-ping_2s_infinite] rounded-full bg-ok" />
      </span>
    </span>
  );
}

/** Barre du haut de l'accueil : collante, vitrée, avec liens d'ancre et sélecteur de langue en deux segments. */
export default function EnteteAccueil() {
  const { t, i18n } = useTranslation();
  const langue = i18n.language === 'ar' ? 'ar' : 'fr';

  const segment = (l: Langue, texte: string) => (
    <button
      type="button"
      lang={l}
      onClick={() => changerLangue(l)}
      aria-pressed={langue === l}
      aria-label={l === 'ar' ? 'العربية' : 'Français'}
      className={`min-h-9 min-w-11 rounded-full px-3 text-sm font-bold transition-colors ${
        langue === l ? 'bg-majorelle text-white shadow-sm' : 'text-ink hover:bg-ink/5'
      }`}
    >
      {texte}
    </button>
  );

  return (
    <header className="flex items-center justify-between gap-3 py-5">
      <Link to="/" className="group flex min-w-0 items-center gap-3 text-ink">
        <Logo />
        <b className="text-[.95rem] leading-tight font-extrabold sm:text-[1.1rem]">{t('app.nom')}</b>
      </Link>

      <div className="flex shrink-0 items-center gap-2">
        <Link
          to="/agent"
          className="inline-flex min-h-11 items-center gap-2 rounded-full bg-ink px-4 text-sm font-bold text-white transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-majorelle"
        >
          <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="5" y="11" width="14" height="9" rx="2" />
            <path d="M8 11V8a4 4 0 0 1 8 0v3" />
          </svg>
          <span className="hidden sm:inline">{t('connexion.espaceAgent')}</span>
        </Link>
        <div role="group" aria-label={t('langue.changer')} className="flex items-center gap-0.5 rounded-full border border-line bg-white p-1">
          {segment('fr', 'FR')}
          {segment('ar', 'عربي')}
        </div>
      </div>
    </header>
  );
}

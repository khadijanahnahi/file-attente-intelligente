import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LangSwitch from './LangSwitch';

export default function Header() {
  const { t } = useTranslation();
  return (
    <header className="flex items-center justify-between gap-3 py-5">
      <Link to="/" className="flex items-center gap-2.5 font-semibold text-ink">
        <svg viewBox="0 0 32 32" className="size-8 shrink-0" aria-hidden="true">
          <rect width="32" height="32" rx="8" fill="var(--color-majorelle)" />
          <path d="M8 9h16v5a2 2 0 0 0 0 4v5H8v-5a2 2 0 0 0 0-4z" fill="#fff" />
          <path d="M12 16h8" stroke="var(--color-majorelle)" strokeWidth="2" strokeLinecap="round" strokeDasharray="1 3" />
        </svg>
        <span className="leading-tight">{t('app.nom')}</span>
      </Link>
      <div className="flex items-center gap-2">
        <Link
          to="/agent"
          className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-ink/15 px-3 text-sm font-semibold text-ink hover:bg-ink/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-majorelle"
        >
          <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="5" y="11" width="14" height="9" rx="2" />
            <path d="M8 11V8a4 4 0 0 1 8 0v3" />
          </svg>
          {t('connexion.espaceAgent')}
        </Link>
        <LangSwitch />
      </div>
    </header>
  );
}

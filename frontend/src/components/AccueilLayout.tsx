import { Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Header from './Header';
import Marquee from './accueil/Marquee';

/** Mise en page large de la page d'accueil. Les autres pages citoyen gardent CitoyenLayout (colonne étroite). */
export default function AccueilLayout() {
  const { t } = useTranslation();
  return (
    <div className="lp-theme min-h-dvh overflow-x-clip bg-paper">
      <Marquee />
      <div className="mx-auto max-w-6xl px-4 pb-10 sm:px-6">
        <Header />
        <main>
          <Outlet />
        </main>
        <footer className="mt-8 border-t border-line py-6 text-sm text-muted">{t('landing.pied')}</footer>
      </div>
    </div>
  );
}

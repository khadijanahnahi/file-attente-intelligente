import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { listerServices } from '../api/citoyen';
import type { EvenementEcran, ServiceView } from '../api/types';
import { useConnexionTempsReel, useTopic } from '../hooks/useStomp';
import LangSwitch from '../components/LangSwitch';

/**
 * Écran de la salle d'attente (/ecran) : projeté sur un téléviseur, sans connexion.
 * Il écoute /topic/ecran (backend : EcranAffichage). Le backend n'expose pas la liste des tickets
 * déjà appelés : l'écran garde donc ses derniers appels en mémoire (et dans localStorage
 * pour survivre à un rechargement de la page).
 */
interface Appel {
  ticketId: number;
  numero: string;
  service: string;
  guichet: number | null;
}

const CLE = 'ecran.appels';
const MAX = 6;
const FINAUX: EvenementEcran['type'][] = ['TICKET_TERMINE', 'TICKET_ABSENT', 'TICKET_ANNULE', 'TICKET_REMIS_EN_ATTENTE'];

function lireAppels(): Appel[] {
  try {
    const v = JSON.parse(localStorage.getItem(CLE) ?? '[]');
    return Array.isArray(v) ? v.slice(0, MAX) : [];
  } catch {
    return [];
  }
}

export default function Ecran() {
  const { t, i18n } = useTranslation();
  const connecte = useConnexionTempsReel();
  const [appels, setAppels] = useState<Appel[]>(lireAppels);
  const [annonce, setAnnonce] = useState(0); // change à chaque (ré)appel : relance l'animation
  const [services, setServices] = useState<ServiceView[]>([]);
  const [son, setSon] = useState(false);
  const [heure, setHeure] = useState(() => new Date());
  const audio = useRef<AudioContext | null>(null);
  const minuteur = useRef<number | undefined>(undefined);

  useEffect(() => {
    try {
      localStorage.setItem(CLE, JSON.stringify(appels));
    } catch {
      /* rien */
    }
  }, [appels]);

  useEffect(() => {
    const id = window.setInterval(() => setHeure(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const rafraichir = useCallback(() => {
    listerServices().then(setServices).catch(() => {});
  }, []);
  useEffect(() => {
    rafraichir();
    const id = window.setInterval(rafraichir, 30000);
    return () => window.clearInterval(id);
  }, [rafraichir]);
  useEffect(() => () => window.clearTimeout(minuteur.current), []);

  function jouerSon(a: Appel) {
    const ctx = audio.current;
    if (ctx) {
      [660, 880].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.0001, ctx.currentTime + i * 0.35);
        gain.gain.exponentialRampToValueAtTime(0.4, ctx.currentTime + i * 0.35 + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + i * 0.35 + 0.5);
        osc.connect(gain).connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.35);
        osc.stop(ctx.currentTime + i * 0.35 + 0.55);
      });
    }
    if ('speechSynthesis' in window && a.guichet !== null) {
      const ar = i18n.language === 'ar';
      const u = new SpeechSynthesisUtterance(
        t('ecran.voix', { numero: a.numero.split('').join(' '), n: a.guichet }),
      );
      u.lang = ar ? 'ar-SA' : 'fr-FR';
      window.setTimeout(() => window.speechSynthesis.speak(u), 900);
    }
  }

  useTopic<EvenementEcran>('/topic/ecran', (e) => {
    if (e.type === 'TICKET_APPELE') {
      const appel: Appel = { ticketId: e.ticketId, numero: e.numero, service: e.service, guichet: e.guichet };
      setAppels((liste) => [appel, ...liste.filter((a) => a.ticketId !== e.ticketId)].slice(0, MAX));
      setAnnonce((n) => n + 1);
      if (son) jouerSon(appel);
    } else if (FINAUX.includes(e.type)) {
      setAppels((liste) => liste.filter((a) => a.ticketId !== e.ticketId));
    }
    window.clearTimeout(minuteur.current);
    minuteur.current = window.setTimeout(rafraichir, 400);
  });

  function activerSon() {
    const Ctx = window.AudioContext;
    audio.current ??= new Ctx();
    void audio.current.resume();
    setSon(true);
  }

  const [courant, ...precedents] = appels;
  const locale = i18n.language === 'ar' ? 'ar-MA' : 'fr-FR';

  return (
    <div className="flex min-h-dvh flex-col bg-ink p-6 text-white sm:p-10">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-xl font-semibold text-white/80">{t('app.nom')}</h1>
        <div className="flex items-center gap-4">
          <span className="text-3xl font-bold tabular-nums" dir="ltr">
            {heure.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}
          </span>
          <span className={`flex items-center gap-2 text-sm ${connecte ? 'text-white/70' : 'text-saffron'}`} role="status">
            <span className={`size-2.5 rounded-full ${connecte ? 'bg-emerald-400' : 'bg-saffron'}`} aria-hidden="true" />
            {connecte ? t('ticket.direct') : t('ticket.reconnexion')}
          </span>
          {!son && (
            <button
              type="button" onClick={activerSon}
              className="min-h-11 rounded-full bg-white/10 px-4 text-sm font-semibold hover:bg-white/20"
            >
              {t('ecran.activerSon')}
            </button>
          )}
          <LangSwitch />
        </div>
      </header>

      <main className="mt-8 grid flex-1 gap-8 lg:grid-cols-[3fr_2fr]">
        <section aria-live="assertive" aria-label={t('ecran.enAppel')}>
          {courant ? (
            <div key={annonce} className="ecran-annonce flex h-full min-h-72 flex-col justify-center rounded-3xl bg-saffron p-8 text-ink sm:p-10">
              <p className="text-2xl font-semibold">{courant.service}</p>
              <p className="mt-2 text-[clamp(4rem,10vw,9rem)] leading-none font-bold tracking-tight whitespace-nowrap tabular-nums">
                <bdi dir="ltr">{courant.numero}</bdi>
              </p>
              {courant.guichet !== null && (
                <p className="mt-5 text-[clamp(2.25rem,5vw,4rem)] leading-none font-bold">
                  {t('ticket.guichet', { n: courant.guichet })}
                </p>
              )}
            </div>
          ) : (
            <div className="flex h-full min-h-72 items-center justify-center rounded-3xl border-2 border-dashed border-white/25 p-8 text-center text-2xl text-white/70">
              {t('ecran.aucunAppel')}
            </div>
          )}
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white/70">{t('ecran.precedents')}</h2>
          <ul className="mt-3 divide-y divide-white/15">
            {precedents.length === 0 && <li className="py-4 text-white/50">—</li>}
            {precedents.map((a) => (
              <li key={a.ticketId} className="flex items-center justify-between gap-4 py-4">
                <span className="text-4xl font-bold tabular-nums"><bdi dir="ltr">{a.numero}</bdi></span>
                <span className="text-end">
                  <span className="block text-xl font-semibold">
                    {a.guichet !== null ? t('ticket.guichet', { n: a.guichet }) : ''}
                  </span>
                  <span className="block text-sm text-white/60">{a.service}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      </main>

      <footer className="mt-8 border-t border-white/15 pt-5">
        <ul className="flex flex-wrap gap-x-10 gap-y-3">
          {services.filter((s) => s.actif).map((s) => (
            <li key={s.id} className="flex items-baseline gap-3">
              <span className="text-lg font-semibold">{s.nom}</span>
              <span className="text-white/70">
                <bdi dir="ltr" className="text-2xl font-bold text-white tabular-nums">{s.nbEnAttente}</bdi>{' '}
                {t('services.enAttente').toLowerCase()}
                {s.nbEnAttente > 0 && <> · <bdi dir="ltr">{t('services.attenteEstimee', { n: s.attenteEstimeeMin })}</bdi></>}
              </span>
            </li>
          ))}
        </ul>
      </footer>
    </div>
  );
}

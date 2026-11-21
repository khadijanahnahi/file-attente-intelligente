import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Avatar, { AVATARS } from './Avatar';

const ATTENTE_DEPART = 5;
const MIN_PAR_PERSONNE = 3;
const SATELLITES = [
  { cle: 'a', angle: 45 },
  { cle: 'b', angle: 135 },
  { cle: 'c', angle: 225 },
  { cle: 'd', angle: 315 },
] as const;

/** Le ticket du téléphone avance tout seul : c'est une démonstration, pas une vraie file. */
function TelephoneDemo() {
  const { t } = useTranslation();
  const [devant, setDevant] = useState(ATTENTE_DEPART);

  useEffect(() => {
    let pause = 0;
    const id = window.setInterval(() => {
      setDevant((d) => {
        if (d > 0) return d - 1;
        pause += 1;
        if (pause > 2) {
          pause = 0;
          return ATTENTE_DEPART;
        }
        return d;
      });
    }, 1700);
    return () => window.clearInterval(id);
  }, []);

  const tourVenu = devant === 0;
  const bientot = devant > 0 && devant <= 2;
  const progres = Math.min(100, 8 + (1 - devant / ATTENTE_DEPART) * 92);
  const message = tourVenu ? 'landing.tel.appele' : bientot ? 'landing.tel.bientot' : 'landing.tel.dansFile';

  return (
    <div className="lp-phone">
      <div className="flex justify-between text-[.8em] font-semibold text-muted">
        <span dir="ltr">09:41</span>
        <span>{t('landing.tel.titre')}</span>
      </div>
      <div className={`lp-tk ${tourVenu ? 'lp-tk-go' : ''}`}>
        <small>{t('landing.tel.numero')}</small>
        <b dir="ltr">N-0{41 + ATTENTE_DEPART}</b>
        <span>{t('landing.tel.service')}</span>
      </div>
      <div className="grid grid-cols-2 gap-[.6em]">
        <div className="rounded-[1em] bg-paper py-[.7em] text-center">
          <b className="block text-[1.45em] leading-tight">{devant}</b>
          <span className="text-[.7em] text-muted">{t('landing.tel.devant')}</span>
        </div>
        <div className="rounded-[1em] bg-paper py-[.7em] text-center">
          <b className="block text-[1.45em] leading-tight" dir="ltr">{devant * MIN_PAR_PERSONNE} min</b>
          <span className="text-[.7em] text-muted">{t('landing.tel.attente')}</span>
        </div>
      </div>
      <div className="h-[.6em] overflow-hidden rounded-full bg-line">
        <div className="h-full rounded-full bg-ok transition-[width] duration-700" style={{ width: `${progres}%` }} />
      </div>
      <p className={`lp-msg ${bientot ? 'lp-msg-hot' : ''}`}>{t(message)}</p>
    </div>
  );
}

export default function Hero() {
  const { t } = useTranslation();
  const phrases = t('landing.hero.phrases', { returnObjects: true }) as string[];
  const boucle = [...phrases, phrases[0]];

  return (
    <div className="grid items-center gap-6 pt-4 pb-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:pb-14">
      <div>
        <h1 className="text-[clamp(2.2rem,4.2vw,3.3rem)] leading-[1.1] font-extrabold tracking-tight text-balance">
          {t('landing.hero.debut')}
          <span className="lp-swap" aria-hidden="true">
            <span className="lp-swap-track">
              {boucle.map((p, i) => (
                <b key={i}>{p}</b>
              ))}
            </span>
          </span>
          <span className="sr-only">{phrases[0]}</span>
        </h1>
        <p className="mt-5 max-w-[34ch] text-lg text-muted">{t('landing.hero.intro')}</p>
        <div className="mt-7 flex flex-wrap gap-3">
          <a
            href="#services"
            className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-majorelle px-6 font-bold text-white transition-transform hover:-translate-y-0.5"
          >
            {t('landing.hero.cta')}
            <svg viewBox="0 0 24 24" className="size-[18px] rtl:-scale-x-100" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </a>
          <a href="#etapes" className="inline-flex min-h-12 items-center rounded-xl border-[1.5px] border-line px-6 font-bold">
            {t('landing.hero.comment')}
          </a>
        </div>
      </div>

      <div className="lp-cluster" aria-hidden="true">
        <div className="lp-orbit">
          {SATELLITES.map((s) => (
            <div key={s.cle} className="lp-sat" style={{ ['--a' as string]: `${s.angle}deg` }}>
              <div>
                <Avatar {...AVATARS[s.cle]} />
              </div>
            </div>
          ))}
        </div>
        <TelephoneDemo />
        <div className="lp-chip lp-c1">
          <svg viewBox="0 0 24 24" fill="none" stroke="var(--color-majorelle)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="7" y="2" width="10" height="20" rx="2" />
            <path d="M11 18h2" />
          </svg>
          <span>{t('landing.puce.telephone')}</span>
        </div>
        <div className="lp-chip lp-c2">
          <svg viewBox="0 0 24 24" fill="none" stroke="var(--color-ok)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 2" />
          </svg>
          <span>{t('landing.puce.attente')}</span>
        </div>
        <div className="lp-chip lp-c3">
          <svg className="lp-bell" viewBox="0 0 24 24" fill="none" stroke="#a15c00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
            <path d="M10 21h4" />
          </svg>
          <span>{t('landing.puce.prevenu')}</span>
        </div>
      </div>
    </div>
  );
}

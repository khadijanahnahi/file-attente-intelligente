import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Avatar, { AVATARS } from './Avatar';
import IconeService, { type TypeIcone } from './IconeService';

const ATTENTE_DEPART = 5;
const MIN_PAR_PERSONNE = 3;
const ICONES: TypeIcone[] = ['document', 'plume', 'maison'];
const PREFIXES = ['N', 'L', 'R'];
const SATELLITES = [
  { cle: 'a', angle: 45 },
  { cle: 'b', angle: 135 },
  { cle: 'c', angle: 225 },
  { cle: 'd', angle: 315 },
] as const;

/**
 * Démonstration jouable : on choisit une démarche, le ticket avance, on est prévenu puis appelé.
 * Tout est simulé ici, rien n'est envoyé au serveur.
 */
function useSimulation() {
  const [jouer, setJouer] = useState(false);
  const [service, setService] = useState(0);
  const [devant, setDevant] = useState(ATTENTE_DEPART);
  const survol = useRef(false);
  const appele = jouer && devant === 0;

  const choisir = useCallback((i: number) => {
    setService(i);
    setDevant(ATTENTE_DEPART);
    setJouer(true);
  }, []);
  const avancer = useCallback(() => {
    if (!jouer) return choisir(service);
    setDevant((d) => Math.max(0, d - 1));
  }, [jouer, service, choisir]);
  const rejouer = useCallback(() => setJouer(false), []);
  const alerte = useCallback(() => {
    setJouer(true);
    setDevant(2);
  }, []);

  useEffect(() => {
    if (!jouer) {
      let calme = 0;
      const id = window.setInterval(() => {
        if (survol.current) calme = 0;
        else if (++calme >= 6) choisir(0);
      }, 1000);
      return () => window.clearInterval(id);
    }
    if (!appele) {
      const id = window.setInterval(() => setDevant((d) => Math.max(0, d - 1)), 2400);
      return () => window.clearInterval(id);
    }
    const id = window.setTimeout(() => setJouer(false), 6500);
    return () => window.clearTimeout(id);
  }, [jouer, appele, choisir]);

  return { jouer, appele, service, devant, survol, choisir, avancer, rejouer, alerte };
}
type Simulation = ReturnType<typeof useSimulation>;

const COULEURS_CONFETTIS = ['#f5b301', '#0c7a5c', '#2b3fcb', '#e0502f', '#c2418a'];

function Confettis() {
  return (
    <div className="lp-burst" aria-hidden="true">
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i / 12) * Math.PI * 2;
        const r = 7 + (i % 3) * 1.6;
        return <i key={i} style={{ ['--x' as string]: `${Math.cos(a) * r}em`, ['--y' as string]: `${Math.sin(a) * r}em`, ['--c' as string]: COULEURS_CONFETTIS[i % 5] }} />;
      })}
    </div>
  );
}

function IconeCloche({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M12 2a6 6 0 0 0-6 6c0 6-2.5 7.5-2.5 8.5 0 .6.4 1 1 1h15c.6 0 1-.4 1-1C20.5 15.5 18 14 18 8a6 6 0 0 0-6-6zM9.5 19.5a2.5 2.5 0 0 0 5 0z" />
    </svg>
  );
}

function TelephoneDemo({ sim }: { sim: Simulation }) {
  const { t } = useTranslation();
  const { jouer, appele, service, devant, survol, choisir, avancer, rejouer } = sim;
  const noms = t('landing.tel.services', { returnObjects: true }) as string[];
  const bientot = jouer && devant > 0 && devant <= 2;
  const progres = Math.min(100, 8 + (1 - devant / ATTENTE_DEPART) * 92);
  const message = appele ? 'landing.tel.appele' : bientot ? 'landing.tel.bientot' : 'landing.tel.dansFile';

  return (
    <div className="lp-phone" onPointerEnter={() => (survol.current = true)} onPointerLeave={() => (survol.current = false)}>
      <div className={`lp-scr ${bientot && devant === 2 ? 'lp-buzz' : ''}`}>
        {bientot && (
          <div className="lp-toast" role="status">
            <IconeCloche className="size-[1.6em] shrink-0 text-saffron" />
            <span>{t('landing.tel.notif')}</span>
          </div>
        )}
        <div className="flex justify-between text-[.8em] font-semibold text-muted">
          <span dir="ltr">09:41</span>
          <span>{t('landing.tel.titre')}</span>
        </div>

        {!jouer ? (
          <>
            <p className="mt-[.4em] text-[1.05em] leading-snug font-extrabold">{t('landing.tel.choisir')}</p>
            <div className="grid gap-[.55em]">
              {noms.map((nom, i) => (
                <button key={nom} type="button" className="lp-opt" onClick={() => choisir(i)}>
                  <span className="lp-oi">
                    <IconeService type={ICONES[i]} className="size-[1.35em]" />
                  </span>
                  <span>{nom}</span>
                  {i === 0 && (
                    <svg className="lp-hand" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M9 11V5.5a1.5 1.5 0 0 1 3 0V10l5.2 1.3A2.5 2.5 0 0 1 19 13.7V16c0 3-2 5-5 5h-1.5c-1.8 0-3-.700-4-2l-3.2-4.3a1.5 1.5 0 0 1 2.3-1.9L9 14z" fill="#fff" stroke="#1a1a1a" strokeWidth="1.4" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
            <p className="mt-auto text-center text-[.72em] font-semibold text-muted">{t('landing.tel.astuce')}</p>
          </>
        ) : (
          <>
            <div key={`${service}-${appele}`} className={`lp-tk ${appele ? 'lp-tk-go' : ''}`}>
              <div className="lp-tk-top">
                <small>{t('landing.tel.numero')}</small>
                <b dir="ltr">{PREFIXES[service]}-0{41 + ATTENTE_DEPART}</b>
              </div>
              <div className="lp-tk-bot">
                <IconeService type={ICONES[service]} className="size-[1.3em]" />
                <span>{noms[service]}</span>
              </div>
            </div>
            {appele && <Confettis />}
            {appele ? (
              <div className="lp-go">
                <IconeCloche className="lp-bell" />
                <span>{t('landing.tel.guichet')}</span>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-[.6em]">
                  <div className="rounded-[1em] bg-paper py-[.6em] text-center">
                    <b key={devant} className="lp-num block text-[1.45em] leading-tight">{devant}</b>
                    <span className="text-[.7em] text-muted">{t('landing.tel.devant')}</span>
                  </div>
                  <div className="rounded-[1em] bg-paper py-[.6em] text-center">
                    <b className="block text-[1.45em] leading-tight" dir="ltr">{devant * MIN_PAR_PERSONNE} min</b>
                    <span className="text-[.7em] text-muted">{t('landing.tel.attente')}</span>
                  </div>
                </div>
                <div className="h-[.6em] overflow-hidden rounded-full bg-line">
                  <div className="h-full rounded-full bg-ok transition-[width] duration-700" style={{ width: `${progres}%` }} />
                </div>
              </>
            )}
            <p className={`lp-msg ${bientot ? 'lp-msg-hot' : ''}`}>{t(message)}</p>
            <button type="button" className={`lp-btn ${appele ? 'lp-btn-ghost' : ''}`} onClick={appele ? rejouer : avancer}>
              {appele ? t('landing.tel.rejouer') : t('landing.tel.avancer')}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function Cluster() {
  const { t } = useTranslation();
  const sim = useSimulation();
  const bientot = sim.jouer && sim.devant > 0 && sim.devant <= 2;
  const minutes = (sim.jouer ? sim.devant : ATTENTE_DEPART) * MIN_PAR_PERSONNE;

  return (
    <div
      className="lp-cluster"
      role="group"
      aria-label={t('landing.tel.demo')}
      onPointerMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        e.currentTarget.style.setProperty('--mx', `${((e.clientX - r.left) / r.width) * 100}%`);
        e.currentTarget.style.setProperty('--my', `${((e.clientY - r.top) / r.height) * 100}%`);
      }}
    >
      <div className="lp-track" aria-hidden="true" />
      <div className="lp-orbit">
        {SATELLITES.map((s) => (
          <div key={s.cle} className="lp-sat" style={{ ['--a' as string]: `${s.angle}deg` }}>
            <div className="lp-sat-in">
              <div className="lp-face" role="img" aria-label={t(`landing.gens.${s.cle}.nom`)}>
                <Avatar {...AVATARS[s.cle]} />
              </div>
            </div>
          </div>
        ))}
      </div>
      <TelephoneDemo sim={sim} />

      <button type="button" className="lp-chip lp-c1" onClick={sim.rejouer}>
        <span className="lp-ico" style={{ ['--g' as string]: 'linear-gradient(145deg,#5a73ff,#1e3a8a)', ['--gs' as string]: '#1e3a8a' }}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <rect x="6" y="2" width="12" height="20" rx="3" fill="#fff" />
            <rect x="8" y="5" width="8" height="11" rx="1.6" fill="#2b3fcb" />
            <path d="M9.5 9.5h5M9.5 12h3" stroke="#fff" strokeWidth="1.3" strokeLinecap="round" />
            <circle cx="12" cy="19" r="1" fill="#2b3fcb" />
          </svg>
        </span>
        <span>
          <small>{t('landing.puce.etape')}</small>
          {t('landing.puce.telephone')}
        </span>
      </button>

      <button type="button" className="lp-chip lp-c2" onClick={sim.avancer}>
        <span className="lp-ico" style={{ ['--g' as string]: 'linear-gradient(145deg,#2fcf9b,#0c7a5c)', ['--gs' as string]: '#0c7a5c' }}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="12" r="10" fill="#fff" />
            <path d="M12 6.5V12l3.6 2.2" stroke="#0c7a5c" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </svg>
        </span>
        <span>
          <small>{t('landing.puce.attente')}</small>
          <b className="v" dir="ltr">≈ {minutes} min</b>
        </span>
      </button>

      <button type="button" className="lp-chip lp-c3" onClick={sim.alerte}>
        <span className="lp-ico" style={{ ['--g' as string]: 'linear-gradient(145deg,#ffc94d,#e08a00)', ['--gs' as string]: '#a15c00' }}>
          <IconeCloche className={bientot || sim.appele ? 'lp-bell' : ''} />
          {bientot && <i className="lp-dot" />}
        </span>
        <span>
          <small>{t('landing.puce.alerte')}</small>
          {t('landing.puce.prevenu')}
        </span>
      </button>
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

      <Cluster />
    </div>
  );
}

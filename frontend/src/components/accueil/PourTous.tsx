import { useTranslation } from 'react-i18next';

const NAVY = 'var(--color-majorelle)';
const TEINTE = 'var(--color-majorelle-tint)';
const SAFRAN = '#f5b301';
const SOL = '#e6ecf5';

function Sol() {
  return <ellipse cx="110" cy="143" rx="92" ry="6" fill={SOL} />;
}

function Visage({ cx, cy, peau }: { cx: number; cy: number; peau: string }) {
  return (
    <>
      <circle cx={cx} cy={cy} r="17" fill={peau} />
      <circle cx={cx - 6} cy={cy + 2} r="2" fill="#1b1b2f" />
      <circle cx={cx + 6} cy={cy + 2} r="2" fill="#1b1b2f" />
      <path d={`M${cx - 6} ${cy + 9}q6 5 12 0`} stroke="#1b1b2f" strokeWidth="2" strokeLinecap="round" fill="none" />
    </>
  );
}

/** J'ai un smartphone : la personne tient son téléphone, qui affiche son numéro et le temps d'attente. */
function ScenePhone() {
  return (
    <svg viewBox="0 0 220 150" className="h-auto w-full max-w-[240px]" aria-hidden="true">
      <Sol />
      <path d="M26 143c0-30 14-48 36-48s36 18 36 48z" fill="#a15c00" />
      <rect x="55" y="80" width="14" height="16" rx="5" fill="#b97d56" />
      <Visage cx={62} cy={62} peau="#b97d56" />
      <path d="M44 58c0-14 8-22 18-22s18 8 18 22c-6-6-12-9-18-9s-12 3-18 9z" fill="#222" />
      <path d="M86 104l28-16" stroke="#a15c00" strokeWidth="12" strokeLinecap="round" />
      <g transform="rotate(-8 140 84)">
        <rect x="116" y="42" width="50" height="86" rx="9" fill="#fff" stroke={NAVY} strokeWidth="3" />
        <rect x="122" y="52" width="38" height="66" rx="5" fill={TEINTE} />
        <rect x="126" y="58" width="30" height="28" rx="5" fill={NAVY} />
        <text x="141" y="76" textAnchor="middle" fontSize="9.5" fontWeight="800" fill="#fff" fontFamily="inherit">N-042</text>
        <text x="141" y="83" textAnchor="middle" fontSize="5" fill="#fff" opacity=".8" fontFamily="inherit">TICKET</text>
        <rect x="127" y="94" width="28" height="5" rx="2.5" fill="#cbd5e1" />
        <rect x="127" y="94" width="19" height="5" rx="2.5" fill="#0c7a5c" />
        <text x="141" y="110" textAnchor="middle" fontSize="7" fontWeight="700" fill={NAVY} fontFamily="inherit">≈ 8 min</text>
      </g>
      <circle cx="184" cy="36" r="17" fill={SAFRAN} />
      <path d="M184 25c-6 0-10 4-10 10 0 6-3 8-4 10h28c-1-2-4-4-4-10 0-6-4-10-10-10z" fill="#fff" />
      <circle cx="184" cy="49" r="2.6" fill="#fff" />
    </svg>
  );
}

/** Je n'ai pas de smartphone : le citoyen se présente au guichet d'accueil, l'agent lui remet un numéro. */
function SceneAccueil() {
  return (
    <svg viewBox="0 0 220 150" className="h-auto w-full max-w-[240px]" aria-hidden="true">
      <Sol />
      <path d="M12 143c0-28 12-44 30-44s30 16 30 44z" fill="#6a4bd6" />
      <rect x="35" y="86" width="14" height="14" rx="5" fill="#f2cfa8" />
      <Visage cx={42} cy={72} peau="#f2cfa8" />
      <path d="M25 68c0-13 7-21 17-21s17 8 17 21c-5-5-11-7-17-7s-12 2-17 7z" fill="#7a4a2a" />
      <circle cx="42" cy="24" r="17" fill="#fff" stroke="#e0502f" strokeWidth="3" />
      <rect x="35.5" y="13" width="13" height="22" rx="3" fill="none" stroke={NAVY} strokeWidth="2.5" />
      <path d="M30 38L54 10" stroke="#e0502f" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M134 96c0-20 7-30 19-30s19 10 19 30z" fill="#0c7a5c" />
      <path d="M135 52c0-16 7-25 18-25s18 9 18 25v10h-36z" fill="#c2418a" />
      <circle cx="153" cy="52" r="12" fill="#f0c7a0" />
      <circle cx="148.5" cy="53" r="1.8" fill="#1b1b2f" />
      <circle cx="157.5" cy="53" r="1.8" fill="#1b1b2f" />
      <path d="M149 59q4 3.5 8 0" stroke="#1b1b2f" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      <rect x="92" y="88" width="120" height="55" rx="7" fill={NAVY} />
      <rect x="88" y="82" width="128" height="11" rx="5" fill="#c7d2fe" />
      <g transform="rotate(-6 118 74)">
        <rect x="100" y="62" width="40" height="22" rx="4" fill="#fff" stroke={NAVY} strokeWidth="2.5" />
        <text x="120" y="77" textAnchor="middle" fontSize="9.5" fontWeight="800" fill={NAVY} fontFamily="inherit">N-043</text>
      </g>
    </svg>
  );
}

/** J'ai besoin d'une priorité : la personne âgée reçoit un ticket prioritaire (numéro N-P…, étoile). */
function ScenePriorite() {
  return (
    <svg viewBox="0 0 220 150" className="h-auto w-full max-w-[240px]" aria-hidden="true">
      <Sol />
      <path d="M20 143c0-28 12-44 30-44s30 16 30 44z" fill="#c2418a" />
      <rect x="43" y="86" width="14" height="14" rx="5" fill="#f0c7a0" />
      <Visage cx={50} cy={72} peau="#f0c7a0" />
      <path d="M33 68c0-13 7-21 17-21s17 8 17 21c-5-5-11-7-17-7s-12 2-17 7z" fill="#c8c8d4" />
      <path d="M86 141V108q0-12 11-12" stroke="#7a4a2a" strokeWidth="4.5" strokeLinecap="round" fill="none" />
      <circle cx="86" cy="112" r="6" fill="#f0c7a0" />
      <path d="M72 108l12 2" stroke="#c2418a" strokeWidth="10" strokeLinecap="round" />
      <g>
        <path d="M122 42h72a8 8 0 0 1 8 8v8a7 7 0 0 0 0 14v8a8 8 0 0 1-8 8h-72a8 8 0 0 1-8-8v-8a7 7 0 0 0 0-14v-8a8 8 0 0 1 8-8z" fill={SAFRAN} />
        <path d="M158 44v52" stroke="#fff" strokeWidth="2" strokeDasharray="3 4" opacity=".7" />
        <text x="136" y="73" textAnchor="middle" fontSize="13" fontWeight="800" fill="#1a1a1a" fontFamily="inherit">N-P</text>
        <text x="180" y="73" textAnchor="middle" fontSize="13" fontWeight="800" fill="#1a1a1a" fontFamily="inherit">042</text>
        <path d="M158 28l3.3 7 7.7.9-5.7 5.2 1.6 7.6-6.9-3.9-6.9 3.9 1.6-7.6-5.7-5.2 7.7-.9z" fill={NAVY} transform="translate(0 4)" />
        <rect x="128" y="84" width="60" height="6" rx="3" fill="#fff" opacity=".75" />
      </g>
    </svg>
  );
}

const PERSONNES = [
  { cle: 'p1', Scene: ScenePhone },
  { cle: 'p2', Scene: SceneAccueil },
  { cle: 'p3', Scene: ScenePriorite },
] as const;

export default function PourTous() {
  const { t } = useTranslation();
  return (
    <section className="py-12">
      <div className="lp-rv mb-7 max-w-[42ch]">
        <h2 className="text-[clamp(1.7rem,3.6vw,2.5rem)] leading-tight font-extrabold text-balance">{t('landing.tous.titre')}</h2>
        <p className="mt-2 text-muted">{t('landing.tous.sous')}</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {PERSONNES.map(({ cle, Scene }) => {
          const etapes = t(`landing.tous.${cle}s`, { returnObjects: true }) as string[];
          return (
            <article key={cle} className="lp-rv lp-person">
              <Scene />
              <h3 className="text-lg font-bold">{t(`landing.tous.${cle}t`)}</h3>
              <p className="text-muted">{t(`landing.tous.${cle}p`)}</p>
              <ol className="mt-1 grid w-full gap-2 border-t border-line pt-4">
                {etapes.map((e, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm">
                    <span className="mt-px grid size-6 shrink-0 place-items-center rounded-full bg-majorelle text-xs font-bold text-white">{i + 1}</span>
                    <span>{e}</span>
                  </li>
                ))}
              </ol>
            </article>
          );
        })}
      </div>
    </section>
  );
}

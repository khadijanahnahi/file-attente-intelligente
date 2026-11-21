import { useTranslation } from 'react-i18next';

const TRAIT = 'var(--color-majorelle)';
const TEINTE = 'var(--color-majorelle-tint)';
const SAFRAN = '#f5b301';

/** Étape 1 : choisir une démarche dans une liste (la ligne du milieu est touchée). */
function SymboleChoisir() {
  return (
    <svg viewBox="0 0 96 96" className="lp-glyph" fill="none" aria-hidden="true">
      <rect x="10" y="12" width="56" height="68" rx="12" fill={TEINTE} stroke={TRAIT} strokeWidth="3" />
      <path d="M22 28h24M22 64h18" stroke={TRAIT} strokeWidth="3" strokeLinecap="round" opacity=".55" />
      <rect x="20" y="38" width="38" height="16" rx="6" fill={TRAIT} />
      <path d="M26 46h14" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
      <circle className="lp-g-pulse" cx="62" cy="54" r="8" stroke={SAFRAN} strokeWidth="3" />
      <g className="lp-g-tap">
        <path d="M58 50v28l8-7 6 12 6-3-6-12 11-1z" fill="#fff" stroke={TRAIT} strokeWidth="3" strokeLinejoin="round" />
      </g>
    </svg>
  );
}

/** Étape 2 : donner son numéro de téléphone. */
function SymboleNumero() {
  return (
    <svg viewBox="0 0 96 96" className="lp-glyph" fill="none" aria-hidden="true">
      <rect x="22" y="8" width="44" height="80" rx="11" fill="#fff" stroke={TRAIT} strokeWidth="3" />
      <path d="M38 15h12" stroke={TRAIT} strokeWidth="3" strokeLinecap="round" opacity=".55" />
      <rect x="29" y="24" width="30" height="15" rx="5" fill={TEINTE} />
      <path d="M33 31.5h8" stroke={TRAIT} strokeWidth="3" strokeLinecap="round" />
      <rect className="lp-g-caret" x="44" y="28" width="2.5" height="7" rx="1" fill={TRAIT} />
      {[48, 58, 68].map((y) =>
        [35, 44, 53].map((x) => <circle key={`${x}-${y}`} cx={x} cy={y} r="3" fill={TRAIT} opacity=".7" />),
      )}
      <path d="M62 60h22a6 6 0 0 1 6 6v8a6 6 0 0 1-6 6H74l-7 7v-7h-5a6 6 0 0 1-6-6v-8a6 6 0 0 1 6-6z" fill={SAFRAN} stroke="#fff" strokeWidth="3" strokeLinejoin="round" />
      <circle cx="66" cy="70" r="2.2" fill="#fff" />
      <circle cx="73" cy="70" r="2.2" fill="#fff" />
      <circle cx="80" cy="70" r="2.2" fill="#fff" />
    </svg>
  );
}

/** Étape 3 : être prévenu avant son tour. */
function SymboleSuivre() {
  return (
    <svg viewBox="0 0 96 96" className="lp-glyph" fill="none" aria-hidden="true">
      <g className="lp-g-ring">
        <path d="M48 16c-14 0-22 10-22 24 0 16-6 21-9 25h62c-3-4-9-9-9-25 0-14-8-24-22-24z" fill={TEINTE} stroke={TRAIT} strokeWidth="3" strokeLinejoin="round" />
        <path d="M39 72a9 9 0 0 0 18 0" stroke={TRAIT} strokeWidth="3" strokeLinecap="round" />
        <circle cx="48" cy="11" r="3.5" fill={TRAIT} />
        <path d="M13 36q-6 9 0 18M83 36q6 9 0 18" stroke={SAFRAN} strokeWidth="3" strokeLinecap="round" />
      </g>
      <circle className="lp-g-pulse" cx="70" cy="26" r="11" fill={SAFRAN} opacity=".4" />
      <circle cx="70" cy="26" r="10" fill={SAFRAN} stroke="#fff" strokeWidth="3" />
      <path d="M65.5 26.5l3 3 6-6.5" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const ETAPES = [
  { cle: 'e1', Symbole: SymboleChoisir },
  { cle: 'e2', Symbole: SymboleNumero },
  { cle: 'e3', Symbole: SymboleSuivre },
] as const;

export default function Etapes() {
  const { t } = useTranslation();
  return (
    <section id="etapes" className="py-14">
      <h2 className="lp-rv mb-10 max-w-[20ch] text-[clamp(1.7rem,3.6vw,2.5rem)] leading-tight font-extrabold text-balance">
        {t('landing.etapes.titre')}
      </h2>
      <div className="grid gap-12 md:grid-cols-3 md:gap-10">
        {ETAPES.map(({ cle, Symbole }, i) => (
          <article key={cle} className={`lp-rv relative ${i < ETAPES.length - 1 ? 'lp-step-link' : ''}`}>
            <Symbole />
            <h3 className="mt-5 text-lg font-bold">{t(`landing.etapes.${cle}t`)}</h3>
            <p className="mt-1.5 max-w-[30ch] text-muted">{t(`landing.etapes.${cle}p`)}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

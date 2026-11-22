import type { ReactNode } from 'react';
import type { RoleAgent } from '../../api/types';

/** Éléments communs aux quatre espaces (guichet, accueil, responsable, administration) : mêmes cartes, champs, boutons. */
export const carte = 'rounded-2xl border border-line bg-white shadow-[0_1px_2px_rgb(14_34_56/0.04),0_12px_28px_-22px_rgb(14_34_56/0.35)]';
export const champ =
  'min-h-11 w-full rounded-xl border border-line bg-white px-3 text-base font-normal transition focus:border-majorelle focus:ring-4 focus:ring-majorelle/15 focus:outline-none disabled:bg-paper disabled:text-muted';
export const etiquette = 'block text-sm font-bold text-ink';
const bouton =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-5 font-bold transition hover:-translate-y-px disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50';
export const btnPrincipal = `${bouton} bg-majorelle text-white shadow-[0_10px_20px_-12px_rgb(43_63_203/0.9)] hover:brightness-110`;
export const btnSecondaire = `${bouton} border border-line bg-white text-ink hover:border-majorelle hover:text-majorelle`;
export const btnDanger = `${bouton} border border-danger/40 bg-white text-danger hover:bg-danger/5`;
export const btnGrand = 'min-h-14 text-lg';

export const STYLE_ROLE: Record<RoleAgent, { fond: string; texte: string }> = {
  GUICHET: { fond: 'bg-majorelle-tint', texte: 'text-majorelle' },
  ACCUEIL: { fond: 'bg-[#dff5e8]', texte: 'text-ok' },
  RESPONSABLE: { fond: 'bg-[#fff0d6]', texte: 'text-[#a15c00]' },
  ADMIN: { fond: 'bg-[#ece6ff]', texte: 'text-[#5b3cc4]' },
};

const TRACES: Record<RoleAgent, ReactNode> = {
  GUICHET: (
    <>
      <path d="M4 7h16v3a2 2 0 0 0 0 4v3H4v-3a2 2 0 0 0 0-4z" />
      <path d="M10 7v10" strokeDasharray="2 2.2" />
    </>
  ),
  ACCUEIL: (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6" />
      <circle cx="17.5" cy="9" r="2.5" />
      <path d="M17 14.2c2.7.3 4.5 2.2 4.5 5" />
    </>
  ),
  RESPONSABLE: <path d="M4 20V11M10 20V4M16 20v-6M2 20h20" />,
  ADMIN: (
    <>
      <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" />
      <path d="M9 12l2 2 4-4" />
    </>
  ),
};

export function IconeRole({ role, className = 'size-6' }: { role: RoleAgent; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {TRACES[role]}
    </svg>
  );
}

/** Titre de page identique pour les quatre espaces : pastille de couleur du rôle, titre, sous-titre, actions à droite. */
export function EnteteEspace({
  role, titre, sousTitre, actions,
}: { role: RoleAgent; titre: string; sousTitre?: string; actions?: ReactNode }) {
  const s = STYLE_ROLE[role];
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 pb-2">
      <div className="flex min-w-0 items-center gap-4">
        <span className={`grid size-14 shrink-0 place-items-center rounded-2xl ${s.fond} ${s.texte}`}>
          <IconeRole role={role} className="size-7" />
        </span>
        <div className="min-w-0">
          <h1 className="text-[1.75rem] leading-tight font-extrabold">{titre}</h1>
          {sousTitre && <p className="mt-0.5 text-muted">{sousTitre}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

/** Bloc de contenu avec un titre de section et, au besoin, un compteur. `centre` : titre centré dans un cadre bleu. */
export function Section({
  titre, compteur, actions, centre, children,
}: { titre: string; compteur?: number; actions?: ReactNode; centre?: boolean; children: ReactNode }) {
  return (
    <section>
      <div className={`mb-4 flex items-center gap-3 ${centre ? 'justify-center' : 'justify-between'}`}>
        {centre ? (
          <h2 className="inline-flex items-center gap-3 rounded-full border-2 border-majorelle bg-majorelle-tint px-7 py-2 text-xl font-extrabold text-majorelle">
            {titre}
            {compteur !== undefined && (
              <span className="grid min-w-7 place-items-center rounded-full bg-majorelle px-2 py-0.5 text-sm font-bold text-white tabular-nums">{compteur}</span>
            )}
          </h2>
        ) : (
          <h2 className="flex items-center gap-2 text-lg font-extrabold">
            {titre}
            {compteur !== undefined && (
              <span className="rounded-full bg-majorelle-tint px-2.5 py-0.5 text-sm font-bold text-majorelle tabular-nums">{compteur}</span>
            )}
          </h2>
        )}
        {actions}
      </div>
      {children}
    </section>
  );
}

const TONS = {
  ok: 'bg-[#dff5e8] text-ok',
  attention: 'bg-[#fff0d6] text-[#a15c00]',
  neutre: 'bg-paper text-muted',
  info: 'bg-majorelle-tint text-majorelle',
} as const;

export function Pastille({ ton, children }: { ton: keyof typeof TONS; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-bold ${TONS[ton]}`}>
      <i className="size-2 rounded-full bg-current" />
      {children}
    </span>
  );
}

export function Initiales({ nom, role, className = 'size-10' }: { nom: string; role?: RoleAgent; className?: string }) {
  const lettres = nom.split(/\s+/).filter(Boolean).slice(0, 2).map((m) => m[0]).join('').toUpperCase();
  const s = role ? STYLE_ROLE[role] : { fond: 'bg-majorelle-tint', texte: 'text-majorelle' };
  return <span className={`grid shrink-0 place-items-center rounded-full text-sm font-extrabold ${s.fond} ${s.texte} ${className}`}>{lettres}</span>;
}

/** Interrupteur accessible (remplace la case à cocher « Actif »). */
export function Interrupteur({
  actif, surChange, libelle, desactive,
}: { actif: boolean; surChange: (v: boolean) => void; libelle: string; desactive?: boolean }) {
  return (
    <button
      type="button" role="switch" aria-checked={actif} disabled={desactive} onClick={() => surChange(!actif)}
      className="flex min-h-11 items-center gap-2.5 text-sm font-bold disabled:opacity-50"
    >
      <span className={`relative h-6 w-11 rounded-full transition-colors ${actif ? 'bg-ok' : 'bg-line'}`}>
        <span className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition-all ${actif ? 'start-[1.375rem]' : 'start-0.5'}`} />
      </span>
      {libelle}
    </button>
  );
}

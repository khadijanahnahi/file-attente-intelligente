/** Icône d'un service : document (naissance), plume (légalisation), maison (résidence). */
export type TypeIcone = 'document' | 'plume' | 'maison';

const TRACES: Record<TypeIcone, React.ReactNode> = {
  document: (
    <>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5M9 13h6M9 17h4" />
    </>
  ),
  plume: (
    <>
      <path d="M4 20h16" />
      <path d="M5 16l3-1 9-9a2 2 0 0 0-3-3L5 12z" />
    </>
  ),
  maison: (
    <>
      <path d="M3 11l9-8 9 8" />
      <path d="M5 10v10h14V10M10 20v-6h4v6" />
    </>
  ),
};

/** Le préfixe de ticket identifie le service (N, L, R) ; à défaut on répartit selon la position. */
export function iconeDuService(prefixe: string, position: number): TypeIcone {
  const p = prefixe.toUpperCase();
  if (p === 'N') return 'document';
  if (p === 'L') return 'plume';
  if (p === 'R') return 'maison';
  return (['document', 'plume', 'maison'] as const)[position % 3];
}

export default function IconeService({ type, className = 'size-7' }: { type: TypeIcone; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      {TRACES[type]}
    </svg>
  );
}

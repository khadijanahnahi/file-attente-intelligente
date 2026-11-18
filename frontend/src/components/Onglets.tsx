/** Onglets accessibles (role=tablist). Le contenu actif est rendu par l'appelant. */
export default function Onglets<T extends string>({
  valeur, options, surChoix, libelle,
}: { valeur: T; options: { id: T; titre: string }[]; surChoix: (id: T) => void; libelle: string }) {
  return (
    <div role="tablist" aria-label={libelle} className="flex gap-1 overflow-x-auto border-b border-line">
      {options.map((o) => (
        <button
          key={o.id} type="button" role="tab" aria-selected={valeur === o.id}
          onClick={() => surChoix(o.id)}
          className={`-mb-px min-h-11 border-b-4 px-4 font-semibold whitespace-nowrap ${
            valeur === o.id ? 'border-majorelle text-majorelle-dark' : 'border-transparent text-muted hover:text-ink'
          }`}
        >
          {o.titre}
        </button>
      ))}
    </div>
  );
}

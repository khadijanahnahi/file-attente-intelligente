/** Onglets accessibles (role=tablist) en pastilles. Le contenu actif est rendu par l'appelant. */
export default function Onglets<T extends string>({
  valeur, options, surChoix, libelle,
}: { valeur: T; options: { id: T; titre: string }[]; surChoix: (id: T) => void; libelle: string }) {
  return (
    <div role="tablist" aria-label={libelle} className="inline-flex max-w-full gap-1 overflow-x-auto rounded-2xl border border-line bg-white p-1">
      {options.map((o) => (
        <button
          key={o.id} type="button" role="tab" aria-selected={valeur === o.id}
          onClick={() => surChoix(o.id)}
          className={`min-h-10 rounded-xl px-5 font-bold whitespace-nowrap transition-colors ${
            valeur === o.id ? 'bg-majorelle text-white shadow-sm' : 'text-muted hover:bg-majorelle-tint hover:text-majorelle'
          }`}
        >
          {o.titre}
        </button>
      ))}
    </div>
  );
}

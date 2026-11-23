import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface Message {
  texte: string;
  heure: string;
}

const hhmm = () => new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

/**
 * Historique des messages reçus, du plus récent au plus ancien, avec l'heure de réception.
 *   <MessagesRecus messages={messages} />   (messages : string[], le plus récent en premier)
 */
export default function MessagesRecus({ messages }: { messages: string[] }) {
  const { i18n } = useTranslation();
  const ar = i18n.language?.startsWith('ar');
  const [liste, setListe] = useState<Message[]>([]);
  const dernier = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (messages.length === 0 || messages[0] === dernier.current) return;
    dernier.current = messages[0];
    setListe((l) => [{ texte: messages[0], heure: hhmm() }, ...l].slice(0, 5));
  }, [messages]);

  // Messages déjà présents au premier affichage : on les montre sans heure inventée.
  const affichage: Message[] = liste.length > 0 ? liste : messages.map((texte) => ({ texte, heure: '' }));
  if (affichage.length === 0) return null;

  return (
    <section className="mt-8" aria-labelledby="titre-messages">
      <h2 id="titre-messages" className="mb-3 flex items-center gap-2 text-sm font-semibold">
        {ar ? 'الرسائل الواردة' : 'Messages reçus'}
        <span className="rounded-full bg-majorelle-tint px-2 py-0.5 text-xs font-bold text-majorelle-dark tabular-nums">
          {affichage.length}
        </span>
      </h2>
      <ol className="relative ms-3 border-s-2 border-line">
        {affichage.map((m, i) => (
          <li key={`${i}-${m.texte}`} className="relative pb-4 ps-6 last:pb-0">
            <span
              aria-hidden="true"
              className={`absolute top-1.5 -inset-s-[7px] size-3 rounded-full border-2 border-paper ${i === 0 ? 'bg-majorelle' : 'bg-line'}`}
            />
            <div className={`rounded-2xl px-4 py-3 text-sm ${i === 0 ? 'bg-sheet font-semibold shadow-[0_2px_0_var(--color-line)]' : 'bg-sheet/60 text-muted'}`}>
              <p className="text-pretty">{m.texte}</p>
              {m.heure && (
                <p className="mt-1 text-xs font-normal text-muted tabular-nums">
                  <bdi dir="ltr">{m.heure}</bdi>
                </p>
              )}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { chargeGuichets, indicateurs } from '../../api/agent';
import type { ChargeGuichet, IndicateursService } from '../../api/types';
import MessageErreur, { useTexteErreur } from '../../components/MessageErreur';
import Onglets from '../../components/Onglets';
import ServicesConfig from '../../components/ServicesConfig';
import { useTopic } from '../../hooks/useStomp';

const aujourdhui = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/** Responsable : indicateurs du jour (GET /api/dashboard/*) et configuration des services. */
export default function Tableau() {
  const { t } = useTranslation();
  const [onglet, setOnglet] = useState<'indicateurs' | 'services'>('indicateurs');
  return (
    <div className="mt-2">
      <h1 className="text-[1.75rem] leading-tight font-bold">{t('tableau.titre')}</h1>
      <div className="mt-4">
        <Onglets
          libelle={t('tableau.titre')} valeur={onglet} surChoix={setOnglet}
          options={[{ id: 'indicateurs', titre: t('tableau.indicateurs') }, { id: 'services', titre: t('tableau.services') }]}
        />
      </div>
      <div className="mt-6">{onglet === 'indicateurs' ? <Indicateurs /> : <ServicesConfig />}</div>
    </div>
  );
}

const min = (v: number | null) => (v === null ? '—' : v.toLocaleString(undefined, { maximumFractionDigits: 1 }));

function Indicateurs() {
  const { t } = useTranslation();
  const texteErreur = useTexteErreur();
  const [jour, setJour] = useState(aujourdhui);
  const [services, setServices] = useState<IndicateursService[] | null>(null);
  const [guichets, setGuichets] = useState<ChargeGuichet[]>([]);
  const [erreur, setErreur] = useState<unknown>(null);
  const minuteur = useRef<number | undefined>(undefined);

  const charger = useCallback(() => {
    Promise.all([indicateurs(jour), chargeGuichets(jour)])
      .then(([s, g]) => {
        setServices(s);
        setGuichets(g);
        setErreur(null);
      })
      .catch(setErreur);
  }, [jour]);

  useEffect(() => {
    charger();
    const id = window.setInterval(charger, 30000);
    return () => window.clearInterval(id);
  }, [charger]);
  useEffect(() => () => window.clearTimeout(minuteur.current), []);

  // Le backend prévient sur /topic/dashboard à chaque événement de file : on recharge les chiffres.
  useTopic('/topic/dashboard', () => {
    window.clearTimeout(minuteur.current);
    minuteur.current = window.setTimeout(charger, 400);
  });

  const total = services?.reduce((n, s) => n + s.nbTickets, 0) ?? 0;
  const attente = services?.reduce((n, s) => n + s.enAttente, 0) ?? 0;

  return (
    <div className="space-y-8">
      <label className="flex items-center gap-3 text-sm font-semibold">
        {t('tableau.jour')}
        <input
          type="date" value={jour} max={aujourdhui()} dir="ltr"
          onChange={(e) => e.target.value && setJour(e.target.value)}
          className="min-h-11 rounded-lg border border-line bg-sheet px-3 font-normal"
        />
      </label>

      {erreur !== null && <MessageErreur texte={texteErreur(erreur)} surReessayer={charger} />}

      {services && (
        <>
          <dl className="grid grid-cols-2 gap-4 sm:max-w-md">
            <div className="rounded-2xl bg-sheet p-4 shadow-[0_2px_0_var(--color-line)]">
              <dt className="text-sm text-muted">{t('tableau.totalTickets')}</dt>
              <dd className="text-3xl font-bold tabular-nums"><bdi dir="ltr">{total}</bdi></dd>
            </div>
            <div className="rounded-2xl bg-sheet p-4 shadow-[0_2px_0_var(--color-line)]">
              <dt className="text-sm text-muted">{t('tableau.enAttente')}</dt>
              <dd className="text-3xl font-bold tabular-nums"><bdi dir="ltr">{attente}</bdi></dd>
            </div>
          </dl>

          <section>
            <h2 className="mb-3 text-lg font-semibold">{t('tableau.parService')}</h2>
            <div className="overflow-x-auto rounded-2xl bg-sheet shadow-[0_2px_0_var(--color-line)]">
              <table className="w-full min-w-[40rem] text-start">
                <thead className="text-sm text-muted">
                  <tr className="border-b border-line">
                    <th className="p-3 text-start font-semibold">{t('tableau.service')}</th>
                    <th className="p-3 text-end font-semibold">{t('tableau.tickets')}</th>
                    <th className="p-3 text-end font-semibold">{t('tableau.enAttente')}</th>
                    <th className="p-3 text-end font-semibold">{t('tableau.attenteMoy')}</th>
                    <th className="p-3 text-end font-semibold">{t('tableau.traitementMoy')}</th>
                    <th className="p-3 text-start font-semibold">{t('tableau.abandon')}</th>
                  </tr>
                </thead>
                <tbody>
                  {services.map((s) => (
                    <tr key={s.serviceId} className="border-b border-line last:border-0">
                      <th scope="row" className="p-3 text-start font-semibold">{s.service}</th>
                      <td className="p-3 text-end tabular-nums"><bdi dir="ltr">{s.nbTickets}</bdi></td>
                      <td className="p-3 text-end tabular-nums"><bdi dir="ltr">{s.enAttente}</bdi></td>
                      <td className="p-3 text-end tabular-nums"><bdi dir="ltr">{min(s.attenteMoyenneMin)}</bdi></td>
                      <td className="p-3 text-end tabular-nums"><bdi dir="ltr">{min(s.traitementMoyenMin)}</bdi></td>
                      <td className="p-3">
                        <span className="flex items-center gap-2">
                          <span className="h-2 w-24 overflow-hidden rounded-full bg-paper" aria-hidden="true">
                            <span className="block h-full bg-saffron" style={{ width: `${Math.min(100, s.tauxAbandonPct)}%` }} />
                          </span>
                          <bdi dir="ltr" className="tabular-nums">{min(s.tauxAbandonPct)} %</bdi>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold">{t('tableau.parGuichet')}</h2>
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {guichets.map((g) => (
                <li key={g.guichetId} className="rounded-2xl bg-sheet p-4 shadow-[0_2px_0_var(--color-line)]">
                  <p className="flex items-baseline justify-between">
                    <span className="font-semibold">{t('ticket.guichet', { n: g.numero })}</span>
                    <span className={`text-sm font-semibold ${g.etat === 'OUVERT' ? 'text-ok' : 'text-muted'}`}>{t(`guichet.etat.${g.etat}`)}</span>
                  </p>
                  <p className="mt-2 text-sm text-muted">
                    {t('tableau.traites')} : <bdi dir="ltr" className="font-bold text-ink tabular-nums">{g.ticketsTraites}</bdi>
                    {' · '}
                    {t('tableau.dureeMoy')} : <bdi dir="ltr" className="font-bold text-ink tabular-nums">{min(g.dureeMoyenneMin)}</bdi>
                  </p>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}

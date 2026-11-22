import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { chargeGuichets, indicateurs } from '../../api/agent';
import type { ChargeGuichet, IndicateursService } from '../../api/types';
import MessageErreur, { useTexteErreur } from '../../components/MessageErreur';
import Onglets from '../../components/Onglets';
import ServicesConfig from '../../components/ServicesConfig';
import { useTopic } from '../../hooks/useStomp';
import { nomService } from '../../i18n/nomService';
import IconeService, { iconeDuService } from '../../components/accueil/IconeService';
import { carte, champ, Pastille, Section } from '../../components/agent/ui';

const aujourdhui = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/** Responsable : indicateurs du jour (GET /api/dashboard/*) et configuration des services. */
export default function Tableau() {
  const { t } = useTranslation();
  const [onglet, setOnglet] = useState<'indicateurs' | 'services'>('indicateurs');
  return (
    <div className="space-y-8">
      <div className="flex justify-center">
        <Onglets
          libelle={t('tableau.titre')} valeur={onglet} surChoix={setOnglet}
          options={[{ id: 'indicateurs', titre: t('tableau.indicateurs') }, { id: 'services', titre: t('tableau.services') }]}
        />
      </div>
      <div>{onglet === 'indicateurs' ? <Indicateurs /> : <ServicesConfig />}</div>
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


  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-center gap-3">
        <label className="flex items-center gap-3 text-sm font-bold">
          {t('tableau.jour')}
          <input type="date" value={jour} max={aujourdhui()} dir="ltr" onChange={(e) => e.target.value && setJour(e.target.value)} className={`${champ} w-auto`} />
        </label>
      </div>

      {erreur !== null && <MessageErreur texte={texteErreur(erreur)} surReessayer={charger} />}

      {services && (
        <>
          <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
            <Section centre titre={t('tableau.parService')} compteur={services.length}>
              <ul className="grid gap-4">
                {services.map((sv, i) => (
                  <li key={sv.serviceId} className={`${carte} p-5`}>
                    <div className="flex items-center gap-3">
                      <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-majorelle-tint text-majorelle">
                        <IconeService type={iconeDuService('', i)} className="size-6" />
                      </span>
                      <h3 className="text-lg font-extrabold">{nomService(sv.service)}</h3>
                    </div>
                    <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                      {[
                        { l: t('tableau.tickets'), v: String(sv.nbTickets), fort: false },
                        { l: t('tableau.enAttente'), v: String(sv.enAttente), fort: sv.enAttente > 0 },
                        { l: t('tableau.attenteMoy'), v: min(sv.attenteMoyenneMin), fort: false },
                        { l: t('tableau.traitementMoy'), v: min(sv.traitementMoyenMin), fort: false },
                      ].map((m) => (
                        <div key={m.l} className={`rounded-xl p-3 ${m.fort ? 'bg-[#fff0d6]' : 'bg-paper'}`}>
                          <dt className="text-xs leading-tight font-semibold text-muted">{m.l}</dt>
                          <dd className="mt-1 text-2xl leading-none font-extrabold tabular-nums"><bdi dir="ltr">{m.v}</bdi></dd>
                        </div>
                      ))}
                    </dl>
                    <div className="mt-4 flex items-center gap-3 text-sm">
                      <span className="font-semibold text-muted">{t('tableau.abandon')}</span>
                      <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-paper" aria-hidden="true">
                        <span className="block h-full rounded-full bg-saffron" style={{ width: `${Math.min(100, sv.tauxAbandonPct)}%` }} />
                      </span>
                      <bdi dir="ltr" className="font-extrabold tabular-nums">{min(sv.tauxAbandonPct)} %</bdi>
                    </div>
                  </li>
                ))}
              </ul>
            </Section>

            <Section centre titre={t('tableau.parGuichet')} compteur={guichets.length}>
              <ul className="grid gap-4">
                {guichets.map((g) => (
                  <li key={g.guichetId} className={`${carte} p-5`}>
                    <p className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-3 text-lg font-extrabold">
                        <span className="grid size-11 place-items-center rounded-xl bg-majorelle-tint text-majorelle tabular-nums">{g.numero}</span>
                        {t('ticket.guichet', { n: g.numero })}
                      </span>
                      <Pastille ton={g.etat === 'OUVERT' ? 'ok' : g.etat === 'PAUSE' ? 'attention' : 'neutre'}>{t(`guichet.etat.${g.etat}`)}</Pastille>
                    </p>
                    <dl className="mt-4 grid grid-cols-2 gap-3">
                      <div className="rounded-xl bg-paper p-3">
                        <dt className="text-xs font-semibold text-muted">{t('tableau.traites')}</dt>
                        <dd className="mt-1 text-2xl leading-none font-extrabold tabular-nums"><bdi dir="ltr">{g.ticketsTraites}</bdi></dd>
                      </div>
                      <div className="rounded-xl bg-paper p-3">
                        <dt className="text-xs font-semibold text-muted">{t('tableau.dureeMoy')}</dt>
                        <dd className="mt-1 text-2xl leading-none font-extrabold tabular-nums"><bdi dir="ltr">{min(g.dureeMoyenneMin)}</bdi></dd>
                      </div>
                    </dl>
                  </li>
                ))}
              </ul>
            </Section>
          </div>
        </>
      )}
    </div>
  );
}

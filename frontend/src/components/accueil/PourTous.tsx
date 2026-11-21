import { useTranslation } from 'react-i18next';
import Avatar, { AVATARS } from './Avatar';

const PERSONNES = [
  { cle: 'p1', avatar: 'e' },
  { cle: 'p2', avatar: 'f' },
  { cle: 'p3', avatar: 'b' },
] as const;

export default function PourTous() {
  const { t } = useTranslation();
  return (
    <section className="py-12">
      <div className="lp-rv mb-7 max-w-[42ch]">
        <h2 className="text-[clamp(1.7rem,3.6vw,2.5rem)] leading-tight font-extrabold text-balance">{t('landing.tous.titre')}</h2>
        <p className="mt-2 text-muted">{t('landing.tous.sous')}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {PERSONNES.map((p) => (
          <article key={p.cle} className="lp-rv lp-person">
            <div className="size-20 overflow-hidden rounded-full border-[3px] border-majorelle-tint">
              <Avatar {...AVATARS[p.avatar]} />
            </div>
            <h3 className="text-lg font-bold">{t(`landing.tous.${p.cle}t`)}</h3>
            <p className="text-muted">{t(`landing.tous.${p.cle}p`)}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

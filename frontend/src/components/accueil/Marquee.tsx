import { useTranslation } from 'react-i18next';

export default function Marquee() {
  const { t } = useTranslation();
  const demarches = t('landing.demarches', { returnObjects: true }) as string[];
  const ligne = [...demarches, ...demarches, ...demarches];
  return (
    <div className="lp-marq" aria-hidden="true">
      <div className="lp-marq-row">
        {[0, 1].map((k) => (
          <div key={k} className="flex">
            {ligne.map((d, i) => (
              <span key={i}>{d}</span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

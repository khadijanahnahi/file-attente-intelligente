import { useTranslation } from 'react-i18next';

const QUESTIONS = ['q1', 'q2', 'q3', 'q4'] as const;

export default function Faq() {
  const { t } = useTranslation();
  return (
    <section id="faq" className="scroll-mt-24 py-12">
      <h2 className="lp-rv mb-7 text-[clamp(1.7rem,3.6vw,2.5rem)] leading-tight font-extrabold">{t('landing.faq.titre')}</h2>
      <div className="lp-rv grid max-w-3xl gap-2.5">
        {QUESTIONS.map((q) => (
          <details key={q} className="lp-faq rounded-2xl border border-line bg-sheet px-5">
            <summary className="flex cursor-pointer justify-between gap-3 py-4 font-bold">{t(`landing.faq.${q}`)}</summary>
            <p className="pb-4 text-muted">{t(`landing.faq.${q}r`)}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

import CarteSection from '../../components/accueil/CarteSection';
import Etapes from '../../components/accueil/Etapes';
import Faq from '../../components/accueil/Faq';
import Hero from '../../components/accueil/Hero';
import PourTous from '../../components/accueil/PourTous';
import ChoixService from './ChoixService';

/** Page d'accueil du citoyen : présentation animée, puis le vrai choix de service (données du backend). */
export default function AccueilCitoyen() {
  return (
    <>
      <Hero />
      <div id="services" className="lp-rv mx-auto max-w-5xl scroll-mt-6 py-14">
        <ChoixService />
      </div>
      <Etapes />
      <CarteSection />
      <PourTous />
      <Faq />
    </>
  );
}

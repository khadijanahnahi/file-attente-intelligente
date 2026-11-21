import { Navigate, Route, Routes } from 'react-router-dom';
import AgentLayout from './components/AgentLayout';
import AccueilLayout from './components/AccueilLayout';
import CitoyenLayout from './components/CitoyenLayout';
import RequireRole, { ACCUEIL_ROLE } from './auth/RequireRole';
import { useSession } from './auth/useSession';
import AccueilCitoyen from './pages/citoyen/AccueilCitoyen';
import MonTicket from './pages/citoyen/MonTicket';
import Login from './pages/Login';
import Ecran from './pages/Ecran';
import Accueil from './pages/agent/Accueil';
import Admin from './pages/agent/Admin';
import Guichet from './pages/agent/Guichet';
import Tableau from './pages/agent/Tableau';
import NotFound from './pages/NotFound';

function RedirectionAgent() {
  const session = useSession();
  return <Navigate to={session ? ACCUEIL_ROLE[session.role] : '/connexion'} replace />;
}

export default function App() {
  return (
    <Routes>
      {/* Citoyen (public, mobile) */}
      <Route element={<AccueilLayout />}>
        <Route path="/" element={<AccueilCitoyen />} />
      </Route>
      <Route element={<CitoyenLayout />}>
        <Route path="/ticket/:id" element={<MonTicket />} />
        <Route path="*" element={<NotFound />} />
      </Route>

      {/* Écran de la salle d'attente (public, plein écran) */}
      <Route path="/ecran" element={<Ecran />} />

      {/* Agents */}
      <Route path="/connexion" element={<Login />} />
      <Route path="/agent" element={<RedirectionAgent />} />
      <Route element={<AgentLayout />}>
        <Route element={<RequireRole roles={['GUICHET']} />}>
          <Route path="/agent/guichet" element={<Guichet />} />
        </Route>
        <Route element={<RequireRole roles={['ACCUEIL']} />}>
          <Route path="/agent/accueil" element={<Accueil />} />
        </Route>
        <Route element={<RequireRole roles={['RESPONSABLE']} />}>
          <Route path="/agent/tableau" element={<Tableau />} />
        </Route>
        <Route element={<RequireRole roles={['ADMIN']} />}>
          <Route path="/agent/admin" element={<Admin />} />
        </Route>
      </Route>
    </Routes>
  );
}

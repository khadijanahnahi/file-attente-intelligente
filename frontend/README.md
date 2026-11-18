# Frontend : file d'attente intelligente

React 19 + Vite + TypeScript + Tailwind CSS 4, interface en français et en arabe (RTL automatique).

## Lancer

```bash
cd frontend
npm install
npm run dev        # http://localhost:5173
```

Le backend Spring Boot doit tourner sur le port 8080. Vite redirige `/api` et `/ws` vers lui
(voir `vite.config.ts`) : pas de CORS en développement. Autre adresse : `VITE_BACKEND_URL=http://... npm run dev`.

Autres commandes : `npm run typecheck`, `npm run build`.

## Écrans et routes

| Route | Rôle | Page | API utilisée |
|---|---|---|---|
| `/` | public | `pages/citoyen/ChoixService`, `FormulaireTicket` | `GET /api/services`, `POST /api/tickets` |
| `/ticket/:id` | public | `pages/citoyen/MonTicket` | `GET /api/tickets/{id}` + `/topic/ticket/{id}` |
| `/ecran` | public (TV de la salle) | `pages/Ecran` | `/topic/ecran`, `GET /api/services` |
| `/connexion` | public | `pages/Login` | `POST /api/auth/login` |
| `/agent/guichet` | GUICHET, ADMIN | `pages/agent/Guichet` | `/api/guichet/*` |
| `/agent/accueil` | ACCUEIL, ADMIN | `pages/agent/Accueil` | `POST /api/accueil/tickets` |
| `/agent/tableau` | RESPONSABLE, ADMIN | `pages/agent/Tableau` + `components/ServicesConfig` | `/api/dashboard/*`, `/api/config/services/*`, `/topic/dashboard` |
| `/agent/admin` | ADMIN | `pages/agent/Admin` | `/api/admin/*` |

Les règles d'accès reprennent `SecurityConfig` (`auth/RequireRole.tsx`). Le jeton JWT est gardé dans
`sessionStorage` (`api/session.ts`) et envoyé en `Authorization: Bearer`. Sur un 401 avec jeton, la session est fermée
et l'agent revient à `/connexion`. Le backend reste la vraie barrière : le frontend ne fait que masquer.

Temps réel (`api/stomp.ts`, SockJS + STOMP sur `/ws`) : `/topic/ecran`, `/topic/ticket/{id}`, `/topic/dashboard`.

## Structure

```
src/
├── api/          http.ts (fetch + JWT), session.ts, citoyen.ts, agent.ts, stomp.ts, types.ts (DTO du backend)
├── auth/         useSession, RequireRole
├── i18n/         fr.json, ar.json, index.ts (langue + sens d'écriture)
├── components/   Header, AgentLayout, CitoyenLayout, LangSwitch, TicketStub, ServicesConfig, Onglets, MessageErreur
├── hooks/        useStomp, useTicketEnCours
└── pages/        citoyen/, agent/, Ecran, Login, NotFound
```

`src/api/types.ts` recopie les records Java (`dto/*.java`) : si un DTO change, c'est le seul fichier à modifier.

## Points d'attention côté backend

1. **Pas de `GET /api/guichet/moi`.** L'agent de guichet ne peut pas relire l'état de son guichet au chargement.
   L'interface essaie cette route et, à défaut, reprend le dernier état renvoyé par ouvrir/pause/fermer.
   Ajout conseillé : dans `AgentController`,
   `@GetMapping("/moi") public GuichetView moi(@AuthenticationPrincipal AgentPrincipal a) { return GuichetView.de(guichet.guichetDe(a.id())); }`
   (rendre `guichetDe` public dans `GuichetService`, avec `@Transactional(readOnly = true)`).
2. **Annulation par le citoyen.** `POST /api/tickets/*/annuler` reste réservé aux agents. Le citoyen utilise
   `POST /api/tickets/{id}/annuler-citoyen` avec `{ "contact": "téléphone ou e-mail donné à la prise du ticket" }` :
   le backend vérifie que le contact correspond au ticket (voir `TicketService.annulerParCitoyen`).
3. **Écran de la salle.** Aucune route ne liste les tickets déjà appelés : l'écran garde ses derniers appels en mémoire
   (localStorage) à partir de `/topic/ecran`.
4. `POST /api/accueil/tickets` ne permet pas d'envoyer `URGENTE` depuis le formulaire (priorités normale/prioritaire).

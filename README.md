# file-attente-intelligente
Application web intelligente de gestion des files d’attente sur place pour les communes et bureaux d’état civil : tickets numériques, appel par guichet, estimation du temps d’attente, notifications et tableau de bord. Projet UML &amp; Design Patterns.

Projet du module **UML et Design Patterns**.

## Problème

Dans les communes et bureaux d'état civil, les citoyens attendent longtemps sans savoir quand ils seront servis, et l'administration n'a aucune statistique sur l'affluence.

## Fonctionnalités

- Prise de ticket numérique (borne, QR code, web, mobile)
- Une file par service, avec gestion des priorités
- Appel des tickets par les agents de guichet
- Écran d'affichage en temps réel
- Notifications par e-mail et push (SMS en évolution)
- Estimation du temps d'attente
- Tableau de bord pour les responsables
- Administration des utilisateurs, services et guichets

## Acteurs

Citoyen, agent d'accueil, agent de guichet, responsable, administrateur.

## Design patterns

| Pattern | Utilisation |
| --- | --- |
| Strategy | Politiques de file (FIFO, priorité) |
| Observer | Notifications et écran d'affichage |
| State | Cycle de vie du ticket |
| Factory Method | Création des tickets et des notifications |
| Command | Actions de l'agent (appeler, transférer, annuler) |

## Technologies

- **Backend :** Spring Boot (Java)
- **Frontend :** React, Vite, Tailwind CSS
- **Base de données :** PostgreSQL
- **Temps réel :** WebSocket (STOMP)
- **Sécurité :** Spring Security, JWT, BCrypt
- **Déploiement :** Docker, Docker Compose


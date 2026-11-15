# file-attente-intelligente
Application web intelligente de gestion des files d’attente sur place pour les communes et bureaux d’état civil : tickets numériques, appel par guichet, estimation du temps d’attente, notifications et tableau de bord.



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

**Strategy** :  Politiques de file (FIFO, priorité) 
**Observer** : Notifications et écran d'affichage 
**State** : Cycle de vie du ticket 
**Factory Method** : Création des tickets et des notifications 
**Command** : Actions de l'agent (appeler, transférer, annuler) 

## Technologies

- **Backend :** Spring Boot (Java)
- **Frontend :** React, Vite, Tailwind CSS
- **Base de données :** PostgreSQL
- **Temps réel :** WebSocket (STOMP)
- **Sécurité :** Spring Security, JWT, BCrypt
- **Déploiement :** Docker, Docker Compose

## Démarrer le backend en local

Le secret JWT doit être fourni par l'environnement et contenir au moins 32 caractères. Exemple PowerShell (secret de développement uniquement) :

```powershell
$env:FILES_JWT_SECRET = "secret-de-developpement-a-remplacer-123456"
$env:DB_USER = "postgres"
$env:DB_PASSWORD = "12345"
docker compose up -d db
cd backend
mvn spring-boot:run
```

Le schéma et les comptes de démonstration sont initialisés par `database/schema.sql`. Ne réutilisez pas ces comptes ni les valeurs de développement en production. Pour le déploiement, configurez aussi `CORS_ALLOWED_ORIGINS` et `WEBSOCKET_ALLOWED_ORIGINS` avec les origines exactes du frontend.


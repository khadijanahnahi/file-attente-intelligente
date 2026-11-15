-- =====================================================================
-- Gestion intelligente des files d'attente (communes et état civil)
-- Base : PostgreSQL 14+
-- Les colonnes etat / politique / priorite / role sont stockées en texte
-- (valeurs des enums) ; les objets State et Strategy sont reconstruits
-- par le code Java à la lecture.
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;   -- pour hacher les mots de passe de test (BCrypt)

-- ---------------------------------------------------------------------
-- 1. CITOYEN
-- ---------------------------------------------------------------------
CREATE TABLE citoyen (
    id          BIGSERIAL PRIMARY KEY,
    nom         VARCHAR(100),                         -- facultatif (minimisation des données, loi 09-08)
    telephone   VARCHAR(20),
    email       VARCHAR(150),
    langue      VARCHAR(2) NOT NULL DEFAULT 'fr' CHECK (langue IN ('fr', 'ar')),
    cree_le     TIMESTAMP  NOT NULL DEFAULT now(),
    CONSTRAINT citoyen_contact CHECK (telephone IS NOT NULL OR email IS NOT NULL)
);

-- ---------------------------------------------------------------------
-- 2. SERVICE (acte de naissance, légalisation, certificat de résidence...)
-- ---------------------------------------------------------------------
CREATE TABLE service (
    id                   BIGSERIAL PRIMARY KEY,
    nom                  VARCHAR(120) NOT NULL UNIQUE,
    prefixe              VARCHAR(3)   NOT NULL UNIQUE,   -- ex. N, L, R : sert à la numérotation (N-001)
    duree_moyenne_min    NUMERIC(5,2) NOT NULL DEFAULT 10 CHECK (duree_moyenne_min > 0),
    capacite_max         INT          NOT NULL DEFAULT 200 CHECK (capacite_max > 0),
    heure_ouverture      TIME         NOT NULL DEFAULT '08:30',
    heure_fermeture      TIME         NOT NULL DEFAULT '16:00',
    actif                BOOLEAN      NOT NULL DEFAULT TRUE
);

-- ---------------------------------------------------------------------
-- 3. FILE (une file par service, avec sa politique : pattern Strategy)
-- ---------------------------------------------------------------------
CREATE TABLE file_attente (
    id          BIGSERIAL PRIMARY KEY,
    service_id  BIGINT NOT NULL UNIQUE REFERENCES service(id) ON DELETE CASCADE,
    politique   VARCHAR(20) NOT NULL DEFAULT 'FIFO'
                CHECK (politique IN ('FIFO', 'PRIORITE', 'CHARGE_EQUILIBREE')),
    etat        VARCHAR(10) NOT NULL DEFAULT 'OUVERTE'
                CHECK (etat IN ('OUVERTE', 'FERMEE', 'SATUREE'))
);

-- ---------------------------------------------------------------------
-- 4. AGENT (accueil, guichet, responsable, admin)
-- ---------------------------------------------------------------------
CREATE TABLE agent (
    id            BIGSERIAL PRIMARY KEY,
    nom           VARCHAR(100) NOT NULL,
    login         VARCHAR(60)  NOT NULL UNIQUE,
    mot_de_passe  VARCHAR(100) NOT NULL,               -- haché BCrypt, jamais en clair
    role          VARCHAR(12)  NOT NULL
                  CHECK (role IN ('ACCUEIL', 'GUICHET', 'RESPONSABLE', 'ADMIN')),
    actif         BOOLEAN      NOT NULL DEFAULT TRUE
);

-- ---------------------------------------------------------------------
-- 5. GUICHET (tenu par un agent, rattaché à un service)
-- ---------------------------------------------------------------------
CREATE TABLE guichet (
    id          BIGSERIAL PRIMARY KEY,
    numero      INT    NOT NULL UNIQUE,
    etat        VARCHAR(10) NOT NULL DEFAULT 'FERME'
                CHECK (etat IN ('OUVERT', 'PAUSE', 'FERME')),
    service_id  BIGINT REFERENCES service(id),
    agent_id    BIGINT UNIQUE REFERENCES agent(id)     -- un agent tient au plus un guichet
);

-- ---------------------------------------------------------------------
-- 6. TICKET (cycle de vie : pattern State)
-- ---------------------------------------------------------------------
CREATE TABLE ticket (
    id              BIGSERIAL PRIMARY KEY,
    numero          VARCHAR(10) NOT NULL,               -- ex. N-042
    priorite        VARCHAR(12) NOT NULL DEFAULT 'NORMALE'
                    CHECK (priorite IN ('NORMALE', 'PRIORITAIRE', 'URGENTE')),
    motif_priorite  VARCHAR(30)
                    CHECK (motif_priorite IN ('PERSONNE_AGEE', 'HANDICAP', 'FEMME_ENCEINTE')),
    etat            VARCHAR(12) NOT NULL DEFAULT 'CREE'
                    CHECK (etat IN ('CREE', 'EN_ATTENTE', 'APPELE', 'EN_TRAITEMENT',
                                    'TERMINE', 'ABSENT', 'ANNULE')),
    citoyen_id      BIGINT NOT NULL REFERENCES citoyen(id),
    service_id      BIGINT NOT NULL REFERENCES service(id),
    file_id         BIGINT NOT NULL REFERENCES file_attente(id),
    guichet_id      BIGINT REFERENCES guichet(id),
    cree_par_agent  BIGINT REFERENCES agent(id),        -- renseigné si créé par l'agent d'accueil
    nb_rappels      INT       NOT NULL DEFAULT 0,
    heure_creation  TIMESTAMP NOT NULL DEFAULT now(),
    heure_appel     TIMESTAMP,
    heure_debut     TIMESTAMP,
    heure_fin       TIMESTAMP,
    CONSTRAINT ticket_chronologie CHECK (
        (heure_appel IS NULL OR heure_appel >= heure_creation) AND
        (heure_debut IS NULL OR heure_debut >= heure_appel) AND
        (heure_fin   IS NULL OR heure_fin   >= heure_creation)
    )
);

-- Numéro unique par service et par jour
CREATE UNIQUE INDEX ux_ticket_numero_jour
    ON ticket (service_id, numero, (CAST(heure_creation AS DATE)));

-- Un citoyen ne peut avoir qu'un seul ticket actif par service (CU1, scénario alternatif)
CREATE UNIQUE INDEX ux_ticket_actif_citoyen_service
    ON ticket (citoyen_id, service_id)
    WHERE etat IN ('CREE', 'EN_ATTENTE', 'APPELE', 'EN_TRAITEMENT');

-- Accélère le choix du prochain ticket et le calcul de la position
CREATE INDEX ix_ticket_file_attente
    ON ticket (file_id, priorite, heure_creation)
    WHERE etat = 'EN_ATTENTE';

CREATE INDEX ix_ticket_creation ON ticket (heure_creation);

-- ---------------------------------------------------------------------
-- 7. NOTIFICATION (pattern Factory Method pour les canaux)
-- ---------------------------------------------------------------------
CREATE TABLE notification (
    id          BIGSERIAL PRIMARY KEY,
    ticket_id   BIGINT NOT NULL REFERENCES ticket(id) ON DELETE CASCADE,
    canal       VARCHAR(6) NOT NULL CHECK (canal IN ('SMS', 'EMAIL', 'PUSH')),
    type        VARCHAR(15) NOT NULL
                CHECK (type IN ('CONFIRMATION', 'BIENTOT_APPELE', 'APPELE', 'ABSENT')),
    message     TEXT NOT NULL,
    envoye_le   TIMESTAMP NOT NULL DEFAULT now(),
    succes      BOOLEAN   NOT NULL DEFAULT TRUE
);

-- ---------------------------------------------------------------------
-- 8. STATISTIQUE (agrégats pré-calculés par jour et par service)
-- ---------------------------------------------------------------------
CREATE TABLE statistique (
    id                BIGSERIAL PRIMARY KEY,
    jour              DATE   NOT NULL,
    service_id        BIGINT NOT NULL REFERENCES service(id),
    nb_tickets        INT    NOT NULL DEFAULT 0,
    attente_moy_min   NUMERIC(6,2),
    traitement_moy_min NUMERIC(6,2),
    taux_abandon      NUMERIC(5,2),                     -- en %
    UNIQUE (jour, service_id)
);

-- ---------------------------------------------------------------------
-- 9. JOURNAL_COMMANDE (pattern Command : traçabilité et annulation)
-- ---------------------------------------------------------------------
CREATE TABLE journal_commande (
    id           BIGSERIAL PRIMARY KEY,
    type         VARCHAR(25) NOT NULL
                 CHECK (type IN ('APPELER', 'ANNULER_TICKET', 'TRANSFERER')),
    agent_id     BIGINT NOT NULL REFERENCES agent(id),
    ticket_id    BIGINT NOT NULL REFERENCES ticket(id),
    etat_avant   VARCHAR(12),
    etat_apres   VARCHAR(12),
    annulee      BOOLEAN   NOT NULL DEFAULT FALSE,
    date_action  TIMESTAMP NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- VUES pour le tableau de bord
-- ---------------------------------------------------------------------

-- Position dans la file (tickets devant soi, même file)
CREATE VIEW v_position_ticket AS
SELECT t.id AS ticket_id,
       t.numero,
       t.file_id,
       (SELECT COUNT(*)
          FROM ticket d
         WHERE d.file_id = t.file_id
           AND d.etat = 'EN_ATTENTE'
           AND d.id <> t.id
           AND ( CASE d.priorite WHEN 'URGENTE' THEN 0 WHEN 'PRIORITAIRE' THEN 1 ELSE 2 END
                 < CASE t.priorite WHEN 'URGENTE' THEN 0 WHEN 'PRIORITAIRE' THEN 1 ELSE 2 END
              OR ( d.priorite = t.priorite AND d.heure_creation < t.heure_creation ) )
       ) + 1 AS position
FROM ticket t
WHERE t.etat = 'EN_ATTENTE';

-- Indicateurs du jour par service
CREATE VIEW v_stats_jour AS
SELECT s.id   AS service_id,
       s.nom  AS service,
       COUNT(t.id)                                                   AS nb_tickets,
       COUNT(*) FILTER (WHERE t.etat = 'EN_ATTENTE')                 AS en_attente,
       ROUND(AVG(EXTRACT(EPOCH FROM (t.heure_appel - t.heure_creation)) / 60)
             FILTER (WHERE t.heure_appel IS NOT NULL)::numeric, 1)   AS attente_moy_min,
       ROUND(100.0 * COUNT(*) FILTER (WHERE t.etat IN ('ABSENT','ANNULE'))
             / NULLIF(COUNT(t.id), 0), 1)                            AS taux_abandon_pct
FROM service s
LEFT JOIN ticket t
       ON t.service_id = s.id AND CAST(t.heure_creation AS DATE) = CURRENT_DATE
GROUP BY s.id, s.nom;

-- Charge par guichet (tickets traités aujourd'hui et durée moyenne)
CREATE VIEW v_charge_guichet AS
SELECT g.id AS guichet_id,
       g.numero,
       g.etat,
       COUNT(t.id) FILTER (WHERE t.etat = 'TERMINE')                 AS traites,
       ROUND(AVG(EXTRACT(EPOCH FROM (t.heure_fin - t.heure_debut)) / 60)
             FILTER (WHERE t.etat = 'TERMINE')::numeric, 1)          AS duree_moy_min
FROM guichet g
LEFT JOIN ticket t
       ON t.guichet_id = g.id AND CAST(t.heure_creation AS DATE) = CURRENT_DATE
GROUP BY g.id, g.numero, g.etat;

-- =====================================================================
-- DONNÉES DE TEST (à retirer en production)
-- Mots de passe de test : admin123 / guichet123 (hachés en BCrypt)
-- =====================================================================
INSERT INTO service (nom, prefixe, duree_moyenne_min) VALUES
    ('Acte de naissance',           'N', 8),
    ('Légalisation de signature',   'L', 5),
    ('Certificat de résidence',     'R', 10);

INSERT INTO file_attente (service_id, politique)
SELECT id, 'PRIORITE' FROM service;

INSERT INTO agent (nom, login, mot_de_passe, role) VALUES
    ('Administrateur',      'admin',        crypt('admin123',   gen_salt('bf', 10)), 'ADMIN'),
    ('Responsable Commune', 'responsable',  crypt('admin123',   gen_salt('bf', 10)), 'RESPONSABLE'),
    ('Agent Accueil',       'accueil',      crypt('guichet123', gen_salt('bf', 10)), 'ACCUEIL'),
    ('Agent Guichet 1',     'guichet1',     crypt('guichet123', gen_salt('bf', 10)), 'GUICHET'),
    ('Agent Guichet 2',     'guichet2',     crypt('guichet123', gen_salt('bf', 10)), 'GUICHET');

INSERT INTO guichet (numero, service_id, agent_id)
SELECT 1, (SELECT id FROM service WHERE prefixe = 'N'), (SELECT id FROM agent WHERE login = 'guichet1')
UNION ALL
SELECT 2, (SELECT id FROM service WHERE prefixe = 'L'), (SELECT id FROM agent WHERE login = 'guichet2');

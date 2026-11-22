-- Corrige les colonnes d'état trop courtes (EN_TRAITEMENT = 13 caractères > VARCHAR(12)).
-- Les vues qui dépendent de ticket.etat sont supprimées puis recréées à l'identique.
BEGIN;
DROP VIEW IF EXISTS v_position_ticket, v_stats_jour, v_charge_guichet;
ALTER TABLE ticket ALTER COLUMN etat TYPE VARCHAR(15);
ALTER TABLE journal_commande ALTER COLUMN etat_avant TYPE VARCHAR(15);
ALTER TABLE journal_commande ALTER COLUMN etat_apres TYPE VARCHAR(15);

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
COMMIT;
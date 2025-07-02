-- Fix the intervention status constraint to allow all status values
-- This script will be executed automatically by Spring Boot

-- Drop the existing constraint
ALTER TABLE intervention DROP CONSTRAINT IF EXISTS intervention_statut_intervention_check;

-- Add the new constraint with all valid status values
ALTER TABLE intervention ADD CONSTRAINT intervention_statut_intervention_check 
CHECK (statut_intervention IN (
    'EN_ATTENTE', 
    'PLANIFIEE', 
    'EN_COURS', 
    'TERMINEE', 
    'ANNULEE', 
    'REJETEE', 
    'EN_PAUSE', 
    'ATTENTE_PIECES', 
    'ATTENTE_CLIENT'
));

-- Fix the contrat status constraint to allow all status values
-- Drop the existing constraint
ALTER TABLE contrat DROP CONSTRAINT IF EXISTS contrat_statut_contrat_check;

-- Add the new constraint with all valid status values from the enum
ALTER TABLE contrat ADD CONSTRAINT contrat_statut_contrat_check 
CHECK (statut_contrat IN (
    'ACTIF',
    'EXPIRE', 
    'RENOUVELE',
    'EN_ATTENTE',
    'SUSPENDU',
    'BROUILLON'
));

-- Fix the unique constraint on contrat_id in intervention table
-- This constraint is preventing multiple interventions per contract
-- which is incorrect business logic

-- Drop the unique constraint on contrat_id
ALTER TABLE intervention DROP CONSTRAINT IF EXISTS ukctn8le7ocxkapu6eov8j9vsar;

-- Also drop any other potential unique constraints on contrat_id
ALTER TABLE intervention DROP CONSTRAINT IF EXISTS uk_contrat_id;
ALTER TABLE intervention DROP CONSTRAINT IF EXISTS intervention_contrat_id_key;

-- Insert sample data for testing (only if tables are empty)
-- Sample clients (users with role CLIENT)
INSERT INTO utilisateur (nom, prenom, email, telephone, mot_de_passe, role) 
SELECT 'Entreprise A', 'Contact', 'contact@entreprisea.com', '+33123456789', '$2a$10$DummyHashedPassword', 'CLIENT'
WHERE NOT EXISTS (SELECT 1 FROM utilisateur WHERE email = 'contact@entreprisea.com');

INSERT INTO utilisateur (nom, prenom, email, telephone, mot_de_passe, role) 
SELECT 'Société B', 'Manager', 'manager@societeb.com', '+33987654321', '$2a$10$DummyHashedPassword', 'CLIENT'
WHERE NOT EXISTS (SELECT 1 FROM utilisateur WHERE email = 'manager@societeb.com');

INSERT INTO utilisateur (nom, prenom, email, telephone, mot_de_passe, role) 
SELECT 'Groupe C', 'Admin', 'admin@groupec.com', '+33456789123', '$2a$10$DummyHashedPassword', 'CLIENT'
WHERE NOT EXISTS (SELECT 1 FROM utilisateur WHERE email = 'admin@groupec.com');

-- Sample contracts with different statuses
INSERT INTO contrat (numero_contrat, date_debut, date_fin, statut_contrat, conditions_contrat, client_id)
SELECT 'CNT-2024-001', '2024-01-01', '2024-12-31', 'ACTIF', '<p>Contrat de maintenance standard</p>', 
       (SELECT id FROM utilisateur WHERE email = 'contact@entreprisea.com' LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM contrat WHERE numero_contrat = 'CNT-2024-001');

INSERT INTO contrat (numero_contrat, date_debut, date_fin, statut_contrat, conditions_contrat, client_id)
SELECT 'CNT-2024-002', '2024-02-01', '2025-01-31', 'ACTIF', '<p>Contrat maintenance premium</p>', 
       (SELECT id FROM utilisateur WHERE email = 'manager@societeb.com' LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM contrat WHERE numero_contrat = 'CNT-2024-002');

INSERT INTO contrat (numero_contrat, date_debut, date_fin, statut_contrat, conditions_contrat, client_id)
SELECT 'CNT-2023-015', '2023-06-01', '2024-05-31', 'EXPIRE', '<p>Contrat maintenance expiré</p>', 
       (SELECT id FROM utilisateur WHERE email = 'admin@groupec.com' LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM contrat WHERE numero_contrat = 'CNT-2023-015');

INSERT INTO contrat (numero_contrat, date_debut, date_fin, statut_contrat, conditions_contrat, client_id)
SELECT 'CNT-2024-003', '2024-06-01', '2025-05-31', 'ACTIF', '<p>Contrat en cours de validation</p>', 
       (SELECT id FROM utilisateur WHERE email = 'contact@entreprisea.com' LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM contrat WHERE numero_contrat = 'CNT-2024-003');

INSERT INTO contrat (numero_contrat, date_debut, date_fin, statut_contrat, conditions_contrat, client_id)
SELECT 'CNT-2024-004', '2024-03-01', '2025-02-28', 'RENOUVELE', '<p>Contrat renouvelé</p>', 
       (SELECT id FROM utilisateur WHERE email = 'manager@societeb.com' LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM contrat WHERE numero_contrat = 'CNT-2024-004');

-- Add more active contracts for pagination testing
INSERT INTO contrat (numero_contrat, date_debut, date_fin, statut_contrat, conditions_contrat, client_id)
SELECT 'CNT-2024-005', '2024-04-01', '2025-03-31', 'ACTIF', '<p>Contrat maintenance base</p>', 
       (SELECT id FROM utilisateur WHERE email = 'contact@entreprisea.com' LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM contrat WHERE numero_contrat = 'CNT-2024-005');

INSERT INTO contrat (numero_contrat, date_debut, date_fin, statut_contrat, conditions_contrat, client_id)
SELECT 'CNT-2024-006', '2024-05-01', '2025-04-30', 'ACTIF', '<p>Contrat maintenance avancé</p>', 
       (SELECT id FROM utilisateur WHERE email = 'admin@groupec.com' LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM contrat WHERE numero_contrat = 'CNT-2024-006');

INSERT INTO contrat (numero_contrat, date_debut, date_fin, statut_contrat, conditions_contrat, client_id)
SELECT 'CNT-2024-007', '2024-07-01', '2025-06-30', 'ACTIF', '<p>Contrat maintenance complète</p>', 
       (SELECT id FROM utilisateur WHERE email = 'manager@societeb.com' LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM contrat WHERE numero_contrat = 'CNT-2024-007');

INSERT INTO contrat (numero_contrat, date_debut, date_fin, statut_contrat, conditions_contrat, client_id)
SELECT 'CNT-2024-008', '2024-08-01', '2025-07-31', 'ACTIF', '<p>Contrat maintenance étendue</p>', 
       (SELECT id FROM utilisateur WHERE email = 'contact@entreprisea.com' LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM contrat WHERE numero_contrat = 'CNT-2024-008');

INSERT INTO contrat (numero_contrat, date_debut, date_fin, statut_contrat, conditions_contrat, client_id)
SELECT 'CNT-2024-009', '2024-09-01', '2025-08-31', 'ACTIF', '<p>Contrat maintenance totale</p>', 
       (SELECT id FROM utilisateur WHERE email = 'admin@groupec.com' LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM contrat WHERE numero_contrat = 'CNT-2024-009');

INSERT INTO contrat (numero_contrat, date_debut, date_fin, statut_contrat, conditions_contrat, client_id)
SELECT 'CNT-2024-010', '2024-10-01', '2025-09-30', 'ACTIF', '<p>Contrat maintenance globale</p>', 
       (SELECT id FROM utilisateur WHERE email = 'manager@societeb.com' LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM contrat WHERE numero_contrat = 'CNT-2024-010');

INSERT INTO contrat (numero_contrat, date_debut, date_fin, statut_contrat, conditions_contrat, client_id)
SELECT 'CNT-2024-011', '2024-11-01', '2025-10-31', 'ACTIF', '<p>Contrat maintenance intégrale</p>', 
       (SELECT id FROM utilisateur WHERE email = 'contact@entreprisea.com' LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM contrat WHERE numero_contrat = 'CNT-2024-011');

INSERT INTO contrat (numero_contrat, date_debut, date_fin, statut_contrat, conditions_contrat, client_id)
SELECT 'CNT-2024-012', '2024-12-01', '2025-11-30', 'ACTIF', '<p>Contrat maintenance universelle</p>', 
       (SELECT id FROM utilisateur WHERE email = 'admin@groupec.com' LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM contrat WHERE numero_contrat = 'CNT-2024-012');

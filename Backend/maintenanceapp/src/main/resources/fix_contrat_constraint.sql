-- Fix the contrat status constraint to include all valid status values
-- This script should be executed manually on the PostgreSQL database

-- Drop the existing constraint if it exists
ALTER TABLE contrat DROP CONSTRAINT IF EXISTS contrat_statut_contrat_check;

-- Add the new constraint with all valid statut values from the enum
ALTER TABLE contrat ADD CONSTRAINT contrat_statut_contrat_check
    CHECK (statut_contrat IN (
                              'ACTIF',
                              'EXPIRE',
                              'RENOUVELE',
                              'EN_ATTENTE',
                              'SUSPENDU',
                              'BROUILLON'
        ));

-- Verify the constraint was created
SELECT con.conname, pg_get_constraintdef(con.oid)
FROM pg_constraint con
         INNER JOIN pg_class rel ON rel.oid = con.conrelid
WHERE rel.relname = 'contrat' AND con.contype = 'c' AND con.conname = 'contrat_statut_contrat_check';

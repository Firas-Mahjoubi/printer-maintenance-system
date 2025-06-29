-- Fix the statut_intervention check constraint to include EN_PAUSE and other missing values
-- This script should be run manually on the PostgreSQL database

-- First, drop the existing constraint
ALTER TABLE intervention DROP CONSTRAINT IF EXISTS intervention_statut_intervention_check;

-- Add the new constraint with all valid statut values
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
    'ATTENTE_CLIENT',
    'REPORTEE'
));

-- Verify the constraint was created
SELECT con.conname, pg_get_constraintdef(con.oid) 
FROM pg_constraint con 
INNER JOIN pg_class rel ON rel.oid = con.conrelid 
WHERE rel.relname = 'intervention' AND con.contype = 'c';

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

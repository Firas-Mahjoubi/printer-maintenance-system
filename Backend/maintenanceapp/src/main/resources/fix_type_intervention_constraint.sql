-- Fix the intervention type_intervention constraint to allow all valid types
-- This script will be executed automatically by Spring Boot on startup

-- First, drop the existing constraint if it exists
ALTER TABLE intervention DROP CONSTRAINT IF EXISTS intervention_type_intervention_check;

-- Add the new constraint with all valid type values from the TypeIntervention enum
ALTER TABLE intervention ADD CONSTRAINT intervention_type_intervention_check 
CHECK (type_intervention IN (
    'PREVENTIVE',
    'CORRECTIVE',
    'URGENTE',
    'INSTALLATION',
    'MISE_A_JOUR',
    'DIAGNOSTIC',
    'FORMATION',
    'NETTOYAGE',
    'MAINTENANCE'
));

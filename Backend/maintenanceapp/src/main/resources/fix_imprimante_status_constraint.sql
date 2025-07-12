-- Fix the imprimante status constraint to include EN_PANNE
-- This script should be run manually on the PostgreSQL database or added to data.sql

-- First, drop the existing constraint
ALTER TABLE imprimante DROP CONSTRAINT IF EXISTS imprimante_status_check;

-- Add the new constraint with all valid status values including EN_PANNE
ALTER TABLE imprimante ADD CONSTRAINT imprimante_status_check 
CHECK (status IN (
    'ACTIF', 
    'EN_PANNE',
    'EN_MAINTENANCE', 
    'HORS_SERVICE'
));

-- Verify the constraint was added successfully
-- SELECT conname, consrc FROM pg_constraint WHERE conrelid = 'imprimante'::regclass;

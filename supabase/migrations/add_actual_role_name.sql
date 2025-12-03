-- Migration: Add actual_role_name column to role_mappings table
-- Execute this in Supabase SQL Editor

-- 1. Add actual_role_name column to role_mappings table
ALTER TABLE role_mappings
ADD COLUMN IF NOT EXISTS actual_role_name TEXT;

-- 2. Add comment for documentation
COMMENT ON COLUMN role_mappings.actual_role_name IS 'Actual role name as it appears in CSV files (e.g., FOH, BOH)';


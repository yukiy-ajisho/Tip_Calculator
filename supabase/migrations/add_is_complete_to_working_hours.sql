-- Migration: Add is_complete column to formatted_working_hours table
-- Execute this in Supabase SQL Editor

-- 1. Add is_complete column to formatted_working_hours table
ALTER TABLE formatted_working_hours
ADD COLUMN IF NOT EXISTS is_complete BOOLEAN NOT NULL DEFAULT false;

-- 2. Initialize is_complete for existing records based on current completeness
-- is_complete = true if all required fields (date, start, end, role) are present
UPDATE formatted_working_hours
SET is_complete = (
  date IS NOT NULL 
  AND start IS NOT NULL 
  AND end IS NOT NULL 
  AND role IS NOT NULL 
  AND role != ''
);

-- 3. Add comment for documentationå
COMMENT ON COLUMN formatted_working_hours.is_complete IS 'Current completeness status (updated on edit). True if all required fields are present.';
COMMENT ON COLUMN formatted_working_hours.is_complete_on_import IS 'Completeness status at import time (never changed). Used for orange highlighting.';


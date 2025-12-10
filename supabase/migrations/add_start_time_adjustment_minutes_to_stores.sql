-- Migration: Add start_time_adjustment_minutes column to stores table
-- Execute this in Supabase SQL Editor
-- This column stores the number of minutes to subtract from start time during calculation

-- Add start_time_adjustment_minutes column
ALTER TABLE stores
ADD COLUMN IF NOT EXISTS start_time_adjustment_minutes INTEGER DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN stores.start_time_adjustment_minutes IS 'Number of minutes to subtract from start time during tip calculation. For example, if set to 10, a start time of 10:00:00 will be treated as 09:50:00 in calculations. NULL means no adjustment.';


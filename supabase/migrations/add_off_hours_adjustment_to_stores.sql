-- Migration: Add off-hours adjustment columns to stores table
-- Execute this in Supabase SQL Editor

-- Add off_hours_adjustment_before_hours column
ALTER TABLE stores
ADD COLUMN IF NOT EXISTS off_hours_adjustment_before_hours INTEGER DEFAULT NULL;

-- Add off_hours_adjustment_after_hours column
ALTER TABLE stores
ADD COLUMN IF NOT EXISTS off_hours_adjustment_after_hours INTEGER DEFAULT NULL;

-- Add comments for documentation
COMMENT ON COLUMN stores.off_hours_adjustment_before_hours IS 'Number of hours to add to the earliest start time when adjusting tips that occur before business hours. NULL means no adjustment.';
COMMENT ON COLUMN stores.off_hours_adjustment_after_hours IS 'Number of hours to subtract from the latest end time when adjusting tips that occur after business hours. NULL means no adjustment.';


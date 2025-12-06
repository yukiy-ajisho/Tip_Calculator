-- Migration: Add original_payment_time and is_adjusted columns to formatted_tip_data table
-- Execute this in Supabase SQL Editor

-- Add original_payment_time column
ALTER TABLE formatted_tip_data
ADD COLUMN IF NOT EXISTS original_payment_time TIME DEFAULT NULL;

-- Add is_adjusted column
ALTER TABLE formatted_tip_data
ADD COLUMN IF NOT EXISTS is_adjusted BOOLEAN NOT NULL DEFAULT FALSE;

-- Add comments for documentation
COMMENT ON COLUMN formatted_tip_data.original_payment_time IS 'Original payment time before adjustment. NULL if not adjusted.';
COMMENT ON COLUMN formatted_tip_data.is_adjusted IS 'Indicates if the payment_time has been adjusted (automatically or manually).';


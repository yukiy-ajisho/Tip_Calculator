-- Add archived_at column to tip_calculation_results table
ALTER TABLE tip_calculation_results
ADD COLUMN archived_at TIMESTAMP WITH TIME ZONE;
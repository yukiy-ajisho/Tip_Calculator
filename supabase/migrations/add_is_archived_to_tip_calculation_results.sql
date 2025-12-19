-- Add is_archived column to tip_calculation_results table
ALTER TABLE tip_calculation_results
ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN tip_calculation_results.is_archived IS 
'Indicates whether the record has been archived. Archived records are hidden from the main view but not deleted.';


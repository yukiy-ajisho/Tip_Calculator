-- Migration: Create revert_calculation function
-- Execute this in Supabase SQL Editor
-- This function reverts a completed calculation back to processing status
-- It deletes tip_calculation_results and updates tip_calculations status in a transaction

CREATE OR REPLACE FUNCTION revert_calculation(
  p_calculation_id UUID
) RETURNS UUID AS $$
DECLARE
  v_stores_id UUID;
  v_status TEXT;
BEGIN
  -- Step 1: Get calculation record and verify status
  SELECT stores_id, status
  INTO v_stores_id, v_status
  FROM tip_calculations
  WHERE id = p_calculation_id;

  -- Error check: calculation record not found
  IF v_stores_id IS NULL THEN
    RAISE EXCEPTION 'Calculation not found for calculation_id: %', p_calculation_id;
  END IF;

  -- Error check: status must be 'completed'
  IF v_status IS NULL OR v_status != 'completed' THEN
    RAISE EXCEPTION 'Calculation status must be ''completed'' to revert. Current status: %', COALESCE(v_status, 'NULL');
  END IF;

  -- Step 2: Delete tip_calculation_results (within transaction)
  DELETE FROM tip_calculation_results
  WHERE calculation_id = p_calculation_id;

  -- Step 3: Update tip_calculations status to 'processing' (within transaction)
  UPDATE tip_calculations
  SET status = 'processing',
      updated_at = NOW()
  WHERE id = p_calculation_id;

  -- Step 4: Return stores_id for frontend redirect
  RETURN v_stores_id;

EXCEPTION
  WHEN OTHERS THEN
    -- Re-raise the exception (transaction will be rolled back automatically)
    RAISE;
END;
$$ LANGUAGE plpgsql;

-- Add comment for documentation
COMMENT ON FUNCTION revert_calculation(UUID) IS 
'Reverts a completed calculation back to processing status. 
Deletes tip_calculation_results and updates tip_calculations status in a transaction.
Returns stores_id for frontend redirect.
Raises exception if calculation not found or status is not ''completed''.';


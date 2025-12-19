-- Migration: Create calculate_tips_v5_total_hours_test function
-- Execute this in Supabase SQL Editor
-- This function calculates total working minutes for each employee per date
-- Based on v5 logic (no start_time_adjustment_minutes)
-- Returns results grouped by date (employee x date)

CREATE OR REPLACE FUNCTION calculate_tips_v5_total_hours_test(
  p_calculation_id UUID,
  p_store_id UUID
) RETURNS TABLE(
  name TEXT,
  date DATE,
  total_minutes NUMERIC
) AS $$
DECLARE
  v_period_start DATE;
  v_period_end DATE;
  v_working_hour_record RECORD;
  v_employee_name TEXT;
  v_date DATE;
  v_minutes NUMERIC;
  v_employee_hours JSONB := '{}'::JSONB;
  v_date_str TEXT;
  v_total_minutes_for_date NUMERIC;
BEGIN
  -- Step 0: Retrieve period information from tip_calculations table
  SELECT period_start, period_end
  INTO v_period_start, v_period_end
  FROM tip_calculations
  WHERE id = p_calculation_id;

  -- Error check: calculation record not found or period information is missing
  IF v_period_start IS NULL OR v_period_end IS NULL THEN
    RAISE EXCEPTION 'Invalid calculation record or missing period information for calculation_id: %', p_calculation_id;
  END IF;

  -- Step 1: Process each working hour record
  -- Calculate working minutes for each employee per date
  FOR v_working_hour_record IN
    SELECT
      formatted_working_hours.name as employee_name,
      formatted_working_hours.date,
      formatted_working_hours.start as start_time,
      formatted_working_hours."end" as end_time
    FROM formatted_working_hours
    WHERE formatted_working_hours.stores_id = p_store_id
      AND formatted_working_hours.date >= v_period_start
      AND formatted_working_hours.date <= v_period_end
      AND formatted_working_hours.start IS NOT NULL
      AND formatted_working_hours."end" IS NOT NULL
      AND formatted_working_hours.is_complete = true
  LOOP
    v_employee_name := v_working_hour_record.employee_name;
    v_date := v_working_hour_record.date;
    v_date_str := v_date::TEXT;

    -- Calculate working minutes (no start-time adjustment in v5)
    v_minutes := EXTRACT(EPOCH FROM (v_working_hour_record.end_time::TIME - v_working_hour_record.start_time::TIME)) / 60;

    -- Initialize employee if not exists
    IF NOT (v_employee_hours ? v_employee_name) THEN
      v_employee_hours := v_employee_hours || jsonb_build_object(v_employee_name, '{}'::jsonb);
    END IF;

    -- Initialize date for employee if not exists
    IF NOT ((v_employee_hours->v_employee_name)::jsonb ? v_date_str) THEN
      v_employee_hours := v_employee_hours || jsonb_set(
        v_employee_hours,
        ARRAY[v_employee_name],
        (v_employee_hours->v_employee_name)::jsonb || jsonb_build_object(v_date_str, 0)
      );
    END IF;

    -- Add minutes (sum if multiple shifts on the same day)
    v_total_minutes_for_date := COALESCE(((v_employee_hours->v_employee_name->v_date_str))::NUMERIC, 0);
    v_employee_hours := v_employee_hours || jsonb_set(
      v_employee_hours,
      ARRAY[v_employee_name, v_date_str],
      to_jsonb(v_total_minutes_for_date + v_minutes)
    );
  END LOOP;

  -- Step 2: Return results as TABLE (employee x date)
  FOR v_employee_name IN SELECT jsonb_object_keys(v_employee_hours)
  LOOP
    FOR v_date_str IN SELECT jsonb_object_keys(v_employee_hours->v_employee_name)
    LOOP
      v_total_minutes_for_date := COALESCE(((v_employee_hours->v_employee_name->v_date_str))::NUMERIC, 0);

      RETURN QUERY SELECT
        v_employee_name::TEXT,
        v_date_str::DATE,
        TRUNC(v_total_minutes_for_date, 2);
    END LOOP;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Add comment for documentation
COMMENT ON FUNCTION calculate_tips_v5_total_hours_test(UUID, UUID) IS
'Test function that calculates total working minutes for each employee per date.
Based on v5 logic (no start_time_adjustment_minutes support, uses raw working hours).
If an employee has multiple shifts on the same day, the minutes are summed.
Use this for testing in SQL Editor:
  SELECT * FROM calculate_tips_v5_total_hours_test(''calculation-id'', ''store-id'');
Returns results grouped by date (employee x date).';


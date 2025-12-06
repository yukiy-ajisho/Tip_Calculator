-- Migration: Create adjust_off_hours_tips function
-- Execute this in Supabase SQL Editor
-- This function adjusts tip payment times that occur outside business hours

CREATE OR REPLACE FUNCTION adjust_off_hours_tips(
  p_store_id UUID,
  p_period_start DATE,
  p_period_end DATE
) RETURNS VOID AS $$
DECLARE
  v_before_hours INTEGER;
  v_after_hours INTEGER;
  v_tip_record RECORD;
  v_date DATE;
  v_earliest_start TIME;
  v_latest_end TIME;
  v_adjusted_time TIME;
  v_has_working_hours BOOLEAN;
  v_calculated_timestamp TIMESTAMP;
BEGIN
  -- Step 1: Get store adjustment settings
  SELECT 
    off_hours_adjustment_before_hours,
    off_hours_adjustment_after_hours
  INTO 
    v_before_hours,
    v_after_hours
  FROM stores
  WHERE id = p_store_id;

  -- Step 2: Early return if both settings are NULL (no adjustment needed)
  IF v_before_hours IS NULL AND v_after_hours IS NULL THEN
    RETURN;
  END IF;

  -- Step 3: Check if formatted_working_hours exists for the period
  SELECT EXISTS(
    SELECT 1
    FROM formatted_working_hours
    WHERE stores_id = p_store_id
      AND date >= p_period_start
      AND date <= p_period_end
  ) INTO v_has_working_hours;

  -- Step 4: Early return if no working hours data exists
  IF NOT v_has_working_hours THEN
    RETURN;
  END IF;

  -- Step 5: Process each date in the period
  FOR v_date IN 
    SELECT DISTINCT order_date::DATE
    FROM formatted_tip_data
    WHERE stores_id = p_store_id
      AND order_date >= p_period_start
      AND order_date <= p_period_end
      AND payment_time IS NOT NULL
      AND (is_adjusted = FALSE OR original_payment_time IS NULL)
  LOOP
    -- Step 6: Get earliest start and latest end for this date
    SELECT 
      MIN(start)::TIME,
      MAX("end")::TIME
    INTO 
      v_earliest_start,
      v_latest_end
    FROM formatted_working_hours
    WHERE stores_id = p_store_id
      AND date = v_date
      AND start IS NOT NULL
      AND "end" IS NOT NULL;

    -- Step 7: Skip if no working hours for this date
    IF v_earliest_start IS NULL OR v_latest_end IS NULL THEN
      CONTINUE;
    END IF;

    -- Step 8: Process tips that occur before business hours
    IF v_before_hours IS NOT NULL THEN
      FOR v_tip_record IN
        SELECT id, payment_time
        FROM formatted_tip_data
        WHERE stores_id = p_store_id
          AND order_date = v_date
          AND payment_time IS NOT NULL
          AND payment_time::TIME < v_earliest_start
          AND (is_adjusted = FALSE OR original_payment_time IS NULL)
      LOOP
        -- Calculate adjusted time: earliest_start + before_hours (in minutes)
        -- Use TIMESTAMP arithmetic to handle overflow correctly
        v_calculated_timestamp := (v_date + v_earliest_start + (v_before_hours || ' minutes')::INTERVAL);
        v_adjusted_time := v_calculated_timestamp::TIME;
        
        -- If the calculated time is on the next day (overflow), clamp to 23:59:59
        -- Check if the date part changed (indicating overflow)
        IF (v_calculated_timestamp::DATE) > v_date THEN
          v_adjusted_time := TIME '23:59:59';
        ELSIF v_adjusted_time < TIME '00:00:00' THEN
          v_adjusted_time := TIME '00:00:00';
        ELSIF v_adjusted_time > TIME '23:59:59' THEN
          v_adjusted_time := TIME '23:59:59';
        END IF;

        -- Update the record
        UPDATE formatted_tip_data
        SET 
          original_payment_time = v_tip_record.payment_time,
          payment_time = v_adjusted_time,
          is_adjusted = TRUE
        WHERE id = v_tip_record.id;
      END LOOP;
    END IF;

    -- Step 9: Process tips that occur after business hours
    IF v_after_hours IS NOT NULL THEN
      FOR v_tip_record IN
        SELECT id, payment_time
        FROM formatted_tip_data
        WHERE stores_id = p_store_id
          AND order_date = v_date
          AND payment_time IS NOT NULL
          AND payment_time::TIME > v_latest_end
          AND (is_adjusted = FALSE OR original_payment_time IS NULL)
      LOOP
        -- Calculate adjusted time: latest_end - after_hours (in minutes)
        -- Use TIMESTAMP arithmetic to handle underflow correctly
        v_calculated_timestamp := (v_date + v_latest_end - (v_after_hours || ' minutes')::INTERVAL);
        v_adjusted_time := v_calculated_timestamp::TIME;
        
        -- If the calculated time is on the previous day (underflow), clamp to 00:00:00
        -- Check if the date part changed (indicating underflow)
        IF (v_calculated_timestamp::DATE) < v_date THEN
          v_adjusted_time := TIME '00:00:00';
        ELSIF v_adjusted_time < TIME '00:00:00' THEN
          v_adjusted_time := TIME '00:00:00';
        ELSIF v_adjusted_time > TIME '23:59:59' THEN
          v_adjusted_time := TIME '23:59:59';
        END IF;

        -- Update the record
        UPDATE formatted_tip_data
        SET 
          original_payment_time = v_tip_record.payment_time,
          payment_time = v_adjusted_time,
          is_adjusted = TRUE
        WHERE id = v_tip_record.id;
      END LOOP;
    END IF;
  END LOOP;

END;
$$ LANGUAGE plpgsql;

-- Add comment for documentation
COMMENT ON FUNCTION adjust_off_hours_tips(UUID, DATE, DATE) IS
'Adjusts tip payment times that occur outside business hours.
If a tip occurs before the earliest employee start time, adjusts it to earliest_start + before_hours (in minutes).
If a tip occurs after the latest employee end time, adjusts it to latest_end - after_hours (in minutes).
before_hours and after_hours are stored in minutes (0-1440 minutes = 0-24 hours).
Only processes tips where is_adjusted = FALSE or original_payment_time IS NULL.
Returns early if both adjustment settings are NULL or if no working hours data exists.
Time values are clamped to valid TIME range (00:00:00 to 23:59:59) if calculation exceeds bounds.';

-- Migration: Create adjust_off_hours_tips function (v3)
-- Purpose: Clamp tip payment times to store business start/end times
-- Interpretation:
--   - off_hours_adjustment_before_hours: business start time
--   - off_hours_adjustment_after_hours:  business end time
--   - Values <= 24 are treated as hours and converted to minutes; otherwise treated as minutes.
--   - NULL means "do not clamp" on that side.
-- Behavior:
--   - payment_time < business_start -> set to business_start
--   - payment_time > business_end   -> set to business_end
--   - original_payment_time stores the prior value; is_adjusted is set TRUE when changed.

CREATE OR REPLACE FUNCTION adjust_off_hours_tips(
  p_store_id UUID,
  p_period_start DATE,
  p_period_end DATE
) RETURNS VOID AS $$
DECLARE
  v_start_minutes INTEGER;
  v_end_minutes INTEGER;
  v_start_time TIME;
  v_end_time TIME;
  v_tip RECORD;
  v_new_time TIME;
BEGIN
  -- Fetch store settings
  SELECT
    off_hours_adjustment_before_hours,
    off_hours_adjustment_after_hours
  INTO
    v_start_minutes,
    v_end_minutes
  FROM stores
  WHERE id = p_store_id;

  -- If no settings, nothing to do
  IF v_start_minutes IS NULL AND v_end_minutes IS NULL THEN
    RETURN;
  END IF;

  -- Normalize to minutes (<=24 means hours)
  IF v_start_minutes IS NOT NULL THEN
    IF v_start_minutes <= 24 THEN
      v_start_minutes := v_start_minutes * 60;
    END IF;
    v_start_minutes := GREATEST(0, LEAST(v_start_minutes, 24 * 60));
    v_start_time := (make_interval(mins => v_start_minutes))::TIME;
  END IF;

  IF v_end_minutes IS NOT NULL THEN
    IF v_end_minutes <= 24 THEN
      v_end_minutes := v_end_minutes * 60;
    END IF;
    v_end_minutes := GREATEST(0, LEAST(v_end_minutes, 24 * 60));
    v_end_time := (make_interval(mins => v_end_minutes))::TIME;
  END IF;

  -- Process tips in the period with payment_time present and not yet adjusted
  FOR v_tip IN
    SELECT id, payment_time
    FROM formatted_tip_data
    WHERE stores_id = p_store_id
      AND order_date >= p_period_start
      AND order_date <= p_period_end
      AND payment_time IS NOT NULL
      AND (is_adjusted = FALSE OR original_payment_time IS NULL)
  LOOP
    v_new_time := v_tip.payment_time::TIME;

    IF v_start_time IS NOT NULL AND v_new_time < v_start_time THEN
      v_new_time := v_start_time;
    END IF;

    IF v_end_time IS NOT NULL AND v_new_time > v_end_time THEN
      v_new_time := v_end_time;
    END IF;

    -- Apply only if changed
    IF v_new_time <> v_tip.payment_time::TIME THEN
      UPDATE formatted_tip_data
      SET
        original_payment_time = payment_time,
        payment_time = v_new_time,
        is_adjusted = TRUE
      WHERE id = v_tip.id;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION adjust_off_hours_tips(UUID, DATE, DATE) IS
'Clamp tip payment times to store business start/end times.
Interpret off_hours_adjustment_before_hours/after_hours as absolute times from 00:00:
- <=24 => hours, converted to minutes; >24 => minutes as-is; clamped to 0-1440.
- NULL means no clamp on that side.
payment_time < start -> start; payment_time > end -> end.
Stores original_payment_time when adjusted and marks is_adjusted = TRUE.';



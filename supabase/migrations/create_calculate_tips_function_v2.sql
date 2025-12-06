-- Migration: Create calculate_tips function (v2)
-- Execute this in Supabase SQL Editor
-- This function calculates tip distribution for employees based on working hours and tip payments
-- Version 2: Fixed trainee-only distribution (when non-trainees are absent, trainees receive full amount)

CREATE OR REPLACE FUNCTION calculate_tips(
  p_calculation_id UUID,
  p_store_id UUID,
  p_period_start DATE,
  p_period_end DATE
) RETURNS TABLE (
  name TEXT,
  tips NUMERIC,
  cash_tips NUMERIC,
  total NUMERIC
) AS $$
DECLARE
  v_tip_record RECORD;
  v_working_hour_record RECORD;
  v_role_mapping_exists BOOLEAN;
  v_employee_record RECORD;
  v_cash_tip_record RECORD;
  v_employee_tips JSONB := '{}'::JSONB;
  v_employee_cash_tips JSONB := '{}'::JSONB;
  v_working_roles JSONB;
  v_distribution_grouping INTEGER;
  v_group_tip_amount NUMERIC;
  v_employee_name TEXT;
  v_role_name TEXT;
  v_is_trainee BOOLEAN;
  v_trainee_percentage NUMERIC;
  v_group_total NUMERIC;
  v_trainee_count INTEGER;
  v_non_trainee_count INTEGER;
  v_per_person_amount NUMERIC;
  v_trainee_amount NUMERIC;
  v_remaining_amount NUMERIC;
  v_non_trainee_amount NUMERIC;
  v_total_hours NUMERIC;
  v_employee_hours NUMERIC;
  v_cash_tip_per_hour NUMERIC;
BEGIN
  -- Initialize employee tips tracking
  -- Structure: { "employee_name": { "tips": 0, "cash_tips": 0 } }

  -- Step 1: Process each tip payment record
  FOR v_tip_record IN
    SELECT 
      formatted_tip_data.id,
      formatted_tip_data.order_date,
      formatted_tip_data.payment_time,
      formatted_tip_data.tips
    FROM formatted_tip_data
    WHERE formatted_tip_data.stores_id = p_store_id
      AND formatted_tip_data.order_date >= p_period_start
      AND formatted_tip_data.order_date <= p_period_end
      AND formatted_tip_data.payment_time IS NOT NULL
  LOOP
    -- Step 2: Find employees working at the payment time
    -- Build a JSONB object of working roles: { "FRONT": [employees], "BACK": [employees], "FLOATER": [employees] }
    v_working_roles := '{}'::JSONB;

    FOR v_working_hour_record IN
      SELECT 
        wh.id,
        wh.name as employee_name,
        wh.date,
        wh.start as start_time,
        wh."end" as end_time,
        wh.role,
        rm.id as role_mapping_id,
        rm.role_name,
        rm.trainee_role_name,
        rm.trainee_percentage
      FROM formatted_working_hours wh
      LEFT JOIN role_mappings rm ON (
        rm.store_id = p_store_id
        AND (
          (rm.actual_role_name IS NOT NULL AND wh.role LIKE '%' || rm.actual_role_name || '%')
          OR (rm.trainee_role_name IS NOT NULL AND wh.role LIKE '%' || rm.trainee_role_name || '%')
        )
      )
      WHERE wh.stores_id = p_store_id
        AND wh.date = v_tip_record.order_date
        AND wh.start IS NOT NULL
        AND wh."end" IS NOT NULL
        AND v_tip_record.payment_time::TIME >= wh.start::TIME
        AND v_tip_record.payment_time::TIME <= wh."end"::TIME
        AND wh.is_complete = true
    LOOP
      -- Check if this role is selected in role_percentage (used in calculation)
      SELECT EXISTS(
        SELECT 1 
        FROM role_percentage rp
        WHERE rp.role_mapping_id = v_working_hour_record.role_mapping_id
          AND rp.percentage > 0
      ) INTO v_role_mapping_exists;

      -- Only include roles that are selected in role_percentage
      IF v_role_mapping_exists AND v_working_hour_record.role_name IS NOT NULL THEN
        -- Add employee to working roles
        IF NOT (v_working_roles ? v_working_hour_record.role_name) THEN
          v_working_roles := v_working_roles || jsonb_build_object(v_working_hour_record.role_name, '[]'::jsonb);
        END IF;
        
        v_working_roles := v_working_roles || jsonb_set(
          v_working_roles,
          ARRAY[v_working_hour_record.role_name],
          (v_working_roles->v_working_hour_record.role_name)::jsonb || 
          jsonb_build_array(jsonb_build_object(
            'name', v_working_hour_record.employee_name,
            'is_trainee', (v_working_hour_record.trainee_role_name IS NOT NULL AND v_working_hour_record.role LIKE '%' || v_working_hour_record.trainee_role_name || '%'),
            'trainee_percentage', COALESCE(v_working_hour_record.trainee_percentage, 50)
          ))
        );
      END IF;
    END LOOP;

    -- Step 3: Determine distribution_grouping based on working roles
    -- Skip if no working roles found
    IF v_working_roles = '{}'::JSONB OR (SELECT COUNT(*) FROM jsonb_object_keys(v_working_roles)) = 0 THEN
      CONTINUE;
    END IF;

    -- Find the distribution_grouping where percentage > 0 for all working roles
    -- and percentage = 0 for all non-working roles
    SELECT rp.distribution_grouping
    INTO v_distribution_grouping
    FROM role_percentage rp
    INNER JOIN role_mappings rm ON rp.role_mapping_id = rm.id
    WHERE rm.store_id = p_store_id
    GROUP BY rp.distribution_grouping
    HAVING 
      -- All working roles have percentage > 0
      COUNT(CASE WHEN (v_working_roles ? rm.role_name) AND rp.percentage > 0 THEN 1 END) = 
        (SELECT COUNT(*) FROM jsonb_object_keys(v_working_roles))
      AND
      -- All non-working roles have percentage = 0
      COUNT(CASE WHEN NOT (v_working_roles ? rm.role_name) AND rp.percentage = 0 THEN 1 END) =
        (SELECT COUNT(*) FROM role_mappings WHERE store_id = p_store_id) - 
        (SELECT COUNT(*) FROM jsonb_object_keys(v_working_roles))
    LIMIT 1;

    -- If no exact match found, skip this tip (should not happen if data is correct)
    IF v_distribution_grouping IS NULL THEN
      CONTINUE;
    END IF;

    -- Step 4: Distribute tip among groups
    -- For each role group, calculate the amount based on percentage
    FOR v_role_name IN SELECT jsonb_object_keys(v_working_roles)
    LOOP
      -- Get percentage for this role in this distribution_grouping
      SELECT rp.percentage
      INTO v_group_tip_amount
      FROM role_percentage rp
      INNER JOIN role_mappings rm ON rp.role_mapping_id = rm.id
      WHERE rm.store_id = p_store_id
        AND rm.role_name = v_role_name
        AND rp.distribution_grouping = v_distribution_grouping
      LIMIT 1;

      IF v_group_tip_amount IS NULL THEN
        CONTINUE;
      END IF;

      v_group_tip_amount := (v_tip_record.tips * v_group_tip_amount / 100)::NUMERIC;

      -- Step 5: Distribute within group (with trainee adjustment)
      -- Count trainees and non-trainees
      v_trainee_count := 0;
      v_non_trainee_count := 0;
      
      FOR v_employee_record IN SELECT value FROM jsonb_array_elements(v_working_roles->v_role_name)
      LOOP
        IF (v_employee_record.value->>'is_trainee')::BOOLEAN THEN
          v_trainee_count := v_trainee_count + 1;
        ELSE
          v_non_trainee_count := v_non_trainee_count + 1;
        END IF;
      END LOOP;

      v_group_total := v_trainee_count + v_non_trainee_count;
      
      IF v_group_total > 0 THEN
        -- Calculate per person amount
        v_per_person_amount := (v_group_tip_amount / v_group_total)::NUMERIC;

        -- Distribute to each employee
        FOR v_employee_record IN SELECT value FROM jsonb_array_elements(v_working_roles->v_role_name)
        LOOP
          v_employee_name := v_employee_record.value->>'name';
          v_is_trainee := (v_employee_record.value->>'is_trainee')::BOOLEAN;
          v_trainee_percentage := COALESCE((v_employee_record.value->>'trainee_percentage')::NUMERIC, 50);

          -- Initialize employee if not exists
          IF NOT (v_employee_tips ? v_employee_name) THEN
            v_employee_tips := v_employee_tips || jsonb_build_object(v_employee_name, 0);
          END IF;

          IF v_is_trainee THEN
            -- Trainee receives trainee_percentage of per_person_amount
            v_trainee_amount := (v_per_person_amount * v_trainee_percentage / 100)::NUMERIC;
            v_employee_tips := v_employee_tips || jsonb_set(
              v_employee_tips,
              ARRAY[v_employee_name],
              to_jsonb((v_employee_tips->v_employee_name)::NUMERIC + v_trainee_amount)
            );
          ELSE
            -- Non-trainee receives per_person_amount plus share of remaining amount
            v_employee_tips := v_employee_tips || jsonb_set(
              v_employee_tips,
              ARRAY[v_employee_name],
              to_jsonb((v_employee_tips->v_employee_name)::NUMERIC + v_per_person_amount)
            );
          END IF;
        END LOOP;

        -- Redistribute remaining amount
        IF v_trainee_count > 0 AND v_non_trainee_count > 0 THEN
          -- Case 1: Both trainees and non-trainees exist
          -- Redistribute remaining amount from trainees to non-trainees
          -- Calculate total remaining amount from all trainees
          v_remaining_amount := 0;
          FOR v_employee_record IN SELECT value FROM jsonb_array_elements(v_working_roles->v_role_name)
          LOOP
            v_is_trainee := (v_employee_record.value->>'is_trainee')::BOOLEAN;
            IF v_is_trainee THEN
              v_trainee_percentage := COALESCE((v_employee_record.value->>'trainee_percentage')::NUMERIC, 50);
              v_remaining_amount := v_remaining_amount + (v_per_person_amount * (100 - v_trainee_percentage) / 100)::NUMERIC;
            END IF;
          END LOOP;
          
          v_non_trainee_amount := (v_remaining_amount / v_non_trainee_count)::NUMERIC;

          FOR v_employee_record IN SELECT value FROM jsonb_array_elements(v_working_roles->v_role_name)
          LOOP
            v_employee_name := v_employee_record.value->>'name';
            v_is_trainee := (v_employee_record.value->>'is_trainee')::BOOLEAN;

            IF NOT v_is_trainee THEN
              v_employee_tips := v_employee_tips || jsonb_set(
                v_employee_tips,
                ARRAY[v_employee_name],
                to_jsonb((v_employee_tips->v_employee_name)::NUMERIC + v_non_trainee_amount)
              );
            END IF;
          END LOOP;
        ELSIF v_trainee_count > 0 AND v_non_trainee_count = 0 THEN
          -- Case 2: Only trainees exist (no non-trainees)
          -- Redistribute remaining amount from trainees to trainees (equal distribution)
          -- Calculate total remaining amount from all trainees
          v_remaining_amount := 0;
          FOR v_employee_record IN SELECT value FROM jsonb_array_elements(v_working_roles->v_role_name)
          LOOP
            v_is_trainee := (v_employee_record.value->>'is_trainee')::BOOLEAN;
            IF v_is_trainee THEN
              v_trainee_percentage := COALESCE((v_employee_record.value->>'trainee_percentage')::NUMERIC, 50);
              v_remaining_amount := v_remaining_amount + (v_per_person_amount * (100 - v_trainee_percentage) / 100)::NUMERIC;
            END IF;
          END LOOP;
          
          -- Distribute remaining amount equally among all trainees
          v_trainee_amount := (v_remaining_amount / v_trainee_count)::NUMERIC;

          FOR v_employee_record IN SELECT value FROM jsonb_array_elements(v_working_roles->v_role_name)
          LOOP
            v_employee_name := v_employee_record.value->>'name';
            v_is_trainee := (v_employee_record.value->>'is_trainee')::BOOLEAN;

            IF v_is_trainee THEN
              v_employee_tips := v_employee_tips || jsonb_set(
                v_employee_tips,
                ARRAY[v_employee_name],
                to_jsonb((v_employee_tips->v_employee_name)::NUMERIC + v_trainee_amount)
              );
            END IF;
          END LOOP;
        END IF;
      END IF;
    END LOOP;
  END LOOP;

  -- Step 6: Process cash tips
  FOR v_cash_tip_record IN
    SELECT 
      formatted_cash_tip.date,
      formatted_cash_tip.cash_tips
    FROM formatted_cash_tip
    WHERE formatted_cash_tip.stores_id = p_store_id
      AND formatted_cash_tip.date >= p_period_start
      AND formatted_cash_tip.date <= p_period_end
  LOOP
    -- Calculate total working hours for that day
    SELECT COALESCE(SUM(EXTRACT(EPOCH FROM (formatted_working_hours.end::TIME - formatted_working_hours.start::TIME)) / 3600), 0)
    INTO v_total_hours
    FROM formatted_working_hours
    WHERE formatted_working_hours.stores_id = p_store_id
      AND formatted_working_hours.date = v_cash_tip_record.date
      AND formatted_working_hours.start IS NOT NULL
      AND formatted_working_hours.end IS NOT NULL
      AND formatted_working_hours.is_complete = true;

    IF v_total_hours > 0 THEN
      v_cash_tip_per_hour := (v_cash_tip_record.cash_tips / v_total_hours)::NUMERIC;

      -- Distribute cash tips based on working hours
      FOR v_working_hour_record IN
        SELECT 
          formatted_working_hours.name as employee_name,
          formatted_working_hours.start as start_time,
          formatted_working_hours."end" as end_time
        FROM formatted_working_hours
        WHERE formatted_working_hours.stores_id = p_store_id
          AND formatted_working_hours.date = v_cash_tip_record.date
          AND formatted_working_hours.start IS NOT NULL
          AND formatted_working_hours."end" IS NOT NULL
          AND formatted_working_hours.is_complete = true
      LOOP
        v_employee_name := v_working_hour_record.employee_name;
        v_employee_hours := EXTRACT(EPOCH FROM (v_working_hour_record.end_time::TIME - v_working_hour_record.start_time::TIME)) / 3600;
        
        -- Initialize employee if not exists
        IF NOT (v_employee_cash_tips ? v_employee_name) THEN
          v_employee_cash_tips := v_employee_cash_tips || jsonb_build_object(v_employee_name, 0);
        END IF;

        -- Add cash tip (truncate to 2 decimal places)
        v_employee_cash_tips := v_employee_cash_tips || jsonb_set(
          v_employee_cash_tips,
          ARRAY[v_employee_name],
          to_jsonb(TRUNC((v_employee_cash_tips->v_employee_name)::NUMERIC + (v_cash_tip_per_hour * v_employee_hours), 2))
        );
      END LOOP;
    END IF;
  END LOOP;

  -- Step 7: Return results as table
  -- Return employees with tips
  FOR v_employee_name IN SELECT jsonb_object_keys(v_employee_tips)
  LOOP
    RETURN QUERY SELECT
      v_employee_name::TEXT as name,
      TRUNC((v_employee_tips->v_employee_name)::NUMERIC, 2) as tips,
      COALESCE(TRUNC((v_employee_cash_tips->v_employee_name)::NUMERIC, 2), 0) as cash_tips,
      TRUNC((v_employee_tips->v_employee_name)::NUMERIC, 2) + COALESCE(TRUNC((v_employee_cash_tips->v_employee_name)::NUMERIC, 2), 0) as total;
  END LOOP;

  -- Also return employees who only have cash tips
  FOR v_employee_name IN SELECT jsonb_object_keys(v_employee_cash_tips)
  LOOP
    IF NOT (v_employee_tips ? v_employee_name) THEN
      RETURN QUERY SELECT
        v_employee_name::TEXT as name,
        0::NUMERIC as tips,
        TRUNC((v_employee_cash_tips->v_employee_name)::NUMERIC, 2) as cash_tips,
        TRUNC((v_employee_cash_tips->v_employee_name)::NUMERIC, 2) as total;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Add comment for documentation
COMMENT ON FUNCTION calculate_tips(UUID, UUID, DATE, DATE) IS 
'Calculates tip distribution for employees based on working hours, tip payments, and cash tips. 
Version 2: Fixed trainee-only distribution - when non-trainees are absent, trainees receive full amount equally.
Returns a table with columns: name, tips, cash_tips, total.';


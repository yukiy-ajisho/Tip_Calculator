-- SQL: Find tip data records where payment_time is outside all working hours
-- This query finds formatted_tip_data records where payment_time is not within
-- any formatted_working_hours start and end time range for the same store and date.

SELECT 
  ftd.id,
  ftd.stores_id,
  ftd.order_date,
  ftd.payment_time,
  ftd.original_payment_time,
  ftd.is_adjusted,
  ftd.tips,
  ftd.created_at,
  ftd.updated_at
FROM formatted_tip_data ftd
WHERE ftd.payment_time IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM formatted_working_hours fwh
    WHERE fwh.stores_id = ftd.stores_id
      AND fwh.date = ftd.order_date
      AND fwh.start IS NOT NULL
      AND fwh."end" IS NOT NULL
      AND ftd.payment_time::TIME >= fwh.start::TIME
      AND ftd.payment_time::TIME <= fwh."end"::TIME
  )
ORDER BY ftd.stores_id, ftd.order_date, ftd.payment_time;

-- Explanation:
-- 1. Select all formatted_tip_data records where payment_time is not NULL
-- 2. Use NOT EXISTS to find records where there is NO formatted_working_hours record
--    that matches:
--    - Same stores_id
--    - Same date (order_date = date)
--    - payment_time is within the start and end time range
-- 3. This means the payment_time is outside ALL working hours for that date
-- 4. Results are ordered by store, date, and payment_time for easy review

-- ============================================================================
-- SQL: Count tip data records where payment_time is within at least one working hours range
-- This query counts formatted_tip_data records where payment_time is within
-- at least one formatted_working_hours start and end time range for the same store and date.
-- ============================================================================

SELECT COUNT(DISTINCT ftd.id) as tip_count
FROM formatted_tip_data ftd
WHERE ftd.payment_time IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM formatted_working_hours fwh
    WHERE fwh.stores_id = ftd.stores_id
      AND fwh.date = ftd.order_date
      AND fwh.start IS NOT NULL
      AND fwh."end" IS NOT NULL
      AND ftd.payment_time::TIME >= fwh.start::TIME
      AND ftd.payment_time::TIME <= fwh."end"::TIME
  );

-- Explanation:
-- 1. Count distinct formatted_tip_data records where payment_time is not NULL
-- 2. Use EXISTS to find records where there IS at least one formatted_working_hours record
--    that matches:
--    - Same stores_id
--    - Same date (order_date = date)
--    - payment_time is within the start and end time range
-- 3. This means the payment_time is within at least ONE working hours range for that date
-- 4. COUNT(DISTINCT) ensures each tip is counted only once even if it matches multiple working hours


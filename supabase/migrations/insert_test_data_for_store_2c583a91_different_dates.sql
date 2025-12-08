-- Migration: Insert test data for store 2c583a91-e999-49e9-be14-d32cde5516a2
-- Different dates from insert_test_data_for_store_2c583a91.sql
-- Store ID: 2c583a91-e999-49e9-be14-d32cde5516a2
-- Covers 4 days with varied edge cases:
--  - Day 1: Normal mix of roles (baseline)
--  - Day 2: Off-hours tips (no workers), multiple tips same time, multiple trainees
--  - Day 3: Very short/long shifts, zero cash-tip day
--  - Day 4: Multiple shifts per employee, trainees only for a role, boundary payment times

-- ========================================
-- Day 1 (2025-12-01): Baseline mix
-- ========================================
INSERT INTO formatted_working_hours (id, stores_id, name, date, start, "end", role, is_complete, is_complete_on_import) VALUES
  (gen_random_uuid(), '2c583a91-e999-49e9-be14-d32cde5516a2', 'Alice',   '2025-12-01', '09:00:00', '17:00:00', 'FOH STAFF', true, true),
  (gen_random_uuid(), '2c583a91-e999-49e9-be14-d32cde5516a2', 'Bob',     '2025-12-01', '09:00:00', '17:00:00', 'BOH',       true, true),
  (gen_random_uuid(), '2c583a91-e999-49e9-be14-d32cde5516a2', 'Carol',   '2025-12-01', '10:00:00', '18:00:00', 'FLOATER',   true, true),
  (gen_random_uuid(), '2c583a91-e999-49e9-be14-d32cde5516a2', 'Frank',   '2025-12-01', '12:00:00', '18:00:00', 'F_TRAINEE', true, true);

INSERT INTO formatted_tip_data (id, stores_id, order_date, payment_time, tips) VALUES
  (gen_random_uuid(), '2c583a91-e999-49e9-be14-d32cde5516a2', '2025-12-01', '10:30:00', 120),
  (gen_random_uuid(), '2c583a91-e999-49e9-be14-d32cde5516a2', '2025-12-01', '13:15:00', 180),
  (gen_random_uuid(), '2c583a91-e999-49e9-be14-d32cde5516a2', '2025-12-01', '15:45:00', 90);

INSERT INTO formatted_cash_tip (id, stores_id, date, cash_tips) VALUES
  (gen_random_uuid(), '2c583a91-e999-49e9-be14-d32cde5516a2', '2025-12-01', 150);

-- ========================================
-- Day 2 (2025-12-02): Off-hours tips, multiple trainees, duplicate payment time
-- ========================================
INSERT INTO formatted_working_hours (id, stores_id, name, date, start, "end", role, is_complete, is_complete_on_import) VALUES
  (gen_random_uuid(), '2c583a91-e999-49e9-be14-d32cde5516a2', 'Grace',  '2025-12-02', '08:00:00', '14:00:00', 'F_TRAINEE', true, true),
  (gen_random_uuid(), '2c583a91-e999-49e9-be14-d32cde5516a2', 'Henry',  '2025-12-02', '08:00:00', '16:00:00', 'FOH STAFF', true, true),
  (gen_random_uuid(), '2c583a91-e999-49e9-be14-d32cde5516a2', 'Iris',   '2025-12-02', '09:00:00', '17:00:00', 'BOH',       true, true),
  (gen_random_uuid(), '2c583a91-e999-49e9-be14-d32cde5516a2', 'Jake',   '2025-12-02', '12:00:00', '20:00:00', 'F_TRAINEE', true, true),
  (gen_random_uuid(), '2c583a91-e999-49e9-be14-d32cde5516a2', 'Liam',   '2025-12-02', '10:00:00', '18:00:00', 'FLOATER',   true, true);

-- Include tips where no one is working (e.g., 06:00)
-- Include two tips at the same time (13:00)
INSERT INTO formatted_tip_data (id, stores_id, order_date, payment_time, tips) VALUES
  (gen_random_uuid(), '2c583a91-e999-49e9-be14-d32cde5516a2', '2025-12-02', '06:00:00', 200), -- off-hours, should be skipped
  (gen_random_uuid(), '2c583a91-e999-49e9-be14-d32cde5516a2', '2025-12-02', '11:30:00', 160),
  (gen_random_uuid(), '2c583a91-e999-49e9-be14-d32cde5516a2', '2025-12-02', '13:00:00', 140),
  (gen_random_uuid(), '2c583a91-e999-49e9-be14-d32cde5516a2', '2025-12-02', '13:00:00', 110), -- same time as above
  (gen_random_uuid(), '2c583a91-e999-49e9-be14-d32cde5516a2', '2025-12-02', '17:45:00', 190);

INSERT INTO formatted_cash_tip (id, stores_id, date, cash_tips) VALUES
  (gen_random_uuid(), '2c583a91-e999-49e9-be14-d32cde5516a2', '2025-12-02', 120);

-- ========================================
-- Day 3 (2025-12-03): Short/long shifts, no cash tips
-- ========================================
INSERT INTO formatted_working_hours (id, stores_id, name, date, start, "end", role, is_complete, is_complete_on_import) VALUES
  -- Very short shift (30 minutes)
  (gen_random_uuid(), '2c583a91-e999-49e9-be14-d32cde5516a2', 'Mia',    '2025-12-03', '08:00:00', '08:30:00', 'FOH STAFF', true, true),
  -- Very long shift (12 hours)
  (gen_random_uuid(), '2c583a91-e999-49e9-be14-d32cde5516a2', 'Noah',   '2025-12-03', '08:00:00', '20:00:00', 'BOH',       true, true),
  -- Evening short shift
  (gen_random_uuid(), '2c583a91-e999-49e9-be14-d32cde5516a2', 'Olive',  '2025-12-03', '19:30:00', '21:30:00', 'FLOATER',   true, true),
  -- Trainee overlapping with long shift
  (gen_random_uuid(), '2c583a91-e999-49e9-be14-d32cde5516a2', 'Piper',  '2025-12-03', '10:00:00', '18:00:00', 'F_TRAINEE', true, true);

-- Multiple tips including one late-night near closing
INSERT INTO formatted_tip_data (id, stores_id, order_date, payment_time, tips) VALUES
  (gen_random_uuid(), '2c583a91-e999-49e9-be14-d32cde5516a2', '2025-12-03', '08:15:00', 75),   -- should include short shift
  (gen_random_uuid(), '2c583a91-e999-49e9-be14-d32cde5516a2', '2025-12-03', '12:00:00', 130),
  (gen_random_uuid(), '2c583a91-e999-49e9-be14-d32cde5516a2', '2025-12-03', '18:30:00', 210),
  (gen_random_uuid(), '2c583a91-e999-49e9-be14-d32cde5516a2', '2025-12-03', '21:15:00', 95);   -- overlaps with evening shift

-- No cash tips for this day (tests zero cash-tip scenario)

-- ========================================
-- Day 4 (2025-12-04): Multiple shifts, boundary times, trainees only for a role
-- ========================================
INSERT INTO formatted_working_hours (id, stores_id, name, date, start, "end", role, is_complete, is_complete_on_import) VALUES
  -- Same employee, two shifts (test split shifts)
  (gen_random_uuid(), '2c583a91-e999-49e9-be14-d32cde5516a2', 'Quinn',  '2025-12-04', '08:00:00', '12:00:00', 'FOH STAFF', true, true),
  (gen_random_uuid(), '2c583a91-e999-49e9-be14-d32cde5516a2', 'Quinn',  '2025-12-04', '18:00:00', '22:00:00', 'FOH STAFF', true, true),
  -- Trainees only for FRONT role
  (gen_random_uuid(), '2c583a91-e999-49e9-be14-d32cde5516a2', 'Ria',    '2025-12-04', '18:00:00', '22:00:00', 'F_TRAINEE', true, true),
  (gen_random_uuid(), '2c583a91-e999-49e9-be14-d32cde5516a2', 'Sam',    '2025-12-04', '18:00:00', '22:00:00', 'F_TRAINEE', true, true),
  -- Back and Floater for evening
  (gen_random_uuid(), '2c583a91-e999-49e9-be14-d32cde5516a2', 'Tina',   '2025-12-04', '17:00:00', '23:00:00', 'BOH',       true, true),
  (gen_random_uuid(), '2c583a91-e999-49e9-be14-d32cde5516a2', 'Uma',    '2025-12-04', '17:00:00', '23:00:00', 'FLOATER',   true, true);

-- Tips including boundary times (exactly at start/end), and overlapping shifts
INSERT INTO formatted_tip_data (id, stores_id, order_date, payment_time, tips) VALUES
  (gen_random_uuid(), '2c583a91-e999-49e9-be14-d32cde5516a2', '2025-12-04', '08:00:00', 60),    -- at shift start
  (gen_random_uuid(), '2c583a91-e999-49e9-be14-d32cde5516a2', '2025-12-04', '12:00:00', 80),    -- at shift end (morning)
  (gen_random_uuid(), '2c583a91-e999-49e9-be14-d32cde5516a2', '2025-12-04', '19:30:00', 200),   -- evening overlap, trainees only for FRONT
  (gen_random_uuid(), '2c583a91-e999-49e9-be14-d32cde5516a2', '2025-12-04', '22:00:00', 150),   -- at shift end (evening)
  (gen_random_uuid(), '2c583a91-e999-49e9-be14-d32cde5516a2', '2025-12-04', '22:30:00', 90);    -- after FRONT/F_TRAINEE shifts end (should exclude them)

INSERT INTO formatted_cash_tip (id, stores_id, date, cash_tips) VALUES
  (gen_random_uuid(), '2c583a91-e999-49e9-be14-d32cde5516a2', '2025-12-04', 180);

-- Notes:
-- - Off-hours tip on 2025-12-02 06:00 should be skipped (no active workers).
-- - 2025-12-02 has two tips at the same time (13:00) to test aggregation.
-- - 2025-12-03 has no cash tips (zero cash scenario).
-- - 2025-12-03 includes a very short shift (30 minutes) and a very long shift (12 hours).
-- - 2025-12-04 tests split shifts for the same employee and trainees-only FRONT role in the evening.
-- - 2025-12-04 includes payments exactly at start/end times to verify boundary handling (<= end).

-- ========================================
-- Create tip_calculations record for testing
-- ========================================
-- This record is required for calculate_tips function (v5) to work
-- The function retrieves period_start and period_end from this table
INSERT INTO tip_calculations (id, stores_id, period_start, period_end, status) VALUES
  (gen_random_uuid(), '2c583a91-e999-49e9-be14-d32cde5516a2', '2025-12-01', '2025-12-04', 'processing')
ON CONFLICT DO NOTHING;

-- Note: After inserting test data, you can test calculate_tips function like this:
-- SELECT calculate_tips(
--   (SELECT id FROM tip_calculations WHERE stores_id = '2c583a91-e999-49e9-be14-d32cde5516a2' AND status = 'processing' AND period_start = '2025-12-01' LIMIT 1),
--   '2c583a91-e999-49e9-be14-d32cde5516a2'::UUID
-- );


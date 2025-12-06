-- Migration: Insert test data for tip calculation
-- Execute this in Supabase SQL Editor
-- This inserts test data for formatted_working_hours and formatted_tip_data

-- Test data for formatted_working_hours
-- Store ID: b79020f7-a38a-4154-8211-43407a471b70
-- Date: 2025-10-15

INSERT INTO formatted_working_hours (
  id,
  stores_id,
  name,
  date,
  start,
  end,
  role,
  is_complete,
  is_complete_on_import
) VALUES
  -- Alice: FOH STAFF, 09:00-15:00
  (
    gen_random_uuid(),
    'b79020f7-a38a-4154-8211-43407a471b70',
    'Alice',
    '2025-10-15',
    '09:00:00',
    '15:00:00',
    'FOH STAFF',
    true,
    true
  ),
  -- Bob: BOH, 10:00-18:00
  (
    gen_random_uuid(),
    'b79020f7-a38a-4154-8211-43407a471b70',
    'Bob',
    '2025-10-15',
    '10:00:00',
    '18:00:00',
    'BOH',
    true,
    true
  ),
  -- Charlie: F_TRAINEE, 11:00-19:00
  (
    gen_random_uuid(),
    'b79020f7-a38a-4154-8211-43407a471b70',
    'Charlie',
    '2025-10-15',
    '11:00:00',
    '19:00:00',
    'F_TRAINEE',
    true,
    true
  ),
  -- David: FLOATER, 12:00-20:00
  (
    gen_random_uuid(),
    'b79020f7-a38a-4154-8211-43407a471b70',
    'David',
    '2025-10-15',
    '12:00:00',
    '20:00:00',
    'FLOATER',
    true,
    true
  ),
  -- Eve: FOH STAFF, 14:00-22:00
  (
    gen_random_uuid(),
    'b79020f7-a38a-4154-8211-43407a471b70',
    'Eve',
    '2025-10-15',
    '14:00:00',
    '22:00:00',
    'FOH STAFF',
    true,
    true
  )
ON CONFLICT DO NOTHING;

-- Test data for formatted_tip_data
-- Store ID: b79020f7-a38a-4154-8211-43407a471b70
-- Date: 2025-10-15

INSERT INTO formatted_tip_data (
  id,
  stores_id,
  order_date,
  payment_time,
  tips
) VALUES
  -- tip1: 10:30:00, $100
  (
    gen_random_uuid(),
    'b79020f7-a38a-4154-8211-43407a471b70',
    '2025-10-15',
    '10:30:00',
    100
  ),
  -- tip2: 13:00:00, $150
  (
    gen_random_uuid(),
    'b79020f7-a38a-4154-8211-43407a471b70',
    '2025-10-15',
    '13:00:00',
    150
  ),
  -- tip3: 14:00:00, $200
  (
    gen_random_uuid(),
    'b79020f7-a38a-4154-8211-43407a471b70',
    '2025-10-15',
    '14:00:00',
    200
  ),
  -- tip4: 16:00:00, $80
  (
    gen_random_uuid(),
    'b79020f7-a38a-4154-8211-43407a471b70',
    '2025-10-15',
    '16:00:00',
    80
  ),
  -- tip5: 19:00:00, $120
  (
    gen_random_uuid(),
    'b79020f7-a38a-4154-8211-43407a471b70',
    '2025-10-15',
    '19:00:00',
    120
  ),
  -- tip6: 21:00:00, $90
  (
    gen_random_uuid(),
    'b79020f7-a38a-4154-8211-43407a471b70',
    '2025-10-15',
    '21:00:00',
    90
  )
ON CONFLICT DO NOTHING;


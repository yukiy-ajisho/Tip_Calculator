-- Migration: Add function and cron job to automatically delete expired invitation codes
-- Execute this in Supabase SQL Editor

-- 1. Enable pg_cron extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2. Create function to delete expired unused invitation codes
CREATE OR REPLACE FUNCTION cleanup_expired_invitations()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete expired unused invitation codes (expires_at < NOW() AND used_at IS NULL)
  DELETE FROM store_invitations
  WHERE expires_at < NOW()
    AND used_at IS NULL;
END;
$$;

-- 3. Schedule cron job to run every minute
-- This will automatically delete expired unused codes
SELECT cron.schedule(
  'cleanup-expired-invitations',
  '* * * * *', -- Every minute
  $$SELECT cleanup_expired_invitations()$$
);

-- 4. Add comment for documentation
COMMENT ON FUNCTION cleanup_expired_invitations() IS 'Deletes expired unused invitation codes from store_invitations table';


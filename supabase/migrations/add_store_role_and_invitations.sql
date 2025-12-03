-- Migration: Add role to store_users and create store_invitations table
-- Execute this in Supabase SQL Editor

-- 1. Add role column to store_users table
ALTER TABLE store_users
ADD COLUMN IF NOT EXISTS role TEXT CHECK (role IN ('owner', 'manager')) DEFAULT 'owner';

-- 2. Update existing records to 'owner' (all existing store_users are owners)
UPDATE store_users
SET role = 'owner'
WHERE role IS NULL;

-- 3. Set role column to NOT NULL after updating existing records
ALTER TABLE store_users
ALTER COLUMN role SET NOT NULL;

-- 4. Create store_invitations table
CREATE TABLE IF NOT EXISTS store_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  used_by UUID REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT store_invitations_code_unique UNIQUE (code)
);

-- 5. Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_store_invitations_code ON store_invitations(code);
CREATE INDEX IF NOT EXISTS idx_store_invitations_store_id ON store_invitations(store_id);
CREATE INDEX IF NOT EXISTS idx_store_invitations_used_at ON store_invitations(used_at);

-- 6. Add comment for documentation
COMMENT ON TABLE store_invitations IS 'Stores invitation codes for adding managers to stores';
COMMENT ON COLUMN store_invitations.code IS 'Unique invitation code';
COMMENT ON COLUMN store_invitations.expires_at IS 'Expiration time (2 minutes from creation)';
COMMENT ON COLUMN store_invitations.used_at IS 'When the code was used (NULL if unused)';
COMMENT ON COLUMN store_invitations.used_by IS 'User who used the code (NULL if unused)';


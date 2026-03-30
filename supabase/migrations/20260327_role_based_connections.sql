-- Role-Based Connections Migration
-- Run this in the Supabase SQL Editor

-- 1. Add role to user_profiles if it doesn't already exist
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS role TEXT;

-- 2. Rename columns in connections table
ALTER TABLE public.connections RENAME COLUMN follower_id TO sender_id;
ALTER TABLE public.connections RENAME COLUMN following_id TO receiver_id;

-- 3. Add sender_role and receiver_role to connections
ALTER TABLE public.connections ADD COLUMN IF NOT EXISTS sender_role TEXT;
ALTER TABLE public.connections ADD COLUMN IF NOT EXISTS receiver_role TEXT;

-- 4. Recreate Indexes for updated columns
DROP INDEX IF EXISTS idx_connections_follower;
DROP INDEX IF EXISTS idx_connections_following;

CREATE INDEX idx_connections_sender ON public.connections(sender_id);
CREATE INDEX idx_connections_receiver ON public.connections(receiver_id);

-- Check constraints can be updated if necessary to allow 'REJECTED'
ALTER TABLE public.connections DROP CONSTRAINT IF EXISTS connections_status_check;
ALTER TABLE public.connections ADD CONSTRAINT connections_status_check CHECK (status IN ('PENDING', 'ACCEPTED', 'REJECTED'));

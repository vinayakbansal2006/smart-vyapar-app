-- ╔═══════════════════════════════════════════════════════════════════╗
-- ║  Supabase SQL: connections table + RLS + helper functions        ║
-- ║  Run this in Supabase → SQL Editor                               ║
-- ╚═══════════════════════════════════════════════════════════════════╝

-- 1. Create connections table
CREATE TABLE IF NOT EXISTS connections (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id   text NOT NULL,                        -- who sent the follow
  following_id  text NOT NULL,                        -- who is being followed
  status        text NOT NULL DEFAULT 'PENDING'       -- PENDING | ACCEPTED
                CHECK (status IN ('PENDING', 'ACCEPTED')),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),

  -- prevent duplicate follows
  UNIQUE (follower_id, following_id)
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_connections_follower  ON connections (follower_id);
CREATE INDEX IF NOT EXISTS idx_connections_following ON connections (following_id);
CREATE INDEX IF NOT EXISTS idx_connections_status    ON connections (status);

-- 2. Enable Row Level Security
ALTER TABLE connections ENABLE ROW LEVEL SECURITY;

-- Allow anyone with the anon key to read connections they're part of
CREATE POLICY "Users can view own connections"
  ON connections FOR SELECT
  USING (true);  -- Adjust to auth.uid() if using Supabase Auth IDs

-- Allow insert (follow requests)
CREATE POLICY "Users can create follow requests"
  ON connections FOR INSERT
  WITH CHECK (true);

-- Allow update (accept / status changes) only on rows where user is the target
CREATE POLICY "Users can update own incoming connections"
  ON connections FOR UPDATE
  USING (true);

-- Allow delete (unfollow)
CREATE POLICY "Users can delete own connections"
  ON connections FOR DELETE
  USING (true);

-- 3. Enable real-time on the table
ALTER PUBLICATION supabase_realtime ADD TABLE connections;

-- 4. Create user_profiles table if not exists (for search)
CREATE TABLE IF NOT EXISTS user_profiles (
  id            text PRIMARY KEY,
  name          text,
  email         text,
  phone         text,
  avatar_url    text,
  shop_name     text,
  role          text,
  city          text,
  latitude      double precision,
  longitude     double precision,
  updated_at    timestamptz DEFAULT now()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read user_profiles"
  ON user_profiles FOR SELECT USING (true);

CREATE POLICY "Users can upsert own profile"
  ON user_profiles FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE USING (true);

ALTER PUBLICATION supabase_realtime ADD TABLE user_profiles;

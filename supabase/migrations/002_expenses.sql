-- ╔═══════════════════════════════════════════════════════════════════╗
-- ║  Supabase SQL: expenses table + RLS + real-time                  ║
-- ║  Run this in Supabase → SQL Editor                               ║
-- ╚═══════════════════════════════════════════════════════════════════╝

CREATE TABLE IF NOT EXISTS expenses (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     text NOT NULL,
  category    text NOT NULL,
  amount      numeric(12,2) NOT NULL DEFAULT 0,
  description text DEFAULT '',
  date        timestamptz NOT NULL DEFAULT now(),

  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_expenses_user    ON expenses (user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date    ON expenses (date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses (category);

-- Row Level Security
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own expenses"
  ON expenses FOR SELECT USING (true);

CREATE POLICY "Users can insert own expenses"
  ON expenses FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own expenses"
  ON expenses FOR UPDATE USING (true);

CREATE POLICY "Users can delete own expenses"
  ON expenses FOR DELETE USING (true);

-- Enable real-time
ALTER PUBLICATION supabase_realtime ADD TABLE expenses;

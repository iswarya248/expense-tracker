-- ============================================================
-- Expense Tracker Database Schema
-- Compatible with PostgreSQL 12+
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Users Table ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        VARCHAR(100) NOT NULL,
  email       VARCHAR(255) UNIQUE NOT NULL,
  password    VARCHAR(255) NOT NULL,
  avatar      VARCHAR(10) DEFAULT '💰',
  currency    VARCHAR(3) DEFAULT 'USD',
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ── Expense Categories Enum ───────────────────────────────────
CREATE TYPE expense_category AS ENUM (
  'Food',
  'Transport',
  'Entertainment',
  'Bills',
  'Shopping',
  'Healthcare',
  'Other'
);

-- ── Payment Methods Enum ──────────────────────────────────────
CREATE TYPE payment_method AS ENUM (
  'Cash',
  'Credit Card',
  'Debit Card',
  'Apple Pay',
  'Google Pay',
  'Bank Transfer',
  'Other'
);

-- ── Expenses Table ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS expenses (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount          DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
  category        expense_category NOT NULL DEFAULT 'Other',
  merchant        VARCHAR(255),
  description     TEXT,
  payment_method  payment_method DEFAULT 'Other',
  date            DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ── Budgets Table ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS budgets (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category    expense_category,
  amount      DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
  month       INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  year        INTEGER NOT NULL,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, category, month, year)
);

-- ── Chat History Table ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS chat_history (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role            VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
  content         TEXT NOT NULL,
  action_type     VARCHAR(30),
  expense_ref_id  UUID REFERENCES expenses(id) ON DELETE SET NULL,
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ── Indexes for Performance ───────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
CREATE INDEX IF NOT EXISTS idx_expenses_user_date ON expenses(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_user_category ON expenses(user_id, category);
CREATE INDEX IF NOT EXISTS idx_chat_history_user_id ON chat_history(user_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ── Auto-update updated_at trigger ───────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_expenses_updated_at
  BEFORE UPDATE ON expenses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ── Seed Demo User (password: demo1234) ──────────────────────
-- Bcrypt hash of "demo1234"
INSERT INTO users (id, name, email, password, avatar) VALUES
  ('00000000-0000-0000-0000-000000000001',
   'Demo User',
   'demo@example.com',
   '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
   '👤')
ON CONFLICT (email) DO NOTHING;

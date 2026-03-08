-- MAO Seed Inventory System - Database Schema
-- Use this script in the Supabase SQL Editor

-- 1. Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create Seeds Table
CREATE TABLE IF NOT EXISTS seeds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  variety TEXT NOT NULL,
  quantity DECIMAL DEFAULT 0,
  unit TEXT NOT NULL,
  batch_number TEXT,
  expiry_date DATE,
  status TEXT DEFAULT 'available',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create Recipients Table (Farmers)
CREATE TABLE IF NOT EXISTS recipients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name TEXT NOT NULL,
  barangay TEXT NOT NULL,
  contact_number TEXT,
  farm_location TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create Transactions Table (Logs)
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seed_id UUID REFERENCES seeds(id) ON DELETE CASCADE,
  recipient_id UUID REFERENCES recipients(id) ON DELETE SET NULL,
  type TEXT CHECK (type IN ('in', 'out')),
  quantity DECIMAL NOT NULL,
  reason TEXT,
  date DATE NOT NULL,
  recipient_name TEXT, -- Denormalized for quick access
  barangay TEXT,       -- Denormalized for quick access
  contact_number TEXT, -- Denormalized for quick access
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Enable Row Level Security (RLS)
ALTER TABLE seeds ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS Policies
-- Note: These policies allow all authenticated users to manage data.
-- You can refine these for more granular control (e.g., admin vs staff).

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can manage seeds') THEN
        CREATE POLICY "Authenticated users can manage seeds" ON seeds FOR ALL USING (auth.role() = 'authenticated');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can manage recipients') THEN
        CREATE POLICY "Authenticated users can manage recipients" ON recipients FOR ALL USING (auth.role() = 'authenticated');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can manage transactions') THEN
        CREATE POLICY "Authenticated users can manage transactions" ON transactions FOR ALL USING (auth.role() = 'authenticated');
    END IF;
END $$;

-- 7. Create Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_transactions_seed_id ON transactions(seed_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_seeds_status ON seeds(status);

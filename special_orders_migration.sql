-- Migration: Add special_orders table to LELA Store database
-- Run this in your Supabase SQL Editor.

CREATE TABLE IF NOT EXISTS special_orders (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  customer JSONB NOT NULL,
  description TEXT NOT NULL,
  weight NUMERIC NOT NULL DEFAULT 0.5,
  image_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security (RLS)
ALTER TABLE special_orders ENABLE ROW LEVEL SECURITY;

-- 1. Allow public select access to fetch tracking states
CREATE POLICY "Allow public select on special_orders" ON special_orders FOR SELECT USING (true);

-- 2. Allow visitors to insert new special order requests (checkout-style forms)
CREATE POLICY "Allow public insert on special_orders" ON special_orders FOR INSERT WITH CHECK (true);

-- 3. Allow full CRUD control for authenticated administrator roles
CREATE POLICY "Allow all actions for admins on special_orders" ON special_orders USING (auth.role() = 'authenticated');

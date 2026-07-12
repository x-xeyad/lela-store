-- SQL SCHEMA FOR LELA STORE (SUPABASE)
-- Copy and run this script in your Supabase SQL Editor to initialize all tables, policies, and buckets.

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Categories Table
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name JSONB NOT NULL,
  image TEXT NOT NULL,
  "order" INTEGER NOT NULL DEFAULT 1,
  hidden BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Products Table
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name JSONB NOT NULL,
  description JSONB NOT NULL,
  category TEXT NOT NULL,
  cost_egp NUMERIC NOT NULL DEFAULT 0,
  profit_egp NUMERIC NOT NULL DEFAULT 0,
  price_egp NUMERIC NOT NULL DEFAULT 0,
  weight NUMERIC NOT NULL DEFAULT 0.5,
  images JSONB NOT NULL DEFAULT '[]'::jsonb,
  featured BOOLEAN NOT NULL DEFAULT false,
  sizes JSONB DEFAULT '[]'::jsonb,
  colors JSONB DEFAULT '[]'::jsonb,
  variants JSONB DEFAULT '[]'::jsonb,
  stock INTEGER NOT NULL DEFAULT 10,
  status TEXT NOT NULL DEFAULT 'visible',
  tags JSONB DEFAULT '[]'::jsonb,
  rating NUMERIC DEFAULT 5.0,
  reviews_count INTEGER DEFAULT 0,
  discount_type TEXT DEFAULT 'none',
  discount_value NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Orders Table
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  customer JSONB NOT NULL,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_egp NUMERIC NOT NULL DEFAULT 0,
  total_yer NUMERIC NOT NULL DEFAULT 0,
  selected_currency TEXT NOT NULL DEFAULT 'YER',
  exchange_rate NUMERIC NOT NULL DEFAULT 11.5,
  status TEXT NOT NULL DEFAULT 'pending',
  coupon_code TEXT,
  discount_amount NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Coupons Table
CREATE TABLE IF NOT EXISTS coupons (
  code TEXT PRIMARY KEY,
  discount_type TEXT NOT NULL DEFAULT 'percentage',
  discount_value NUMERIC NOT NULL DEFAULT 0,
  expiration_date TEXT,
  max_uses INTEGER,
  used_count INTEGER DEFAULT 0,
  min_order_value NUMERIC DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Settings Table (Generic Key/Value)
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Reviews Table
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  rating INTEGER NOT NULL DEFAULT 5,
  date TEXT NOT NULL,
  comment JSONB NOT NULL,
  avatar TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 8. FAQs Table
CREATE TABLE IF NOT EXISTS faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question JSONB NOT NULL,
  answer JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 9. Activity Logs Table
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT now()
);

-- 10. Enable Row Level Security (RLS) policies
-- Note: In Supabase, you can set the table policies. For simple demo apps, we can enable RLS and write policies, 
-- or bypass RLS for development. Here are the policies to allow admin actions and public reads.

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Create Policies (Public Read Access)
CREATE POLICY "Allow public select on products" ON products FOR SELECT USING (true);
CREATE POLICY "Allow public select on categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Allow public select on settings" ON settings FOR SELECT USING (true);
CREATE POLICY "Allow public select on coupons" ON coupons FOR SELECT USING (true);
CREATE POLICY "Allow public select on reviews" ON reviews FOR SELECT USING (true);
CREATE POLICY "Allow public select on faqs" ON faqs FOR SELECT USING (true);
CREATE POLICY "Allow public select on activity_logs" ON activity_logs FOR SELECT USING (true);
CREATE POLICY "Allow public select on orders" ON orders FOR SELECT USING (true);

-- Create Policies (Authenticated Write Access for Admins)
CREATE POLICY "Allow all actions for admins on products" ON products USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all actions for admins on categories" ON categories USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all actions for admins on settings" ON settings USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all actions for admins on coupons" ON coupons USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all actions for admins on reviews" ON reviews USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all actions for admins on faqs" ON faqs USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all actions for admins on activity_logs" ON activity_logs USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all actions for admins on orders" ON orders USING (auth.role() = 'authenticated');

-- Also allow public insert on orders (to allow clients to checkout)
CREATE POLICY "Allow client checkout insertion" ON orders FOR INSERT WITH CHECK (true);

-- 11. Special Orders Table
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

ALTER TABLE special_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public select on special_orders" ON special_orders FOR SELECT USING (true);
CREATE POLICY "Allow public insert on special_orders" ON special_orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all actions for admins on special_orders" ON special_orders USING (auth.role() = 'authenticated');

-- 12. Create storage bucket for LELA media uploads
-- Note: You should create the bucket 'lela-media' manually in the Supabase Storage dashboard 
-- and set its visibility to PUBLIC.

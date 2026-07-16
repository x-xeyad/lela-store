-- ERP & ACCOUNTING SYSTEM MIGRATION SCRIPT FOR LELA STORE (SUPABASE)
-- Copy and run this script in your Supabase SQL Editor to initialize all ERP tables, policies, and columns.

-- 1. Suppliers Table
CREATE TABLE IF NOT EXISTS suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  country TEXT,
  address TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Shipping Companies Table
CREATE TABLE IF NOT EXISTS shipping_companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  country TEXT NOT NULL,
  city TEXT NOT NULL,
  cost_per_kg NUMERIC NOT NULL DEFAULT 0,
  fixed_fees NUMERIC NOT NULL DEFAULT 0,
  extra_fees NUMERIC NOT NULL DEFAULT 0,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Purchases Table
CREATE TABLE IF NOT EXISTS purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  purchase_date DATE NOT NULL DEFAULT CURRENT_DATE,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  purchase_cost NUMERIC NOT NULL DEFAULT 0,
  shipping_cost NUMERIC NOT NULL DEFAULT 0,
  weight NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'EGP',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Stock Movements Table
CREATE TABLE IF NOT EXISTS stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  movement_type TEXT NOT NULL CHECK (movement_type IN ('purchase', 'sale', 'manual_adjustment', 'order_cancelled', 'order_returned')),
  quantity INTEGER NOT NULL,
  description TEXT,
  reference_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Expenses Table
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL CHECK (category IN ('Rent', 'Salaries', 'Marketing', 'Packaging', 'Shipping', 'Utilities', 'Miscellaneous')),
  amount NUMERIC NOT NULL DEFAULT 0,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  description TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Supplier Payments Table
CREATE TABLE IF NOT EXISTS supplier_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID REFERENCES suppliers(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL DEFAULT 0,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Add Cost and Accounting Columns to Products Table (Safe checking)
ALTER TABLE products ADD COLUMN IF NOT EXISTS packaging_cost NUMERIC NOT NULL DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS shipping_cost NUMERIC NOT NULL DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS purchase_cost NUMERIC NOT NULL DEFAULT 0;

-- 8. Add Shipping Cost Column to Orders Table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_cost_egp NUMERIC NOT NULL DEFAULT 0;

-- 9. Enable Row Level Security (RLS) policies
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipping_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_payments ENABLE ROW LEVEL SECURITY;

-- Create Policies (Public Select Read-Only)
CREATE POLICY "Allow public select on suppliers" ON suppliers FOR SELECT USING (true);
CREATE POLICY "Allow public select on shipping_companies" ON shipping_companies FOR SELECT USING (true);
CREATE POLICY "Allow public select on purchases" ON purchases FOR SELECT USING (true);
CREATE POLICY "Allow public select on stock_movements" ON stock_movements FOR SELECT USING (true);
CREATE POLICY "Allow public select on expenses" ON expenses FOR SELECT USING (true);
CREATE POLICY "Allow public select on supplier_payments" ON supplier_payments FOR SELECT USING (true);

-- Create Policies (Admin All Access)
CREATE POLICY "Allow all actions for admins on suppliers" ON suppliers USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all actions for admins on shipping_companies" ON shipping_companies USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all actions for admins on purchases" ON purchases USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all actions for admins on stock_movements" ON stock_movements USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all actions for admins on expenses" ON expenses USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all actions for admins on supplier_payments" ON supplier_payments USING (auth.role() = 'authenticated');

-- Also allow public insert on stock_movements and orders (for checkout reductions)
CREATE POLICY "Allow client insert on stock_movements" ON stock_movements FOR INSERT WITH CHECK (true);

-- 10. Seed Default Values for ERP Tables
INSERT INTO suppliers (name, phone, email, country, address, notes)
VALUES 
('Cairo Cosmetics Wholesalers', '+201012345678', 'info@cairocosmetics.com', 'Egypt', 'Al-Muski, Cairo', 'Primary supplier of perfumes and skin products.'),
('Egyptian Apparel Co.', '+201187654321', 'sales@egyapparel.com', 'Egypt', 'El-Mahalla El-Kubra', 'Supplier of linen dresses and home cotton textiles.')
ON CONFLICT DO NOTHING;

INSERT INTO shipping_companies (company_name, country, city, cost_per_kg, fixed_fees, extra_fees, date)
VALUES
('Yemen Express Cargo', 'Yemen', 'Sanaa', 250, 50, 0, CURRENT_DATE),
('Yemen Express Cargo', 'Yemen', 'Aden', 300, 50, 0, CURRENT_DATE),
('Al-Buraq Sourcing Delivery', 'Yemen', 'Taiz', 280, 60, 0, CURRENT_DATE),
('Al-Buraq Sourcing Delivery', 'Yemen', 'Hadhramaut', 350, 80, 0, CURRENT_DATE)
ON CONFLICT DO NOTHING;

INSERT INTO expenses (category, amount, date, description, notes)
VALUES
('Marketing', 1500, CURRENT_DATE, 'Facebook and Instagram ads campaign targeting Yemen customers', 'Paid via Visa'),
('Packaging', 300, CURRENT_DATE, 'Custom luxury cardboard boxes and branding ribbons', 'Cash payment'),
('Rent', 2500, CURRENT_DATE, 'Cairo consolidation warehouse monthly rent portion', 'Bank transfer')
ON CONFLICT DO NOTHING;

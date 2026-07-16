-- 1. Create Profiles Table & Triggers
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'owner' CHECK (role IN ('owner', 'manager', 'warehouse', 'accountant', 'sales', 'support')),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public select on profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Allow write access for owners on profiles" ON public.profiles FOR ALL USING (true);

-- Trigger to auto-create profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (new.id, new.email, 'owner')
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. Create Treasury Transactions Table
CREATE TABLE IF NOT EXISTS public.treasury_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('cash_in', 'cash_out', 'deposit', 'withdrawal', 'manual_adjustment')),
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'EGP',
  exchange_rate NUMERIC NOT NULL DEFAULT 1.0,
  description TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.treasury_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public select on treasury" ON public.treasury_transactions FOR SELECT USING (true);
CREATE POLICY "Allow write access for admins on treasury" ON public.treasury_transactions FOR ALL USING (true);

-- 3. Create Sales Representatives Table
CREATE TABLE IF NOT EXISTS public.representatives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT,
  city TEXT,
  address TEXT,
  notes TEXT,
  commission_type TEXT NOT NULL DEFAULT 'percentage' CHECK (commission_type IN ('percentage', 'fixed')),
  commission_value NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.representatives ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public select on representatives" ON public.representatives FOR SELECT USING (true);
CREATE POLICY "Allow write access for admins on representatives" ON public.representatives FOR ALL USING (true);

-- 4. Create Representative Payments Table
CREATE TABLE IF NOT EXISTS public.representative_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  representative_id UUID REFERENCES public.representatives(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  payment_date TEXT NOT NULL,
  payment_method TEXT NOT NULL DEFAULT 'Cash',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.representative_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public select on representative_payments" ON public.representative_payments FOR SELECT USING (true);
CREATE POLICY "Allow write access for admins on representative_payments" ON public.representative_payments FOR ALL USING (true);

-- 5. Add representative_id to orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS representative_id UUID REFERENCES public.representatives(id) ON DELETE SET NULL;

-- 6. Create Wholesalers Table
CREATE TABLE IF NOT EXISTS public.wholesalers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  contact_person TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  tax_number TEXT,
  custom_discount NUMERIC DEFAULT 0,
  credit_limit NUMERIC DEFAULT 0,
  payment_terms TEXT,
  price_list_id TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.wholesalers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public select on wholesalers" ON public.wholesalers FOR SELECT USING (true);
CREATE POLICY "Allow write access for admins on wholesalers" ON public.wholesalers FOR ALL USING (true);

-- 7. Create Wholesaler Special Prices Table
CREATE TABLE IF NOT EXISTS public.wholesaler_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wholesaler_id UUID REFERENCES public.wholesalers(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  special_price NUMERIC NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(wholesaler_id, product_id)
);

ALTER TABLE public.wholesaler_prices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public select on wholesaler_prices" ON public.wholesaler_prices FOR SELECT USING (true);
CREATE POLICY "Allow write access for admins on wholesaler_prices" ON public.wholesaler_prices FOR ALL USING (true);

-- 8. Create Wholesale Invoices Table
CREATE TABLE IF NOT EXISTS public.wholesale_invoices (
  id TEXT PRIMARY KEY,
  wholesaler_id UUID REFERENCES public.wholesalers(id) ON DELETE RESTRICT,
  invoice_date TEXT NOT NULL,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  shipping NUMERIC DEFAULT 0,
  total NUMERIC NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'partially_paid', 'paid')),
  payment_due_date TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.wholesale_invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public select on wholesale_invoices" ON public.wholesale_invoices FOR SELECT USING (true);
CREATE POLICY "Allow write access for admins on wholesale_invoices" ON public.wholesale_invoices FOR ALL USING (true);

-- 9. Create Wholesale Payments Table
CREATE TABLE IF NOT EXISTS public.wholesale_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wholesaler_id UUID REFERENCES public.wholesalers(id) ON DELETE CASCADE,
  invoice_id TEXT REFERENCES public.wholesale_invoices(id) ON DELETE SET NULL,
  amount NUMERIC NOT NULL,
  payment_date TEXT NOT NULL,
  payment_method TEXT NOT NULL DEFAULT 'Cash',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.wholesale_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public select on wholesale_payments" ON public.wholesale_payments FOR SELECT USING (true);
CREATE POLICY "Allow write access for admins on wholesale_payments" ON public.wholesale_payments FOR ALL USING (true);

-- 10. Create Product Cost History Table
CREATE TABLE IF NOT EXISTS public.product_cost_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  purchase_cost NUMERIC NOT NULL,
  packaging_cost NUMERIC DEFAULT 0,
  shipping_cost NUMERIC DEFAULT 0,
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
  purchase_date TEXT NOT NULL,
  landed_cost NUMERIC NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.product_cost_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public select on product_cost_history" ON public.product_cost_history FOR SELECT USING (true);
CREATE POLICY "Allow write access for admins on product_cost_history" ON public.product_cost_history FOR ALL USING (true);

-- 11. Add Smart Stock tracking columns to products
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS reserved_stock INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS incoming_stock INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS damaged_stock INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS returned_stock INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS sold_quantity INTEGER NOT NULL DEFAULT 0;

-- 12. Add fields to stock_movements
ALTER TABLE public.stock_movements ADD COLUMN IF NOT EXISTS reason TEXT;
ALTER TABLE public.stock_movements ADD COLUMN IF NOT EXISTS reference_id TEXT;

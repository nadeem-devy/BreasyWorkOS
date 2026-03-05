-- ============================================================
-- Bubble Mirror Tables + Sync State
-- Mirrors Bubble.io data (Work Orders, Invoices, Vendor Bills)
-- into Supabase for full reconciliation alongside webhooks.
-- ============================================================

-- 1. Sync state tracking
CREATE TABLE bubble_sync_state (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  data_type TEXT NOT NULL UNIQUE,
  last_incremental_sync_at TIMESTAMPTZ,
  last_full_reconcile_at TIMESTAMPTZ,
  last_record_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO bubble_sync_state (data_type) VALUES
  ('work_orders'),
  ('invoices'),
  ('vendor_bills');

CREATE TRIGGER update_bubble_sync_state_updated_at
  BEFORE UPDATE ON bubble_sync_state
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 2. Work Orders mirror
CREATE TABLE bubble_work_orders (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  bubble_thing_id TEXT NOT NULL UNIQUE,
  wo_number TEXT,
  status TEXT,
  stage TEXT,
  company TEXT,
  market TEXT,
  property_address TEXT,
  description TEXT,
  category TEXT,
  priority TEXT,
  assigned_vendor_name TEXT,
  assigned_vendor_id TEXT,
  assigned_user_email TEXT,
  scheduled_date DATE,
  completed_date DATE,
  customer_name TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  quote_amount DECIMAL(12, 2),
  approved_amount DECIMAL(12, 2),
  bubble_created_at TIMESTAMPTZ,
  bubble_modified_at TIMESTAMPTZ,
  raw_data JSONB DEFAULT '{}',
  synced_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_bubble_work_orders_updated_at
  BEFORE UPDATE ON bubble_work_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 3. Invoices mirror
CREATE TABLE bubble_invoices (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  bubble_thing_id TEXT NOT NULL UNIQUE,
  invoice_number TEXT,
  wo_id TEXT,
  company TEXT,
  market TEXT,
  status TEXT,
  amount DECIMAL(12, 2),
  currency TEXT DEFAULT 'USD',
  customer_name TEXT,
  customer_email TEXT,
  due_date DATE,
  sent_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  paid_amount DECIMAL(12, 2),
  payment_method TEXT,
  vendor_name TEXT,
  notes TEXT,
  bubble_created_at TIMESTAMPTZ,
  bubble_modified_at TIMESTAMPTZ,
  raw_data JSONB DEFAULT '{}',
  synced_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_bubble_invoices_updated_at
  BEFORE UPDATE ON bubble_invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 4. Vendor Bills mirror
CREATE TABLE bubble_vendor_bills (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  bubble_thing_id TEXT NOT NULL UNIQUE,
  bill_number TEXT,
  wo_id TEXT,
  company TEXT,
  market TEXT,
  status TEXT,
  amount DECIMAL(12, 2),
  currency TEXT DEFAULT 'USD',
  vendor_name TEXT,
  vendor_id TEXT,
  due_date DATE,
  approved_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  payment_method TEXT,
  notes TEXT,
  bubble_created_at TIMESTAMPTZ,
  bubble_modified_at TIMESTAMPTZ,
  raw_data JSONB DEFAULT '{}',
  synced_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_bubble_vendor_bills_updated_at
  BEFORE UPDATE ON bubble_vendor_bills
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 5. Indexes
CREATE INDEX idx_bwo_status ON bubble_work_orders(status);
CREATE INDEX idx_bwo_company ON bubble_work_orders(company);
CREATE INDEX idx_bwo_market ON bubble_work_orders(market);
CREATE INDEX idx_bwo_modified ON bubble_work_orders(bubble_modified_at DESC);
CREATE INDEX idx_bwo_wo_number ON bubble_work_orders(wo_number);

CREATE INDEX idx_bi_invoice_number ON bubble_invoices(invoice_number);
CREATE INDEX idx_bi_wo_id ON bubble_invoices(wo_id);
CREATE INDEX idx_bi_status ON bubble_invoices(status);
CREATE INDEX idx_bi_modified ON bubble_invoices(bubble_modified_at DESC);
CREATE INDEX idx_bi_due_date ON bubble_invoices(due_date);

CREATE INDEX idx_bvb_bill_number ON bubble_vendor_bills(bill_number);
CREATE INDEX idx_bvb_wo_id ON bubble_vendor_bills(wo_id);
CREATE INDEX idx_bvb_status ON bubble_vendor_bills(status);
CREATE INDEX idx_bvb_modified ON bubble_vendor_bills(bubble_modified_at DESC);
CREATE INDEX idx_bvb_vendor ON bubble_vendor_bills(vendor_name);

-- 6. RLS
ALTER TABLE bubble_sync_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE bubble_work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE bubble_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE bubble_vendor_bills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view work orders"
  ON bubble_work_orders FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can view invoices"
  ON bubble_invoices FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can view vendor bills"
  ON bubble_vendor_bills FOR SELECT TO authenticated USING (true);

-- 7. Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE bubble_work_orders;
ALTER PUBLICATION supabase_realtime ADD TABLE bubble_invoices;
ALTER PUBLICATION supabase_realtime ADD TABLE bubble_vendor_bills;

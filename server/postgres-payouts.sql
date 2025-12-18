-- Postgres schema for partner payouts and finance views
-- This does not run in the current SQLite setup. Use in a Postgres migration.

-- ENUMS
DO $$ BEGIN
  CREATE TYPE w9_status AS ENUM ('missing', 'pending', 'approved', 'rejected');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE ledger_type AS ENUM ('earn', 'adjustment', 'payout_debit', 'payout_reversal');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE payout_batch_status AS ENUM ('draft', 'submitted', 'processing', 'completed', 'failed', 'canceled');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE payout_item_status AS ENUM ('queued', 'submitted', 'paid', 'failed', 'returned', 'blocked', 'canceled');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- CORE TABLES
CREATE TABLE IF NOT EXISTS partners (
  id UUID PRIMARY KEY,
  display_name TEXT NOT NULL,
  email TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS partner_payout_accounts (
  partner_id UUID PRIMARY KEY REFERENCES partners(id) ON DELETE CASCADE,
  paypal_email TEXT,
  paypal_email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  paypal_email_verified_at TIMESTAMPTZ,
  w9_status w9_status NOT NULL DEFAULT 'missing',
  w9_submitted_at TIMESTAMPTZ,
  w9_approved_at TIMESTAMPTZ,
  w9_rejected_at TIMESTAMPTZ,
  w9_reject_reason TEXT,
  payout_hold BOOLEAN NOT NULL DEFAULT FALSE,
  hold_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_partner_payout_accounts_paypal_email ON partner_payout_accounts (paypal_email);

CREATE TABLE IF NOT EXISTS payout_email_verifications (
  id UUID PRIMARY KEY,
  partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  paypal_email TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_verif_partner_active ON payout_email_verifications (partner_id, expires_at);

CREATE TABLE IF NOT EXISTS partner_balances (
  partner_id UUID PRIMARY KEY REFERENCES partners(id) ON DELETE CASCADE,
  available_cents BIGINT NOT NULL DEFAULT 0,
  pending_cents BIGINT NOT NULL DEFAULT 0,
  currency CHAR(3) NOT NULL DEFAULT 'USD',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ledger_transactions (
  id UUID PRIMARY KEY,
  partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  type ledger_type NOT NULL,
  amount_cents BIGINT NOT NULL CHECK (amount_cents <> 0),
  currency CHAR(3) NOT NULL DEFAULT 'USD',
  reference_type TEXT NOT NULL,
  reference_id UUID NOT NULL,
  memo TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ledger_partner_created ON ledger_transactions (partner_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ledger_reference ON ledger_transactions (reference_type, reference_id);

CREATE TABLE IF NOT EXISTS payout_batches (
  id UUID PRIMARY KEY,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'USD',
  payout_minimum_cents BIGINT NOT NULL DEFAULT 0,
  status payout_batch_status NOT NULL DEFAULT 'draft',
  idempotency_key TEXT NOT NULL,
  paypal_batch_id TEXT,
  created_by_admin_id UUID NOT NULL,
  dry_run_snapshot JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  submitted_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_payout_batches_idem ON payout_batches (idempotency_key);
CREATE INDEX IF NOT EXISTS idx_payout_batches_status_created ON payout_batches (status, created_at DESC);

CREATE TABLE IF NOT EXISTS payout_items (
  id UUID PRIMARY KEY,
  batch_id UUID NOT NULL REFERENCES payout_batches(id) ON DELETE CASCADE,
  partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE RESTRICT,
  amount_cents BIGINT NOT NULL CHECK (amount_cents > 0),
  currency CHAR(3) NOT NULL DEFAULT 'USD',
  paypal_receiver TEXT NOT NULL,
  note TEXT,
  status payout_item_status NOT NULL DEFAULT 'queued',
  paypal_item_id TEXT,
  paypal_payout_item_id TEXT,
  failure_reason TEXT,
  attempt_count INT NOT NULL DEFAULT 0,
  submitted_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_payout_items_batch_status ON payout_items (batch_id, status);
CREATE INDEX IF NOT EXISTS idx_payout_items_partner ON payout_items (partner_id, created_at DESC);

CREATE TABLE IF NOT EXISTS admin_audit_log (
  id UUID PRIMARY KEY,
  admin_id UUID NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_entity ON admin_audit_log (entity_type, entity_id, created_at DESC);

-- VIEWS
CREATE OR REPLACE VIEW v_payout_batch_summary AS
SELECT
  b.id AS batch_id,
  b.period_start,
  b.period_end,
  b.currency,
  b.payout_minimum_cents,
  b.status,
  b.created_at,
  b.submitted_at,
  b.completed_at,
  b.paypal_batch_id,
  COUNT(i.id) AS total_items,
  COALESCE(SUM(i.amount_cents), 0) AS total_amount_cents,
  COUNT(i.id) FILTER (WHERE i.status = 'paid') AS paid_items,
  COALESCE(SUM(i.amount_cents) FILTER (WHERE i.status = 'paid'), 0) AS paid_amount_cents,
  COUNT(i.id) FILTER (WHERE i.status = 'failed') AS failed_items,
  COALESCE(SUM(i.amount_cents) FILTER (WHERE i.status = 'failed'), 0) AS failed_amount_cents,
  COUNT(i.id) FILTER (WHERE i.status = 'returned') AS returned_items,
  COALESCE(SUM(i.amount_cents) FILTER (WHERE i.status = 'returned'), 0) AS returned_amount_cents,
  COUNT(i.id) FILTER (WHERE i.status IN ('queued','submitted')) AS pending_items,
  COALESCE(SUM(i.amount_cents) FILTER (WHERE i.status IN ('queued','submitted')), 0) AS pending_amount_cents
FROM payout_batches b
LEFT JOIN payout_items i ON i.batch_id = b.id
GROUP BY b.id, b.period_start, b.period_end, b.currency, b.payout_minimum_cents,
  b.status, b.created_at, b.submitted_at, b.completed_at, b.paypal_batch_id;

CREATE OR REPLACE VIEW v_payout_batch_items AS
SELECT
  b.id AS batch_id,
  i.id AS item_id,
  i.partner_id,
  p.display_name AS partner_display_name,
  i.paypal_receiver,
  i.amount_cents,
  i.currency,
  i.status,
  i.failure_reason,
  i.attempt_count,
  i.submitted_at,
  i.paid_at,
  i.created_at,
  b.paypal_batch_id,
  i.paypal_payout_item_id
FROM payout_items i
JOIN payout_batches b ON b.id = i.batch_id
JOIN partners p ON p.id = i.partner_id;

CREATE OR REPLACE VIEW v_payout_batch_items_masked AS
SELECT
  batch_id,
  item_id,
  partner_id,
  partner_display_name,
  CASE
    WHEN POSITION('@' IN paypal_receiver) > 1 THEN
      SUBSTRING(paypal_receiver FROM 1 FOR 1) || '***' ||
      SUBSTRING(paypal_receiver FROM POSITION('@' IN paypal_receiver))
    ELSE '***'
  END AS paypal_receiver_masked,
  amount_cents,
  currency,
  status,
  failure_reason,
  attempt_count,
  submitted_at,
  paid_at,
  created_at,
  paypal_batch_id,
  paypal_payout_item_id
FROM v_payout_batch_items;

CREATE OR REPLACE VIEW v_1099_prep_totals AS
SELECT
  EXTRACT(YEAR FROM i.paid_at)::INT AS tax_year,
  i.partner_id,
  p.display_name AS partner_display_name,
  SUM(i.amount_cents)::BIGINT AS total_paid_cents,
  i.currency
FROM payout_items i
JOIN partners p ON p.id = i.partner_id
WHERE i.status = 'paid' AND i.paid_at IS NOT NULL
GROUP BY EXTRACT(YEAR FROM i.paid_at)::INT, i.partner_id, p.display_name, i.currency;

CREATE OR REPLACE VIEW v_payout_items_stuck AS
SELECT
  b.id AS batch_id,
  b.status AS batch_status,
  b.paypal_batch_id,
  i.id AS item_id,
  i.partner_id,
  p.display_name AS partner_display_name,
  i.paypal_receiver,
  i.amount_cents,
  i.currency,
  i.status AS item_status,
  i.attempt_count,
  i.submitted_at,
  now() - i.submitted_at AS time_since_submitted,
  i.failure_reason
FROM payout_items i
JOIN payout_batches b ON b.id = i.batch_id
JOIN partners p ON p.id = i.partner_id
WHERE i.submitted_at IS NOT NULL
  AND i.status IN ('queued','submitted')
  AND i.submitted_at < (now() - INTERVAL '24 hours')
  AND b.status IN ('submitted','processing')
ORDER BY i.submitted_at ASC;

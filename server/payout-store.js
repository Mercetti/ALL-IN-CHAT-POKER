/**
 * Postgres-backed payout store (isolated from SQLite game state).
 * Requires process.env.DATABASE_URL to be set (standard Postgres URI).
 */
const { Pool } = require('pg');
const { buildPayoutIdempotencyKey } = require('./payout-utils');

const connectionString = process.env.DATABASE_URL;
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID || '';
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET || '';
// Use sandbox by setting PAYPAL_BASE_URL=https://api-m.sandbox.paypal.com
const PAYPAL_BASE_URL = process.env.PAYPAL_BASE_URL || 'https://api-m.paypal.com';

let pool = null;
function getPool() {
  if (!connectionString) return null;
  if (!pool) {
    pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });
  }
  return pool;
}

async function withClient(fn) {
  const p = getPool();
  if (!p) throw new Error('postgres_unavailable');
  const client = await p.connect();
  try {
    return await fn(client);
  } finally {
    client.release();
  }
}

async function runSqlFile(client, sqlText) {
  await client.query(sqlText);
}

// PayPal helpers
async function getPayPalToken() {
  if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) throw new Error('paypal_missing_creds');
  const creds = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');
  const res = await fetch(`${PAYPAL_BASE_URL}/v1/oauth2/token`, {
    method: 'POST',
    headers: { Authorization: `Basic ${creds}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=client_credentials',
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`paypal_token_failed:${res.status}:${text}`);
  }
  const data = await res.json();
  return data.access_token;
}

function centsToValue(cents) {
  return (Number(cents || 0) / 100).toFixed(2);
}

// Partner summary for dashboard (eligibility + balances + stats)
async function getPartnerSummary(partnerId) {
  return withClient(async (client) => {
    const partner = await client.query(
      `
        SELECT p.id, p.display_name, p.is_active,
               a.paypal_email, a.paypal_email_verified, a.w9_status, a.payout_hold, a.hold_reason,
               b.available_cents, b.pending_cents, b.currency
        FROM partners p
        JOIN partner_payout_accounts a ON a.partner_id = p.id
        LEFT JOIN partner_balances b ON b.partner_id = p.id
        WHERE p.id = $1
      `,
      [partnerId]
    );
    if (!partner.rows.length) return null;
    const stats = await client.query(
      `
        SELECT COUNT(i.id) AS orders,
               COALESCE(SUM(i.amount_cents),0) AS amount_cents,
               COALESCE(SUM(CASE WHEN i.status='paid' THEN i.amount_cents ELSE 0 END),0) AS paid_cents,
               COALESCE(MAX(i.paid_at), NULL) AS last_paid_at
        FROM payout_items i
        WHERE i.partner_id = $1
      `,
      [partnerId]
    );
    return { partner: partner.rows[0], stats: stats.rows[0] };
  });
}

// Admin: list partners with stats
async function listPartnersWithStats() {
  return withClient(async (client) => {
    const res = await client.query(`
      SELECT p.id, p.display_name, p.is_active,
             a.paypal_email, a.paypal_email_verified, a.w9_status, a.payout_hold, a.hold_reason,
             COALESCE(b.available_cents,0) AS available_cents, COALESCE(b.pending_cents,0) AS pending_cents, COALESCE(b.currency,'USD') AS currency,
             COALESCE(s.orders,0) AS orders,
             COALESCE(s.amount_cents,0) AS amount_cents,
             COALESCE(s.paid_cents,0) AS paid_cents,
             s.last_paid_at
      FROM partners p
      LEFT JOIN partner_payout_accounts a ON a.partner_id = p.id
      LEFT JOIN partner_balances b ON b.partner_id = p.id
      LEFT JOIN (
        SELECT partner_id,
               COUNT(id) AS orders,
               SUM(amount_cents) AS amount_cents,
               SUM(CASE WHEN status='paid' THEN amount_cents ELSE 0 END) AS paid_cents,
               MAX(paid_at) AS last_paid_at
        FROM payout_items
        GROUP BY partner_id
      ) s ON s.partner_id = p.id
      ORDER BY p.display_name
    `);
    return res.rows;
  });
}

// Admin: dry run (preview only; eligibility logic simplified)
async function payoutDryRun({ periodStart, periodEnd, currency, payoutMinimumCents, noteTemplate }) {
  return withClient(async (client) => {
    // This uses balances + gating flags; adjust eligibility as needed.
    const eligible = await client.query(
      `
        SELECT p.id AS partner_id,
               COALESCE(b.available_cents,0) AS available_cents,
               a.paypal_email,
               a.w9_status,
               a.paypal_email_verified,
               a.payout_hold
        FROM partners p
        JOIN partner_payout_accounts a ON a.partner_id = p.id
        LEFT JOIN partner_balances b ON b.partner_id = p.id
        WHERE p.is_active = TRUE
          AND a.w9_status = 'approved'
          AND a.paypal_email_verified = TRUE
          AND a.payout_hold = FALSE
          AND COALESCE(b.available_cents,0) >= $1
      `,
      [payoutMinimumCents]
    );
    const items = eligible.rows.map((r) => ({
      partnerId: r.partner_id,
      receiver: r.paypal_email,
      amountCents: Number(r.available_cents || 0),
      currency: currency || 'USD',
    }));
    const idempotency_key = buildPayoutIdempotencyKey({
      periodStart,
      periodEnd,
      currency: currency || 'USD',
      payoutMinimumCents,
      noteTemplate: noteTemplate || '',
      items,
    });
    const total = items.reduce((sum, i) => sum + (i.amountCents || 0), 0);
    return {
      idempotency_key,
      summary: {
        partner_count: items.length,
        total_amount_cents: total,
        currency: currency || 'USD',
        payout_minimum_cents: payoutMinimumCents,
      },
      items_preview: items,
    };
  });
}

// Admin: submit payout batch with PayPal call
async function payoutSubmit({ periodStart, periodEnd, currency, payoutMinimumCents, noteTemplate, items, idempotencyKey, adminId }) {
  // Phase 1: reserve and create batch/items
  let batchId = null;
  const idem = idempotencyKey || buildPayoutIdempotencyKey({
    periodStart,
    periodEnd,
    currency: currency || 'USD',
    payoutMinimumCents,
    noteTemplate: noteTemplate || '',
    items,
  });
  await withClient(async (client) => {
    await client.query('BEGIN');
    const existing = await client.query('SELECT * FROM payout_batches WHERE idempotency_key = $1 FOR UPDATE', [idem]);
    if (existing.rows.length) {
      batchId = existing.rows[0].id;
    } else {
      const ins = await client.query(
        `INSERT INTO payout_batches (id, period_start, period_end, currency, payout_minimum_cents, status, idempotency_key, created_by_admin_id, dry_run_snapshot)
         VALUES (gen_random_uuid(), $1, $2, $3, $4, 'draft', $5, $6, $7)
         RETURNING id`,
        [periodStart, periodEnd, currency || 'USD', payoutMinimumCents, idem, adminId || '00000000-0000-0000-0000-000000000000', JSON.stringify(items)]
      );
      batchId = ins.rows[0].id;
      for (const it of items) {
        const itemIns = await client.query(
          `INSERT INTO payout_items (id, batch_id, partner_id, amount_cents, currency, paypal_receiver, status)
           VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, 'queued') RETURNING id`,
          [batchId, it.partnerId, it.amountCents, currency || 'USD', it.receiver]
        );
        it._itemId = itemIns.rows[0].id;
        await client.query(
          `INSERT INTO ledger_transactions (id, partner_id, type, amount_cents, currency, reference_type, reference_id, memo)
           VALUES (gen_random_uuid(), $1, 'payout_debit', $2 * -1, $3, 'payout_batch', $4, 'payout reserve')`,
          [it.partnerId, it.amountCents, currency || 'USD', batchId]
        );
        await client.query(
          `INSERT INTO partner_balances (partner_id, available_cents, pending_cents, currency)
           VALUES ($1, 0, $2, $3)
           ON CONFLICT (partner_id) DO UPDATE SET
             available_cents = partner_balances.available_cents - EXCLUDED.pending_cents,
             pending_cents = partner_balances.pending_cents + EXCLUDED.pending_cents,
             updated_at = now()`,
          [it.partnerId, it.amountCents, currency || 'USD']
        );
      }
    }
    await client.query('UPDATE payout_batches SET status = $2, submitted_at = now() WHERE id = $1', [batchId, 'submitted']);
    await client.query('COMMIT');
  });

  // Phase 2: PayPal submission (outside transaction)
  let paypalBatchId = null;
  try {
    const token = await getPayPalToken();
    const payload = {
      sender_batch_header: {
        sender_batch_id: batchId,
        email_subject: 'You received a payout from All-In Chat Poker',
        email_message: 'All-In Chat Poker Partner payout',
      },
      items: items.map((it) => ({
        recipient_type: 'EMAIL',
        receiver: it.receiver,
        amount: { value: centsToValue(it.amountCents), currency: (currency || 'USD').toUpperCase() },
        note: noteTemplate || 'All-In Chat Poker Partner payout',
        sender_item_id: it._itemId || it.partnerId,
      })),
    };
    const res = await fetch(`${PAYPAL_BASE_URL}/v1/payments/payouts`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'PayPal-Request-Id': idem,
      },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(`paypal_payout_failed:${res.status}:${JSON.stringify(data)}`);
    paypalBatchId = data?.batch_header?.payout_batch_id || null;
    if (Array.isArray(data?.items)) {
      await withClient(async (c2) => {
        for (const itRes of data.items) {
          const senderItemId = itRes?.payout_item?.sender_item_id;
          const payoutItemId = itRes?.payout_item_id;
          if (!senderItemId || !payoutItemId) continue;
          await c2.query(
            `UPDATE payout_items SET status='submitted', paypal_item_id=$2, paypal_payout_item_id=$3, submitted_at=now() WHERE id = $1`,
            [senderItemId, itRes?.payout_item?.sender_item_id || null, payoutItemId]
          );
        }
        await c2.query('UPDATE payout_batches SET paypal_batch_id = $2 WHERE id = $1', [batchId, paypalBatchId]);
      });
    }
  } catch (err) {
    await withClient(async (c3) => {
      await c3.query('UPDATE payout_batches SET status = $2, completed_at = now() WHERE id = $1', [batchId, 'failed']);
    });
    throw err;
  }

  const total = items.reduce((sum, i) => sum + (i.amountCents || 0), 0);
  return {
    batch_id: batchId,
    status: 'submitted',
    paypal_batch_id: paypalBatchId,
    summary: { partner_count: items.length, total_amount_cents: total, currency: currency || 'USD' },
    idempotency_key: idem,
  };
}

async function getBatchDetail(batchId) {
  return withClient(async (client) => {
    const batch = await client.query('SELECT * FROM payout_batches WHERE id = $1', [batchId]);
    if (!batch.rows.length) return null;
    const items = await client.query(
      `SELECT i.*, p.display_name FROM payout_items i JOIN partners p ON p.id = i.partner_id WHERE i.batch_id = $1 ORDER BY i.created_at ASC`,
      [batchId]
    );
    return { batch: batch.rows[0], items: items.rows };
  });
}

function mapPayPalStatus(s) {
  const status = (s || '').toUpperCase();
  if (status === 'SUCCESS') return 'paid';
  if (status === 'PENDING' || status === 'PROCESSING' || status === 'UNCLAIMED') return 'submitted';
  if (status === 'RETURNED') return 'returned';
  return 'failed';
}

async function reconcileBatch(batchId) {
  return withClient(async (client) => {
    const batchRes = await client.query('SELECT * FROM payout_batches WHERE id = $1', [batchId]);
    if (!batchRes.rows.length) throw new Error('batch_not_found');
    const batch = batchRes.rows[0];
    if (!batch.paypal_batch_id) return { batch_id: batchId, status: batch.status, note: 'no_paypal_batch_id' };
    const token = await getPayPalToken();
    const res = await fetch(`${PAYPAL_BASE_URL}/v1/payments/payouts/${batch.paypal_batch_id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(`paypal_reconcile_failed:${res.status}:${JSON.stringify(data)}`);

    const items = data?.items || [];
    await client.query('BEGIN');
    for (const it of items) {
      const paypalItemId = it.payout_item_id;
      const mapped = mapPayPalStatus(it.transaction_status);
      const note = it.errors?.name || it.errors?.message || null;
      await client.query(
        `UPDATE payout_items
         SET status = $2,
             failure_reason = $3,
             paid_at = CASE WHEN $2 = 'paid' THEN now() ELSE paid_at END,
             updated_at = now()
         WHERE paypal_payout_item_id = $1`,
        [paypalItemId, mapped, note]
      );
      if (mapped === 'paid') {
        const row = await client.query('SELECT partner_id, amount_cents FROM payout_items WHERE paypal_payout_item_id = $1', [paypalItemId]);
        if (row.rows.length) {
          const { partner_id, amount_cents } = row.rows[0];
          await client.query(
            `INSERT INTO ledger_transactions (id, partner_id, type, amount_cents, currency, reference_type, reference_id, memo)
             VALUES (gen_random_uuid(), $1, 'payout_reversal', $2 * -1, $3, 'payout_batch', $4, 'payout settled')`,
            [partner_id, amount_cents, batch.currency || 'USD', batchId]
          );
          await client.query(
            `UPDATE partner_balances SET pending_cents = CASE WHEN pending_cents - $2 > 0 THEN pending_cents - $2 ELSE 0 END, updated_at = now() WHERE partner_id = $1`,
            [partner_id, amount_cents]
          );
        }
      }
      if (mapped === 'failed' || mapped === 'returned') {
        const row = await client.query('SELECT partner_id, amount_cents FROM payout_items WHERE paypal_payout_item_id = $1', [paypalItemId]);
        if (row.rows.length) {
          const { partner_id, amount_cents } = row.rows[0];
          await client.query(
            `INSERT INTO ledger_transactions (id, partner_id, type, amount_cents, currency, reference_type, reference_id, memo)
             VALUES (gen_random_uuid(), $1, 'payout_reversal', $2, $3, 'payout_batch', $4, 'payout failed reversal')`,
            [partner_id, amount_cents, batch.currency || 'USD', batchId]
          );
          await client.query(
            `UPDATE partner_balances
             SET pending_cents = CASE WHEN pending_cents - $2 > 0 THEN pending_cents - $2 ELSE 0 END, available_cents = available_cents + $2, updated_at = now()
             WHERE partner_id = $1`,
            [partner_id, amount_cents]
          );
        }
      }
    }
    const paidCount = items.filter(i => mapPayPalStatus(i.transaction_status) === 'paid').length;
    const failedCount = items.filter(i => ['failed','returned'].includes(mapPayPalStatus(i.transaction_status))).length;
    let newStatus = batch.status;
    if (failedCount > 0) newStatus = 'failed';
    else if (paidCount === items.length && items.length > 0) newStatus = 'completed';
    else newStatus = 'processing';
    await client.query('UPDATE payout_batches SET status = $2, completed_at = CASE WHEN $2 = $3 THEN now() ELSE completed_at END WHERE id = $1', [batchId, newStatus, 'completed']);
    await client.query('COMMIT');
    return { batch_id: batchId, status: newStatus };
  });
}

async function exportSummaryCsv({ periodStart, periodEnd }) {
  return withClient(async (client) => {
    const res = await client.query(
      `SELECT * FROM v_payout_batch_summary WHERE period_start = $1 AND period_end = $2 ORDER BY created_at DESC`,
      [periodStart, periodEnd]
    );
    const rows = res.rows;
    if (!rows.length) return '';
    const headers = Object.keys(rows[0]);
    const lines = [headers.join(',')];
    rows.forEach(r => {
      lines.push(headers.map(h => r[h]).join(','));
    });
    return lines.join('\n');
  });
}

async function exportItemsCsv({ batchId, masked = true }) {
  return withClient(async (client) => {
    const view = masked ? 'v_payout_batch_items_masked' : 'v_payout_batch_items';
    const res = await client.query(`SELECT * FROM ${view} WHERE batch_id = $1 ORDER BY created_at ASC`, [batchId]);
    if (!res.rows.length) return '';
    const headers = Object.keys(res.rows[0]);
    const lines = [headers.join(',')];
    res.rows.forEach(r => lines.push(headers.map(h => r[h]).join(',')));
    return lines.join('\n');
  });
}

module.exports = {
  getPartnerSummary,
  listPartnersWithStats,
  payoutDryRun,
  payoutSubmit,
  runSqlFile,
  getBatchDetail,
  reconcileBatch,
  exportSummaryCsv,
  exportItemsCsv,
};

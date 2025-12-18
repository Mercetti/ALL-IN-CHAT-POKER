const crypto = require('crypto');

function normalizeEmail(email = '') {
  return String(email).trim().toLowerCase();
}

function sha256Hex(input = '') {
  return crypto.createHash('sha256').update(input, 'utf8').digest('hex');
}

/**
 * Build a deterministic idempotency key for a payout run.
 * Sorts items and hashes a canonical payload to prevent double-submission.
 *
 * @param {Object} params
 * @param {string} params.periodStart - YYYY-MM-DD
 * @param {string} params.periodEnd - YYYY-MM-DD
 * @param {string} params.currency - e.g. USD
 * @param {number} params.payoutMinimumCents - e.g. 5000
 * @param {string} params.noteTemplate - optional; include to make note changes unique
 * @param {Array<{partnerId:string, receiver:string, amountCents:number, currency:string}>} params.items
 * @returns {string} e.g. payout:2026-01-01:2026-01-31:USD:5000:abcd1234...
 */
function buildPayoutIdempotencyKey(params = {}) {
  const sortedItems = [...(params.items || [])]
    .map((i) => ({
      partnerId: i.partnerId,
      receiver: normalizeEmail(i.receiver),
      amountCents: Number(i.amountCents || 0),
      currency: String(i.currency || params.currency || 'USD').toUpperCase(),
    }))
    .sort((a, b) => {
      if (a.partnerId !== b.partnerId) return a.partnerId.localeCompare(b.partnerId);
      if (a.receiver !== b.receiver) return a.receiver.localeCompare(b.receiver);
      return a.amountCents - b.amountCents;
    });

  const canonical = JSON.stringify({
    periodStart: params.periodStart,
    periodEnd: params.periodEnd,
    currency: (params.currency || 'USD').toUpperCase(),
    payoutMinimumCents: Number(params.payoutMinimumCents || 0),
    noteTemplate: params.noteTemplate || '',
    items: sortedItems,
  });

  const hash = sha256Hex(canonical).slice(0, 32);
  return `payout:${params.periodStart}:${params.periodEnd}:${(params.currency || 'USD').toUpperCase()}:${params.payoutMinimumCents}:${hash}`;
}

module.exports = {
  buildPayoutIdempotencyKey,
};

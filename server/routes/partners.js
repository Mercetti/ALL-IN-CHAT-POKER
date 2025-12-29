const { Router } = require('express');

function createPartnersRouter({ auth, validation, payoutStore, logger }) {
  const router = Router();

  // Partner payouts: partner-facing summary (Postgres-only)
  router.get('/payouts', async (req, res) => {
    try {
      const partnerId = auth.extractUserLogin(req);
      if (!validation.validateUsername(partnerId || '')) {
        return res.status(401).json({ error: 'unauthorized' });
      }
      if (!payoutStore || !payoutStore.getPartnerSummary) {
        return res.status(501).json({ error: 'payouts_unavailable' });
      }
      const summary = await payoutStore.getPartnerSummary(partnerId);
      if (!summary) return res.status(404).json({ error: 'not_found' });
      return res.json(summary);
    } catch (err) {
      logger.error('partner payouts fetch failed', { error: err.message });
      return res.status(500).json({ error: 'internal_error' });
    }
  });

  return router;
}

module.exports = { createPartnersRouter };

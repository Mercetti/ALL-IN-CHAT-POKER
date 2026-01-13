const { Router } = require('express');
const logger = require('../utils/logger');

function createCatalogRouter({ db }) {
  const router = Router();

  // Public cosmetic catalog (read-only)
  router.get('/', (_req, res) => {
    try {
      res.json(db.getCatalog());
    } catch (error) {
      logger.error('Catalog fetch error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  return router;
}

module.exports = { createCatalogRouter };

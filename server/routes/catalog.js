const { Router } = require('express');

function createCatalogRouter({ db }) {
  const router = Router();

  // Public cosmetic catalog (read-only)
  router.get('/', (_req, res) => {
    res.json(db.getCatalog());
  });

  return router;
}

module.exports = { createCatalogRouter };

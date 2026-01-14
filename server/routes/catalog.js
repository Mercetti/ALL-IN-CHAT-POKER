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

  // Equip cosmetic for authenticated user
  router.post('/equip', (req, res) => {
    try {
      const { cosmeticId } = req.body;
      const login = req.user?.login || req.session?.login;
      
      if (!login) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      
      if (!cosmeticId) {
        return res.status(400).json({ error: 'Cosmetic ID required' });
      }
      
      const success = db.equipCosmetic(login, cosmeticId);
      
      if (success) {
        res.json({ success: true, message: 'Cosmetic equipped' });
      } else {
        res.status(400).json({ error: 'Failed to equip cosmetic' });
      }
    } catch (error) {
      logger.error('Equip cosmetic error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Get user's cosmetic inventory
  router.get('/inventory', (req, res) => {
    try {
      const login = req.user?.login || req.session?.login;
      
      if (!login) {
        return res.json({ owned: [], equipped: [] });
      }
      
      const inventory = db.getUserInventory(login);
      const owned = inventory.map(item => item.item_id);
      const equipped = inventory
        .filter(item => item.equipped)
        .map(item => item.item_id);
      
      res.json({ owned, equipped });
    } catch (error) {
      logger.error('Get inventory error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Grant cosmetic to user (for free items or admin actions)
  router.post('/grant', (req, res) => {
    try {
      const { cosmeticId } = req.body;
      const login = req.user?.login || req.session?.login;
      
      if (!login) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      
      if (!cosmeticId) {
        return res.status(400).json({ error: 'Cosmetic ID required' });
      }
      
      const result = db.grantCosmetic(login, cosmeticId);
      
      if (result) {
        res.json({ success: true, message: 'Cosmetic granted' });
      } else {
        res.status(400).json({ error: 'Failed to grant cosmetic' });
      }
    } catch (error) {
      logger.error('Grant cosmetic error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  return router;
}

module.exports = { createCatalogRouter };

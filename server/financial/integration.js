/**
 * Game Server Integration for Acey Financial Operations
 * Hooks into existing game events to capture revenue data
 */

const RevenueEventProcessor = require('./revenue-events');

class FinancialIntegration {
  constructor() {
    this.revenueProcessor = new RevenueEventProcessor();
    this.isInitialized = false;
  }

  // Initialize the financial system
  async initialize() {
    await this.revenueProcessor.loadPartnerProfiles();
    this.isInitialized = true;
    
    console.log('💰 Acey Financial Integration initialized');
    console.log('📊 Ready to capture game revenue events');
  }

  // Hook into game events - call this from your game logic
  onGameEnd(gameData) {
    if (!this.isInitialized) {
      console.warn('⚠️ Financial system not initialized');
      return null;
    }

    // Extract revenue data from game
    const revenueEvent = {
      gameId: gameData.gameId,
      partnerId: gameData.partnerId || 'partner_042', // Streamer/channel ID
      rakeAmount: gameData.totalRake || 0,
      playerCount: gameData.playerCount,
      timestamp: new Date().toISOString()
    };

    // Process through Acey Financial Ops
    return this.revenueProcessor.processGameRevenue(revenueEvent);
  }

  // Hook into refund events
  onRefund(refundData) {
    if (!this.isInitialized) return null;

    const refundEvent = {
      originalGameId: refundData.gameId,
      partnerId: refundData.partnerId,
      amountUsd: refundData.refundAmount,
      reason: refundData.reason
    };

    return this.revenueProcessor.processRefund(refundEvent);
  }

  // Monthly payout processing (run via cron job)
  async processMonthlyPayouts() {
    if (!this.isInitialized) {
      throw new Error('Financial system not initialized');
    }

    return await this.revenueProcessor.processMonthlyPayouts();
  }

  // Get PayPal CSV for approved batch
  getPayPalExport(batchId) {
    return this.revenueProcessor.generatePayPalExport(batchId);
  }

  // Get financial reports
  getMonthlyReport(month) {
    return this.revenueProcessor.getMonthlyReport(month);
  }

  // API endpoints for Acey Lab integration
  getApiRoutes() {
    return {
      // Get current month's payout status
      'GET /api/financial/payout-status': async (req, res) => {
        try {
          const currentMonth = new Date().toISOString().slice(0, 7);
          const report = this.getMonthlyReport(currentMonth);
          res.json({ success: true, data: report });
        } catch (error) {
          res.status(500).json({ success: false, error: error.message });
        }
      },

      // Process monthly payouts (admin only)
      'POST /api/financial/process-payouts': async (req, res) => {
        try {
          const payoutData = await this.processMonthlyPayouts();
          res.json({ success: true, data: payoutData });
        } catch (error) {
          res.status(500).json({ success: false, error: error.message });
        }
      },

      // Approve payout batch (owner only)
      'POST /api/financial/approve-batch': async (req, res) => {
        try {
          const { batchId } = req.body;
          // TODO: Verify owner permissions
          const approval = this.revenueProcessor.financialOps.approvePayoutBatch(batchId);
          res.json({ success: true, data: approval });
        } catch (error) {
          res.status(500).json({ success: false, error: error.message });
        }
      },

      // Export PayPal CSV
      'GET /api/financial/export-paypal/:batchId': async (req, res) => {
        try {
          const { batchId } = req.params;
          const csv = this.getPayPalExport(batchId);
          res.setHeader('Content-Type', 'text/csv');
          res.setHeader('Content-Disposition', `attachment; filename="payout-${batchId}.csv"`);
          res.send(csv);
        } catch (error) {
          res.status(500).json({ success: false, error: error.message });
        }
      }
    };
  }
}

// Singleton instance
const financialIntegration = new FinancialIntegration();

// Auto-initialize when module loads
financialIntegration.initialize().catch(console.error);

module.exports = financialIntegration;

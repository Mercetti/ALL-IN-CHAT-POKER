/**
 * Revenue Events Integration
 * Connects game system to Acey Financial Operations
 */

const FinancialOpsEngine = require('../../acey/skills/financial-ops');

class RevenueEventProcessor {
  constructor() {
    this.financialOps = new FinancialOpsEngine();
    this.partnerProfiles = new Map(); // Will be loaded from database
  }

  // Initialize with partner data
  async loadPartnerProfiles() {
    // TODO: Load from actual database
    this.partnerProfiles.set('partner_042', {
      partnerId: 'partner_042',
      displayName: 'Test Streamer',
      payoutMethod: 'paypal',
      payoutReferenceId: 'partner@example.com',
      revenueSharePercent: 35,
      minimumPayoutUsd: 25.00,
      status: 'active'
    });

    console.log('📊 Partner profiles loaded:', this.partnerProfiles.size);
  }

  // Process game revenue events in real-time
  processGameRevenue(gameEvent) {
    const revenueEvent = {
      partnerId: gameEvent.partnerId || 'partner_042', // Default for testing
      amountUsd: gameEvent.rakeAmount || 0,
      source: 'All-In Chat Poker',
      type: 'rake_share',
      referenceId: gameEvent.gameId || `GAME-${Date.now()}`
    };

    // Send to Acey Financial Ops
    const processedEvent = this.financialOps.processRevenueEvent(revenueEvent);
    
    console.log('💰 Revenue processed:', {
      partner: processedEvent.partnerId,
      amount: processedEvent.amountUsd,
      eventId: processedEvent.eventId
    });

    return processedEvent;
  }

  // Process refund events
  processRefund(refundEvent) {
    const revenueEvent = {
      partnerId: refundEvent.partnerId,
      amountUsd: -Math.abs(refundEvent.amountUsd), // Negative for refunds
      source: 'All-In Chat Poker',
      type: 'refund',
      referenceId: refundEvent.originalGameId
    };

    return this.financialOps.processRevenueEvent(revenueEvent);
  }

  // Monthly batch processing (run on 1st of each month)
  async processMonthlyPayouts(month = null) {
    const targetMonth = month || new Date().toISOString().slice(0, 7); // YYYY-MM
    
    console.log('🔄 Processing monthly payouts for:', targetMonth);

    // Get revenue events for the month (TODO: from database)
    const mockRevenueEvents = [
      {
        partnerId: 'partner_042',
        amountUsd: 125.50,
        type: 'rake_share'
      },
      {
        partnerId: 'partner_042', 
        amountUsd: 25.00,
        type: 'rake_share'
      }
    ];

    // Convert to Acey format
    const revenueEvents = mockRevenueEvents.map(event => 
      this.financialOps.processRevenueEvent(event)
    );

    // Prepare payout batch
    const partners = Array.from(this.partnerProfiles.values());
    const payoutData = this.financialOps.prepareMonthlyPayouts(
      targetMonth, 
      revenueEvents, 
      partners
    );

    console.log('📋 Payout batch prepared:', {
      batchId: payoutData.payoutBatch.batchId,
      totalPartners: payoutData.payoutBatch.totalPartners,
      totalAmount: payoutData.payoutBatch.totalPayoutAmount,
      status: payoutData.payoutBatch.status
    });

    return payoutData;
  }

  // Generate PayPal CSV for approved batch
  generatePayPalExport(payoutBatchId) {
    // TODO: Retrieve approved batch from database
    const mockLedgers = [
      {
        month: '2026-01',
        partnerId: 'partner_042',
        grossRevenue: 150.50,
        refunds: 0,
        netRevenue: 150.50,
        partnerCut: 52.68,
        platformCut: 97.82,
        eligibleForPayout: true
      }
    ];

    const csv = this.financialOps.generatePayPalCSV(mockLedgers);
    
    console.log('📄 PayPal CSV generated for manual upload');
    console.log('📝 CSV Preview:', csv.split('\n').slice(0, 3).join('\n'));

    return csv;
  }

  // Get monthly financial report
  getMonthlyReport(month) {
    const summary = {
      totalGrossRevenue: 150.50,
      totalRefunds: 0,
      totalNetRevenue: 150.50,
      totalPartnerCut: 52.68,
      totalPlatformCut: 97.82
    };

    return this.financialOps.generateMonthlyReport(month, summary);
  }
}

// Export for use in game server
module.exports = RevenueEventProcessor;

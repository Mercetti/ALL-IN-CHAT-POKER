/**
 * Acey Financial Operations Skill
 * Prepares partner payouts but NEVER executes payments
 * Founder approval required for all money movements
 */

const FounderMemory = require('../memory/founder-memory');

class FinancialOpsEngine {
  constructor() {
    this.memory = new FounderMemory();
    this.riskLevel = 'high';
    this.requiresOwnerApproval = true;
    this.canExecutePayments = false; // HARD RULE
  }

  // Core safety check - never allow money movement
  validateOperation(operation) {
    const forbidden = ['send_payment', 'execute_payout', 'transfer_funds'];
    
    if (forbidden.includes(operation)) {
      throw new Error(`🚨 FORBIDDEN: Acey cannot execute ${operation}`);
    }
    
    return true;
  }

  // Process revenue events (read-only data collection)
  processRevenueEvent(event) {
    this.validateOperation('process_revenue');
    
    const revenueEvent = {
      eventId: `REV-${Date.now()}`,
      partnerId: event.partnerId,
      source: event.source || 'All-In Chat Poker',
      amountUsd: event.amountUsd,
      type: event.type || 'rake_share',
      timestamp: new Date().toISOString(),
      referenceId: event.referenceId
    };

    // Store in memory for audit trail
    this.memory.createMemory(
      'financial_event',
      `Revenue event processed: ${event.partnerId} - $${event.amountUsd}`,
      `Partner ${event.partnerId} generated ${event.amountUsd} USD from ${event.source}`,
      ['revenue', 'partner', event.partnerId]
    );

    return revenueEvent;
  }

  // Calculate monthly payouts (prep only, no execution)
  prepareMonthlyPayouts(month, revenueEvents, partners) {
    this.validateOperation('prepare_payouts');
    
    const ledger = {};
    
    // Aggregate revenue by partner
    revenueEvents.forEach(event => {
      if (!ledger[event.partnerId]) {
        ledger[event.partnerId] = {
          grossRevenue: 0,
          refunds: 0,
          netRevenue: 0
        };
      }
      
      if (event.type === 'refund') {
        ledger[event.partnerId].refunds += Math.abs(event.amountUsd);
      } else {
        ledger[event.partnerId].grossRevenue += event.amountUsd;
      }
    });

    // Calculate partner cuts and platform cuts
    const monthlyLedgers = [];
    let totalPlatformCut = 0;
    let totalPartnerCut = 0;

    Object.keys(ledger).forEach(partnerId => {
      const partner = partners.find(p => p.partnerId === partnerId);
      if (!partner) {
        // Flag missing partner metadata
        this.flagAnomaly('MISSING_PARTNER_METADATA', partnerId, 'high');
        return;
      }

      const revenue = ledger[partnerId];
      revenue.netRevenue = revenue.grossRevenue - revenue.refunds;
      revenue.partnerCut = revenue.netRevenue * (partner.revenueSharePercent / 100);
      revenue.platformCut = revenue.netRevenue - revenue.partnerCut;
      revenue.eligibleForPayout = revenue.partnerCut >= partner.minimumPayoutUsd;

      totalPlatformCut += revenue.platformCut;
      totalPartnerCut += revenue.partnerCut;

      monthlyLedgers.push({
        month: month,
        partnerId: partnerId,
        grossRevenue: revenue.grossRevenue,
        refunds: revenue.refunds,
        netRevenue: revenue.netRevenue,
        partnerCut: revenue.partnerCut,
        platformCut: revenue.platformCut,
        eligibleForPayout: revenue.eligibleForPayout
      });
    });

    // Create payout batch (AWAITING APPROVAL)
    const payoutBatch = {
      batchId: `PAYOUT-${month}`,
      month: month,
      totalPartners: monthlyLedgers.filter(l => l.eligibleForPayout).length,
      totalPayoutAmount: totalPartnerCut,
      partnersBelowMinimum: monthlyLedgers.filter(l => !l.eligibleForPayout).length,
      anomaliesDetected: this.getAnomalyCount(),
      status: 'awaiting_approval',
      createdAt: new Date().toISOString()
    };

    // Store decision in memory
    this.memory.createMemory(
      'decision',
      `Prepared payout batch ${payoutBatch.batchId} for ${payoutBatch.totalPartners} partners`,
      `Total payout amount: $${payoutBatch.totalPayoutAmount.toFixed(2)}, Status: ${payoutBatch.status}`,
      ['payout-prep', 'monthly', 'financial-ops']
    );

    return {
      payoutBatch,
      monthlyLedgers,
      summary: {
        totalGrossRevenue: monthlyLedgers.reduce((sum, l) => sum + l.grossRevenue, 0),
        totalRefunds: monthlyLedgers.reduce((sum, l) => sum + l.refunds, 0),
        totalNetRevenue: monthlyLedgers.reduce((sum, l) => sum + l.netRevenue, 0),
        totalPartnerCut,
        totalPlatformCut
      }
    };
  }

  // Generate PayPal CSV export (SAFE MODE - no execution)
  generatePayPalCSV(monthlyLedgers) {
    this.validateOperation('generate_csv');
    
    const csvLines = ['Receiver Email,Amount,Currency,Note'];
    
    monthlyLedgers
      .filter(ledger => ledger.eligibleForPayout)
      .forEach(ledger => {
        csvLines.push(`${ledger.partnerId},${ledger.partnerCut.toFixed(2)},USD,All-In Chat Monthly Payout ${ledger.month}`);
      });

    const csvContent = csvLines.join('\n');
    
    this.memory.createMemory(
      'decision',
      `Generated PayPal CSV for ${csvLines.length - 1} partners`,
      'CSV prepared but NOT executed - founder approval required',
      ['paypal-csv', 'export', 'safe-mode']
    );

    return csvContent;
  }

  // Anomaly detection (informational, never blocking)
  flagAnomaly(type, partnerId, severity = 'medium', note = '') {
    const flag = {
      flagId: `FLAG-${Date.now()}`,
      partnerId,
      severity,
      type,
      note,
      createdAt: new Date().toISOString()
    };

    this.memory.createMemory(
      'warning',
      `Financial anomaly flagged: ${type}`,
      `Partner: ${partnerId}, Severity: ${severity}, Note: ${note}`,
      ['anomaly', 'financial-flag', type, partnerId]
    );

    return flag;
  }

  // Get current anomaly count for batch reporting
  getAnomalyCount() {
    const recentMemories = this.memory.getRecentMemories(50);
    return recentMemories.filter(m => 
      m.type === 'warning' && m.tags.includes('anomaly')
    ).length;
  }

  // Founder approval simulation (requires actual human approval)
  approvePayoutBatch(batchId, approvedBy = 'founder') {
    this.validateOperation('approve_batch');
    
    const approval = {
      batchId,
      approvedBy,
      approvedAt: new Date().toISOString(),
      status: 'approved'
    };

    this.memory.createMemory(
      'decision',
      `Payout batch ${batchId} approved by ${approvedBy}`,
      `Batch approved at ${approval.approvedAt}, ready for CSV export`,
      ['payout-approved', 'founder-approval', batchId]
    );

    return approval;
  }

  // Generate investor-ready reports
  generateMonthlyReport(month, summary) {
    const report = {
      month,
      reportGenerated: new Date().toISOString(),
      revenue: {
        gross: summary.totalGrossRevenue,
        refunds: summary.totalRefunds,
        net: summary.totalNetRevenue
      },
      distribution: {
        partnerPayouts: summary.totalPartnerCut,
        platformRevenue: summary.totalPlatformCut,
        platformMargin: ((summary.totalPlatformCut / summary.totalNetRevenue) * 100).toFixed(2) + '%'
      },
      auditTrail: 'All events stored in append-only memory with full traceability'
    };

    this.memory.createMemory(
      'decision',
      `Generated monthly financial report for ${month}`,
      `Revenue: $${summary.totalNetRevenue.toFixed(2)}, Platform margin: ${report.distribution.platformMargin}`,
      ['monthly-report', 'investor-ready', 'financial-summary']
    );

    return report;
  }
}

module.exports = FinancialOpsEngine;

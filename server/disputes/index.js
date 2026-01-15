/**
 * Dispute Workflow System
 * Handles partner disputes with neutral AI assistance and human approval
 */

const db = require('../db');
const logger = require('../logger');
const trustEngine = require('../trust');

class DisputeModule {
  constructor() {
    this.initialized = false;
  }

  async initialize() {
    try {
      await this.ensureDisputeTables();
      this.initialized = true;
      logger.info('Dispute module initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize dispute module:', error);
      throw error;
    }
  }

  async ensureDisputeTables() {
    const tables = [
      `CREATE TABLE IF NOT EXISTS disputes (
        id TEXT PRIMARY KEY,
        partner_id TEXT NOT NULL,
        month TEXT NOT NULL,
        reason TEXT NOT NULL,
        status TEXT DEFAULT 'open',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        resolved_at DATETIME,
        resolution_note TEXT
      )`,
      
      `CREATE TABLE IF NOT EXISTS dispute_evidence (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        dispute_id TEXT NOT NULL,
        evidence_type TEXT NOT NULL,
        evidence_data TEXT,
        uploaded_by TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (dispute_id) REFERENCES disputes(id)
      )`,
      
      `CREATE TABLE IF NOT EXISTS dispute_ledger_entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        dispute_id TEXT NOT NULL,
        ledger_row_id TEXT,
        amount_cents INTEGER,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (dispute_id) REFERENCES disputes(id)
      )`,
      
      `CREATE TABLE IF NOT EXISTS dispute_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        dispute_id TEXT NOT NULL,
        event_type TEXT NOT NULL,
        actor TEXT NOT NULL,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (dispute_id) REFERENCES disputes(id)
      )`
    ];

    for (const table of tables) {
      db.prepare(table).run();
    }
  }

  // Create new dispute
  async createDispute(partnerId, month, reason, evidence = []) {
    try {
      const disputeId = `dispute_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const stmt = db.prepare(`
        INSERT INTO disputes (id, partner_id, month, reason, status)
        VALUES (?, ?, ?, ?, 'open')
      `);
      
      stmt.run(disputeId, partnerId, month, reason);
      
      // Add evidence if provided
      for (const ev of evidence) {
        await this.addEvidence(disputeId, ev.type, ev.data, ev.uploadedBy);
      }
      
      // Add initial event
      await this.addDisputeEvent(disputeId, 'created', 'partner', 'Dispute submitted by partner');
      
      // Log the event
      await this.addDisputeEvent(disputeId, 'created', 'system', `Dispute created: ${reason}`);
      
      logger.info(`Dispute created: ${disputeId} by ${partnerId} for ${month}`);
      
      return {
        success: true,
        dispute: {
          id: disputeId,
          partnerId,
          month,
          reason,
          status: 'open',
          createdAt: new Date().toISOString()
        }
      };
    } catch (error) {
      logger.error('Failed to create dispute:', error);
      return { success: false, error: error.message };
    }
  }

  // Add evidence to dispute
  async addEvidence(disputeId, evidenceType, evidenceData, uploadedBy) {
    try {
      const stmt = db.prepare(`
        INSERT INTO dispute_evidence (dispute_id, evidence_type, evidence_data, uploaded_by)
        VALUES (?, ?, ?, ?)
      `);
      
      stmt.run(disputeId, evidenceType, JSON.stringify(evidenceData), uploadedBy);
      
      await this.addDisputeEvent(disputeId, 'evidence_added', uploadedBy, `Added ${evidenceType} evidence`);
      
      return { success: true };
    } catch (error) {
      logger.error('Failed to add evidence:', error);
      return { success: false, error: error.message };
    }
  }

  // Gather relevant data for dispute
  async gatherDisputeData(disputeId) {
    try {
      const dispute = db.prepare(`
        SELECT * FROM disputes WHERE id = ?
      `).get(disputeId);

      if (!dispute) {
        return { success: false, error: 'Dispute not found' };
      }

      // Get ledger entries for the period
      const ledgerEntries = db.prepare(`
        SELECT * FROM partner_revenue 
        WHERE partner_id = ? 
          AND strftime('%Y-%m', timestamp) = ?
        ORDER BY timestamp DESC
      `).all(dispute.partner_id, dispute.month);

      // Get events during the period
      const events = db.prepare(`
        SELECT * FROM dispute_events 
        WHERE dispute_id = ? 
        ORDER BY created_at ASC
      `).all(disputeId);

      // Get evidence
      const evidence = db.prepare(`
        SELECT * FROM dispute_evidence 
        WHERE dispute_id = ? 
        ORDER BY created_at ASC
      `).all(disputeId);

      // Get refunds for the period
      const refunds = db.prepare(`
        SELECT * FROM refunds 
        WHERE partner_id = ? 
          AND strftime('%Y-%m', created_at) = ?
        ORDER BY created_at DESC
      `).all(dispute.partner_id, dispute.month);

      return {
        success: true,
        disputeData: {
          dispute,
          ledgerEntries,
          events,
          evidence: evidence.map(ev => ({
            ...ev,
            data: JSON.parse(ev.evidence_data || '{}')
          })),
          refunds
        }
      };
    } catch (error) {
      logger.error('Failed to gather dispute data:', error);
      return { success: false, error: error.message };
    }
  }

  // Generate neutral summary using AI
  async generateNeutralSummary(disputeId) {
    try {
      const { disputeData } = await this.gatherDisputeData(disputeId);
      
      if (!disputeData.success) {
        return disputeData;
      }

      const { dispute, ledgerEntries, events, evidence, refunds } = disputeData;
      
      // Calculate key metrics
      const totalRevenue = ledgerEntries.reduce((sum, entry) => sum + entry.amount_cents, 0);
      const totalRefunds = refunds.reduce((sum, refund) => sum + refund.amount_cents, 0);
      const netRevenue = totalRevenue - totalRefunds;
      
      // Generate neutral summary
      const summary = {
        disputeId,
        partnerId: dispute.partner_id,
        month: dispute.month,
        reason: dispute.reason,
        
        // Financial summary
        financialSummary: {
          totalRevenue: totalRevenue / 100,
          totalRefunds: totalRefunds / 100,
          netRevenue: netRevenue / 100,
          transactionCount: ledgerEntries.length,
          refundCount: refunds.length
        },
        
        // Evidence summary
        evidenceSummary: {
          totalPieces: evidence.length,
          types: [...new Set(evidence.map(ev => ev.evidence_type))],
          hasLedgerData: ledgerEntries.length > 0
        },
        
        // Timeline
        timeline: events.map(event => ({
          type: event.event_type,
          actor: event.actor,
          description: event.description,
          timestamp: event.created_at
        })),
        
        // Neutral analysis (without blame)
        neutralAnalysis: {
          revenueConsistency: this.analyzeRevenueConsistency(ledgerEntries),
          refundPatterns: this.analyzeRefundPatterns(refunds),
          evidenceCompleteness: this.analyzeEvidenceCompleteness(evidence),
          recommendations: this.generateRecommendations(dispute, ledgerEntries, refunds, evidence)
        },
        
        generatedAt: new Date().toISOString()
      };

      await this.addDisputeEvent(disputeId, 'summary_generated', 'acey', 'Neutral AI summary generated');
      
      return {
        success: true,
        summary
      };
    } catch (error) {
      logger.error('Failed to generate neutral summary:', error);
      return { success: false, error: error.message };
    }
  }

  analyzeRevenueConsistency(ledgerEntries) {
    if (ledgerEntries.length === 0) return 'No revenue data available';
    
    const revenues = ledgerEntries.map(entry => entry.amount_cents);
    const mean = revenues.reduce((sum, rev) => sum + rev, 0) / revenues.length;
    const variance = revenues.reduce((sum, rev) => sum + Math.pow(rev - mean, 2), 0) / revenues.length;
    const stdDev = Math.sqrt(variance);
    const cv = mean > 0 ? (stdDev / mean) : 1;
    
    if (cv < 0.2) return 'Revenue appears consistent';
    if (cv < 0.5) return 'Revenue shows moderate variation';
    return 'Revenue shows high variation';
  }

  analyzeRefundPatterns(refunds) {
    if (refunds.length === 0) return 'No refunds recorded';
    
    const refundReasons = [...new Set(refunds.map(r => r.reason))];
    const avgRefundAmount = refunds.reduce((sum, r) => sum + r.amount_cents, 0) / refunds.length;
    
    return {
      totalRefunds: refunds.length,
      commonReasons: refundReasons,
      averageAmount: avgRefundAmount / 100
    };
  }

  analyzeEvidenceCompleteness(evidence) {
    const types = [...new Set(evidence.map(ev => ev.evidence_type))];
    const hasScreenshots = types.includes('screenshot');
    const hasLogs = types.includes('logs');
    const hasCommunications = types.includes('communication');
    
    let completeness = 'Limited';
    if (hasScreenshots && hasLogs) completeness = 'Moderate';
    if (hasScreenshots && hasLogs && hasCommunications) completeness = 'Comprehensive';
    
    return completeness;
  }

  generateRecommendations(dispute, ledgerEntries, refunds, evidence) {
    const recommendations = [];
    
    // Revenue-based recommendations
    if (ledgerEntries.length === 0) {
      recommendations.push('Review ledger data for the disputed period - no revenue records found');
    }
    
    // Evidence-based recommendations
    if (evidence.length < 2) {
      recommendations.push('Additional evidence may help resolve this dispute more quickly');
    }
    
    // Refund-based recommendations
    const highRefunds = refunds.filter(r => r.amount_cents > 5000); // > $50
    if (highRefunds.length > 0) {
      recommendations.push('Review large refund amounts for proper authorization');
    }
    
    return recommendations;
  }

  // Update dispute status (owner action)
  async updateDisputeStatus(disputeId, status, resolutionNote, updatedBy) {
    try {
      const validStatuses = ['open', 'reviewing', 'resolved', 'rejected'];
      if (!validStatuses.includes(status)) {
        return { success: false, error: 'Invalid status' };
      }

      const stmt = db.prepare(`
        UPDATE disputes 
        SET status = ?, resolution_note = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `);
      
      const result = stmt.run(status, resolutionNote, disputeId);
      
      if (result.changes === 0) {
        return { success: false, error: 'Dispute not found' };
      }

      // Add resolution timestamp if resolved
      if (status === 'resolved') {
        db.prepare(`
          UPDATE disputes 
          SET resolved_at = CURRENT_TIMESTAMP 
          WHERE id = ?
        `).run(disputeId);
      }

      await this.addDisputeEvent(disputeId, 'status_updated', updatedBy, `Status changed to ${status}`);
      
      logger.info(`Dispute status updated: ${disputeId} -> ${status} by ${updatedBy}`);
      
      return {
        success: true,
        dispute: {
          id: disputeId,
          status,
          resolutionNote,
          updatedAt: new Date().toISOString()
        }
      };
    } catch (error) {
      logger.error('Failed to update dispute status:', error);
      return { success: false, error: error.message };
    }
  }

  // Add event to dispute timeline
  async addDisputeEvent(disputeId, eventType, actor, description) {
    try {
      const stmt = db.prepare(`
        INSERT INTO dispute_events (dispute_id, event_type, actor, description)
        VALUES (?, ?, ?, ?)
      `);
      
      stmt.run(disputeId, eventType, actor, description);
      return { success: true };
    } catch (error) {
      logger.error('Failed to add dispute event:', error);
      return { success: false, error: error.message };
    }
  }

  // Get disputes by status
  async getDisputesByStatus(status = 'open') {
    try {
      const disputes = db.prepare(`
        SELECT 
          d.*,
          COUNT(de.id) as evidence_count
        FROM disputes d
        LEFT JOIN dispute_evidence de ON d.id = de.dispute_id
        WHERE d.status = ?
        GROUP BY d.id
        ORDER BY d.created_at DESC
      `).all(status);

      return {
        success: true,
        disputes: disputes.map(d => ({
          id: d.id,
          partnerId: d.partner_id,
          month: d.month,
          reason: d.reason,
          status: d.status,
          evidenceCount: d.evidence_count,
          createdAt: d.created_at,
          updatedAt: d.updated_at,
          resolvedAt: d.resolved_at
        }))
      };
    } catch (error) {
      logger.error('Failed to get disputes:', error);
      return { success: false, error: error.message };
    }
  }

  // Get dispute details
  async getDisputeDetails(disputeId) {
    try {
      const dispute = db.prepare(`
        SELECT * FROM disputes WHERE id = ?
      `).get(disputeId);

      if (!dispute) {
        return { success: false, error: 'Dispute not found' };
      }

      const evidence = db.prepare(`
        SELECT * FROM dispute_evidence 
        WHERE dispute_id = ? 
        ORDER BY created_at ASC
      `).all(disputeId);

      const events = db.prepare(`
        SELECT * FROM dispute_events 
        WHERE dispute_id = ? 
        ORDER BY created_at ASC
      `).all(disputeId);

      return {
        success: true,
        dispute: {
          ...dispute,
          evidence: evidence.map(ev => ({
            ...ev,
            data: JSON.parse(ev.evidence_data || '{}')
          })),
          events
        }
      };
    } catch (error) {
      logger.error('Failed to get dispute details:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new DisputeModule();

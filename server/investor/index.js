/**
 * Investor Dashboard Module
 * Provides read-only investor metrics and dashboards
 */

const db = require('../db');
const logger = require('../logger');

class InvestorModule {
  constructor() {
    this.initialized = false;
  }

  async initialize() {
    try {
      await this.ensureInvestorTables();
      this.initialized = true;
      logger.info('Investor module initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize investor module:', error);
      throw error;
    }
  }

  async ensureInvestorTables() {
    const tables = [
      `CREATE TABLE IF NOT EXISTS investor_metrics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        month TEXT NOT NULL UNIQUE,
        gross_revenue_cents INTEGER NOT NULL,
        net_revenue_cents INTEGER NOT NULL,
        growth_rate REAL DEFAULT 0,
        active_partners INTEGER DEFAULT 0,
        forecast_next_month_cents INTEGER,
        confidence_score REAL DEFAULT 0.5,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      
      `CREATE TABLE IF NOT EXISTS investor_access_tokens (
        id TEXT PRIMARY KEY,
        token_hash TEXT NOT NULL,
        permissions TEXT DEFAULT 'read_only',
        expires_at DATETIME NOT NULL,
        created_by TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      
      `CREATE TABLE IF NOT EXISTS investor_qa_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        month TEXT NOT NULL,
        question TEXT NOT NULL,
        answer TEXT NOT NULL,
        question_count INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`
    ];

    for (const table of tables) {
      db.db.prepare(table).run();
    }
  }

  // Generate monthly investor dashboard
  async getMonthlyDashboard(month = null) {
    try {
      // Default to current month if not provided
      const targetMonth = month || new Date().toISOString().slice(0, 7);
      
      // Check if dashboard exists for the month
      let dashboard = db.db.prepare(`
        SELECT * FROM investor_metrics 
        WHERE month = ?
      `).get(targetMonth);

      // Generate if doesn't exist or is outdated
      if (!dashboard || this.isDashboardStale(dashboard.updated_at)) {
        dashboard = await this.generateDashboardData(targetMonth);
      }

      // Calculate additional metrics
      const stabilityIndicators = await this.calculateStabilityIndicators(targetMonth);
      const forecastConfidence = await this.getForecastConfidence(targetMonth);

      return {
        success: true,
        dashboard: {
          month: dashboard.month,
          grossRevenue: dashboard.gross_revenue_cents / 100,
          netRevenue: dashboard.net_revenue_cents / 100,
          growthRate: dashboard.growth_rate,
          activePartners: dashboard.active_partners,
          forecastNextMonth: dashboard.forecast_next_month_cents / 100,
          confidence: dashboard.confidence_score,
          stabilityIndicators,
          forecastConfidence,
          generatedAt: dashboard.updated_at
        }
      };
    } catch (error) {
      logger.error('Failed to get investor dashboard:', error);
      return { success: false, error: error.message };
    }
  }

  async generateDashboardData(month) {
    try {
      // Calculate gross revenue (all revenue before refunds)
      const grossRevenue = db.db.prepare(`
        SELECT COALESCE(SUM(amount_cents), 0) as total
        FROM partner_revenue 
        WHERE strftime('%Y-%m', timestamp) = ?
      `).get(month);

      // Calculate net revenue (after refunds)
      const refunds = db.db.prepare(`
        SELECT COALESCE(SUM(amount_cents), 0) as total
        FROM refunds 
        WHERE strftime('%Y-%m', created_at) = ?
      `).get(month);

      const grossRevenueCents = grossRevenue?.total || 0;
      const netRevenueCents = grossRevenueCents - (refunds?.total || 0);

      // Calculate growth rate (vs previous month)
      const previousMonth = new Date(new Date(month + '-01').getTime() - 30 * 24 * 60 * 60 * 1000)
        .toISOString().slice(0, 7);
      
      const previousRevenue = db.db.prepare(`
        SELECT COALESCE(SUM(amount_cents), 0) as total
        FROM partner_revenue 
        WHERE strftime('%Y-%m', timestamp) = ?
      `).get(previousMonth);

      const previousRevenueCents = previousRevenue?.total || 0;
      const growthRate = previousRevenueCents > 0 ? 
        ((grossRevenueCents - previousRevenueCents) / previousRevenueCents) * 100 : 0;

      // Count active partners (with revenue in last 30 days)
      const activePartners = db.db.prepare(`
        SELECT COUNT(DISTINCT partner_id) as count
        FROM partner_revenue 
        WHERE timestamp >= datetime('now', '-30 days')
      `).get();

      // Generate forecast for next month
      const forecast = await this.generateConservativeForecast(month);

      // Store dashboard data
      const stmt = db.db.prepare(`
        INSERT OR REPLACE INTO investor_metrics 
        (month, gross_revenue_cents, net_revenue_cents, growth_rate, 
         active_partners, forecast_next_month_cents, confidence_score)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        month,
        grossRevenueCents,
        netRevenueCents,
        growthRate,
        activePartners?.count || 0,
        forecast.predictedRevenue * 100, // Convert to cents
        forecast.confidence
      );

      return {
        month,
        gross_revenue_cents: grossRevenueCents,
        net_revenue_cents: netRevenueCents,
        growth_rate: growthRate,
        active_partners: activePartners?.count || 0,
        forecast_next_month_cents: forecast.predictedRevenue * 100,
        confidence_score: forecast.confidence,
        updated_at: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Failed to generate dashboard data:', error);
      throw error;
    }
  }

  async generateConservativeForecast(currentMonth) {
    try {
      // Get last 3 months of data for trend analysis
      const threeMonthsAgo = new Date(new Date(currentMonth + '-01').getTime() - 90 * 24 * 60 * 60 * 1000)
        .toISOString().slice(0, 7);
      
      const revenueData = db.db.prepare(`
        SELECT 
          strftime('%Y-%m', timestamp) as month,
          SUM(amount_cents) as revenue_cents
        FROM partner_revenue 
        WHERE strftime('%Y-%m', timestamp) >= ?
        GROUP BY strftime('%Y-%m', timestamp)
        ORDER BY month DESC
        LIMIT 3
      `).all(threeMonthsAgo);

      if (revenueData.length < 2) {
        // Not enough data for forecasting
        return { predictedRevenue: 0, confidence: 0.3 };
      }

      // Simple linear trend forecast (conservative)
      const revenues = revenueData.map(d => d.revenue_cents);
      const avgRevenue = revenues.reduce((sum, rev) => sum + rev, 0) / revenues.length;
      
      // Calculate trend (very conservative)
      let trend = 0;
      if (revenues.length >= 2) {
        const recent = revenues[0]; // Most recent
        const older = revenues[revenues.length - 1]; // Oldest in dataset
        trend = ((recent - older) / older) * 0.1; // Very conservative trend factor
      }

      // Apply trend to average
      const predictedRevenue = Math.max(0, avgRevenue * (1 + trend));
      
      // Confidence based on data consistency
      const variance = revenues.reduce((sum, rev) => sum + Math.pow(rev - avgRevenue, 2), 0) / revenues.length;
      const stdDev = Math.sqrt(variance);
      const cv = avgRevenue > 0 ? (stdDev / avgRevenue) : 1;
      
      let confidence = 0.5;
      if (cv < 0.2) confidence = 0.7;
      else if (cv < 0.5) confidence = 0.5;
      else confidence = 0.3;

      return {
        predictedRevenue: predictedRevenue / 100, // Convert to dollars
        confidence
      };
    } catch (error) {
      logger.error('Failed to generate forecast:', error);
      return { predictedRevenue: 0, confidence: 0.3 };
    }
  }

  async calculateStabilityIndicators(month) {
    try {
      // Revenue stability (last 6 months)
      const revenueStability = db.db.prepare(`
        SELECT 
          COUNT(*) as months_with_data,
          SUM(CASE WHEN amount_cents > 0 THEN 1 ELSE 0 END) as positive_months,
          AVG(amount_cents) as avg_revenue,
          (MAX(amount_cents) - MIN(amount_cents)) as revenue_range
        FROM (
          SELECT 
            strftime('%Y-%m', timestamp) as month,
            SUM(amount_cents) as amount_cents
          FROM partner_revenue 
          WHERE strftime('%Y-%m', timestamp) >= datetime('now', '-6 months')
          GROUP BY strftime('%Y-%m', timestamp)
        )
      `).get();

      // Partner retention
      const partnerRetention = db.db.prepare(`
        SELECT 
          COUNT(DISTINCT partner_id) as current_partners,
          (
            SELECT COUNT(DISTINCT partner_id)
            FROM partner_revenue 
            WHERE strftime('%Y-%m', timestamp) >= datetime('now', '-6 months')
          ) as total_partners_6m
        FROM partner_revenue 
        WHERE strftime('%Y-%m', timestamp) >= datetime('now', '-30 days')
      `).get();

      // Payout processing time
      const payoutEfficiency = db.db.prepare(`
        SELECT 
          COUNT(*) as total_payouts,
          AVG(CASE WHEN processed_at IS NOT NULL THEN 
            julianday(processed_at) - julianday(scheduled_for)
          ELSE NULL END) as avg_processing_days
        FROM payouts 
        WHERE created_at >= datetime('now', '-90 days')
      `).get();

      const indicators = {
        revenueStability: {
          score: this.calculateStabilityScore(revenueStability),
          dataPoints: revenueStability?.months_with_data || 0,
          averageRevenue: (revenueStability?.avg_revenue || 0) / 100
        },
        partnerRetention: {
          currentPartners: partnerRetention?.current_partners || 0,
          totalPartners6m: partnerRetention?.total_partners_6m || 0,
          retentionRate: partnerRetention?.total_partners_6m > 0 ? 
            (partnerRetention?.current_partners / partnerRetention?.total_partners_6m) * 100 : 0
        },
        payoutEfficiency: {
          totalPayouts: payoutEfficiency?.total_payouts || 0,
          averageProcessingDays: payoutEfficiency?.avg_processing_days || 0,
          efficiencyScore: this.calculatePayoutEfficiency(payoutEfficiency)
        }
      };

      return indicators;
    } catch (error) {
      logger.error('Failed to calculate stability indicators:', error);
      return {};
    }
  }

  calculateStabilityScore(data) {
    if (!data || data.months_with_data < 3) return 50;
    
    const positiveMonths = data.positive_months || 0;
    const totalMonths = data.months_with_data;
    const consistencyScore = (positiveMonths / totalMonths) * 100;
    
    const revenueRange = data.revenue_range || 0;
    const avgRevenue = data.avg_revenue || 0;
    const volatilityScore = avgRevenue > 0 ? Math.max(0, 100 - (revenueRange / avgRevenue) * 100) : 50;
    
    return Math.round((consistencyScore * 0.6) + (volatilityScore * 0.4));
  }

  calculatePayoutEfficiency(data) {
    if (!data || data.total_payouts === 0) return 100;
    
    const avgDays = data.avg_processing_days || 0;
    const efficiencyScore = Math.max(0, 100 - (avgDays * 10)); // 10 points per day
    
    return Math.round(efficiencyScore);
  }

  async getForecastConfidence(month) {
    try {
      const forecast = db.db.prepare(`
        SELECT confidence_score 
        FROM revenue_forecasts 
        WHERE forecast_month = ?
      `).get(month);

      return {
        confidence: forecast?.confidence_score || 0.5,
        dataPoints: await this.getForecastDataPoints(month)
      };
    } catch (error) {
      logger.error('Failed to get forecast confidence:', error);
      return { confidence: 0.5, dataPoints: 0 };
    }
  }

  async getForecastDataPoints(month) {
    return db.db.prepare(`
      SELECT COUNT(*) as count
      FROM revenue_forecasts 
      WHERE strftime('%Y-%m', forecast_month) <= ?
    `).get(month).count || 0;
  }

  isDashboardStale(updatedAt) {
    if (!updatedAt) return true;
    
    const staleThreshold = 24 * 60 * 60 * 1000; // 24 hours in ms
    const now = new Date().getTime();
    const lastUpdate = new Date(updatedAt).getTime();
    
    return (now - lastUpdate) > staleThreshold;
  }

  // Generate Q&A summary for investors
  async getQASummary(month = null) {
    try {
      const targetMonth = month || new Date().toISOString().slice(0, 7);
      
      const qaLogs = db.db.prepare(`
        SELECT 
          question,
          answer,
          question_count,
          created_at
        FROM investor_qa_logs 
        WHERE month = ?
        ORDER BY question_count DESC, created_at DESC
      `).all(targetMonth);

      // Cluster similar questions
      const clusteredQA = this.clusterQuestions(qaLogs);
      
      return {
        success: true,
        summary: {
          month: targetMonth,
          totalQuestions: qaLogs.length,
          clusteredQA: clusteredQA,
          generatedAt: new Date().toISOString()
        }
      };
    } catch (error) {
      logger.error('Failed to get Q&A summary:', error);
      return { success: false, error: error.message };
    }
  }

  clusterQuestions(qaLogs) {
    const clusters = {};
    
    for (const qa of qaLogs) {
      // Simple clustering by question keywords
      const category = this.categorizeQuestion(qa.question);
      
      if (!clusters[category]) {
        clusters[category] = {
          category,
          questions: [],
          totalAsked: 0,
          sampleAnswer: ''
        };
      }
      
      clusters[category].questions.push(qa.question);
      clusters[category].totalAsked += qa.question_count;
      
      // Use the most recent answer as sample
      if (!clusters[category].sampleAnswer || qa.created_at > clusters[category].sampleAnswer?.created_at) {
        clusters[category].sampleAnswer = qa.answer;
      }
    }
    
    // Format for output
    return Object.values(clusters).map(cluster => ({
      category: cluster.category,
      questionCount: cluster.totalAsked,
      sampleQuestions: cluster.questions.slice(0, 3), // Top 3 questions
      sampleAnswer: cluster.sampleAnswer
    }));
  }

  categorizeQuestion(question) {
    const lowerQuestion = question.toLowerCase();
    
    if (lowerQuestion.includes('revenue') || lowerQuestion.includes('growth')) {
      return 'Revenue & Growth';
    } else if (lowerQuestion.includes('partner') || lowerQuestion.includes('payout')) {
      return 'Partners & Payouts';
    } else if (lowerQuestion.includes('forecast') || lowerQuestion.includes('prediction')) {
      return 'Forecasts & Predictions';
    } else if (lowerQuestion.includes('dispute') || lowerQuestion.includes('issue')) {
      return 'Disputes & Issues';
    } else if (lowerQuestion.includes('stability') || lowerQuestion.includes('risk')) {
      return 'Stability & Risk';
    } else {
      return 'General & Other';
    }
  }

  // Log investor question for clustering
  async logInvestorQuestion(question, answer) {
    try {
      const month = new Date().toISOString().slice(0, 7);
      
      // Check if similar question exists
      const existingQuestion = db.db.prepare(`
        SELECT COUNT(*) as count
        FROM investor_qa_logs 
        WHERE month = ? AND LOWER(question) LIKE LOWER(?)
      `).get(month, `%${question}%`);

      const questionCount = (existingQuestion?.count || 0) + 1;
      
      const stmt = db.db.prepare(`
        INSERT INTO investor_qa_logs (month, question, answer, question_count)
        VALUES (?, ?, ?, ?)
      `);
      
      stmt.run(month, question, answer, questionCount);
      
      logger.info(`Investor Q&A logged: ${question.substring(0, 50)}...`);
      
      return { success: true };
    } catch (error) {
      logger.error('Failed to log investor question:', error);
      return { success: false, error: error.message };
    }
  }

  // Create read-only access token for investors
  async createInvestorToken(createdBy, expiresInDays = 30) {
    try {
      const tokenId = `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const tokenHash = require('crypto')
        .createHash('sha256')
        .update(tokenId + process.env.JWT_SECRET)
        .digest('hex');
      
      const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);
      
      const stmt = db.db.prepare(`
        INSERT INTO investor_access_tokens 
        (id, token_hash, permissions, expires_at, created_by)
        VALUES (?, ?, ?, ?, ?)
      `);
      
      stmt.run(tokenId, tokenHash, 'read_only', expiresAt.toISOString(), createdBy);
      
      return {
        success: true,
        token: {
          id: tokenId,
          hash: tokenHash,
          permissions: 'read_only',
          expiresAt: expiresAt.toISOString(),
          createdBy
        }
      };
    } catch (error) {
      logger.error('Failed to create investor token:', error);
      return { success: false, error: error.message };
    }
  }

  // Validate investor token
  async validateInvestorToken(tokenHash) {
    try {
      const token = db.db.prepare(`
        SELECT * FROM investor_access_tokens 
        WHERE token_hash = ? AND expires_at > CURRENT_TIMESTAMP
      `).get(tokenHash);

      if (!token) {
        return { success: false, error: 'Invalid or expired token' };
      }

      return {
        success: true,
        token: {
          id: token.id,
          permissions: token.permissions,
          expiresAt: token.expires_at,
          createdBy: token.created_by
        }
      };
    } catch (error) {
      logger.error('Failed to validate investor token:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new InvestorModule();

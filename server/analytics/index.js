/**
 * Analytics Module
 * Provides revenue heatmaps, pattern analysis, and forecasting
 */

const db = require('../db');
const logger = require('../logger');

class AnalyticsModule {
  constructor() {
    this.initialized = false;
  }

  async initialize() {
    try {
      await this.ensureAnalyticsTables();
      this.initialized = true;
      logger.info('Analytics module initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize analytics module:', error);
      throw error;
    }
  }

  async ensureAnalyticsTables() {
    const tables = [
      `CREATE TABLE IF NOT EXISTS revenue_heatmaps (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        dimension TEXT NOT NULL,
        label TEXT NOT NULL,
        revenue_cents INTEGER NOT NULL,
        partner_id TEXT,
        period_start DATE NOT NULL,
        period_end DATE NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(dimension, label, partner_id, period_start, period_end)
      )`,
      
      `CREATE TABLE IF NOT EXISTS forecast_adjustments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        adjustment_reason TEXT NOT NULL,
        confidence_threshold REAL NOT NULL,
        weight_adjustment REAL NOT NULL,
        applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`
    ];

    for (const table of tables) {
      db.db.prepare(table).run();
    }
  }

  // Generate revenue heatmap
  async generateRevenueHeatmap(dimension = 'hour', partnerId = null, period = '30days') {
    try {
      let query, groupBy, labelField;
      
      switch (dimension) {
        case 'hour':
          query = `
            SELECT 
              strftime('%H', timestamp) as hour_label,
              SUM(amount_cents) as revenue_cents
            FROM partner_revenue 
            WHERE timestamp >= datetime('now', '-30 days')
            ${partnerId ? 'AND partner_id = ?' : ''}
            GROUP BY strftime('%H', timestamp)
            ORDER BY hour_label
          `;
          groupBy = partnerId ? [partnerId] : [];
          labelField = 'hour_label';
          break;
          
        case 'day':
          query = `
            SELECT 
              strftime('%w', timestamp) as day_label,
              CASE strftime('%w', timestamp)
                WHEN '0' THEN 'Sunday'
                WHEN '1' THEN 'Monday'
                WHEN '2' THEN 'Tuesday'
                WHEN '3' THEN 'Wednesday'
                WHEN '4' THEN 'Thursday'
                WHEN '5' THEN 'Friday'
                WHEN '6' THEN 'Saturday'
              END as day_name,
              SUM(amount_cents) as revenue_cents
            FROM partner_revenue 
            WHERE timestamp >= datetime('now', '-30 days')
            ${partnerId ? 'AND partner_id = ?' : ''}
            GROUP BY strftime('%w', timestamp)
            ORDER BY day_label
          `;
          groupBy = partnerId ? [partnerId] : [];
          labelField = 'day_label';
          break;
          
        case 'partner':
          query = `
            SELECT 
              partner_id as partner_label,
              SUM(amount_cents) as revenue_cents
            FROM partner_revenue 
            WHERE timestamp >= datetime('now', '-30 days')
            GROUP BY partner_id
            ORDER BY revenue_cents DESC
          `;
          groupBy = [];
          labelField = 'partner_label';
          break;
          
        case 'game_mode':
          query = `
            SELECT 
              game_mode as mode_label,
              SUM(amount_cents) as revenue_cents
            FROM partner_revenue 
            WHERE timestamp >= datetime('now', '-30 days')
              AND game_mode IS NOT NULL
            ${partnerId ? 'AND partner_id = ?' : ''}
            GROUP BY game_mode
            ORDER BY revenue_cents DESC
          `;
          groupBy = partnerId ? [partnerId] : [];
          labelField = 'mode_label';
          break;
          
        case 'feature':
          query = `
            SELECT 
              feature_used as feature_label,
              SUM(amount_cents) as revenue_cents
            FROM partner_revenue 
            WHERE timestamp >= datetime('now', '-30 days')
              AND feature_used IS NOT NULL
            ${partnerId ? 'AND partner_id = ?' : ''}
            GROUP BY feature_used
            ORDER BY revenue_cents DESC
          `;
          groupBy = partnerId ? [partnerId] : [];
          labelField = 'feature_label';
          break;
          
        default:
          return { success: false, error: 'Invalid dimension' };
      }

      const results = db.db.prepare(query).all(...groupBy);
      
      // Store heatmap data
      await this.storeHeatmapData(dimension, results, partnerId);
      
      // Format for response
      const heatmap = results.map(row => ({
        dimension,
        label: this.formatLabel(row[labelField], dimension),
        revenueUsd: row.revenue_cents / 100,
        partnerId: partnerId || 'all'
      }));

      // Add insights
      const insights = this.generateHeatmapInsights(heatmap, dimension);
      
      return {
        success: true,
        heatmap: {
          dimension,
          data: heatmap,
          insights,
          period: 'last 30 days',
          generatedAt: new Date().toISOString()
        }
      };
    } catch (error) {
      logger.error('Failed to generate revenue heatmap:', error);
      return { success: false, error: error.message };
    }
  }

  formatLabel(label, dimension) {
    switch (dimension) {
      case 'hour':
        return `${label}:00`;
      case 'day':
        return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][parseInt(label)];
      case 'partner':
      case 'game_mode':
      case 'feature':
        return label;
      default:
        return label;
    }
  }

  async storeHeatmapData(dimension, data, partnerId) {
    try {
      const periodStart = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const periodEnd = new Date();
      
      const stmt = db.db.prepare(`
        INSERT OR REPLACE INTO revenue_heatmaps 
        (dimension, label, revenue_cents, partner_id, period_start, period_end)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      for (const row of data) {
        stmt.run(
          dimension,
          row.label,
          Math.round(row.revenue_cents),
          partnerId,
          periodStart.toISOString().split('T')[0],
          periodEnd.toISOString().split('T')[0]
        );
      }
    } catch (error) {
      logger.error('Failed to store heatmap data:', error);
    }
  }

  generateHeatmapInsights(heatmap, dimension) {
    const insights = [];
    
    if (heatmap.length === 0) {
      return ['No data available for the selected period'];
    }

    const totalRevenue = heatmap.reduce((sum, item) => sum + item.revenueUsd, 0);
    const maxRevenue = Math.max(...heatmap.map(item => item.revenueUsd));
    const avgRevenue = totalRevenue / heatmap.length;

    // Declare variables outside switch
    let peakHour, peakDay, topPartner, topMode, topFeature;
    let lowHours, weekendDays, weekdayRevenue, weekendRevenue;
    let partnerConcentration, modeConcentration;

    // Dimension-specific insights
    switch (dimension) {
      case 'hour':
        peakHour = heatmap.reduce((max, item) => 
          item.revenueUsd > max.revenueUsd ? item : max
        );
        insights.push(`Peak revenue hour: ${peakHour.label} ($${peakHour.revenueUsd.toFixed(2)})`);
        
        // Find low performing hours
        lowHours = heatmap.filter(item => item.revenueUsd < avgRevenue * 0.5);
        if (lowHours.length > 0) {
          insights.push(`${lowHours.length} hours with below-average performance`);
        }
        break;

      case 'day':
        peakDay = heatmap.reduce((max, item) => 
          item.revenueUsd > max.revenueUsd ? item : max
        );
        insights.push(`Peak revenue day: ${peakDay.label} ($${peakDay.revenueUsd.toFixed(2)})`);
        
        // Weekend vs weekday analysis
        weekendDays = heatmap.filter(item => 
          ['Saturday', 'Sunday'].includes(item.label)
        );
        weekdayRevenue = totalRevenue - weekendDays.reduce((sum, item) => sum + item.revenueUsd, 0);
        weekendRevenue = weekendDays.reduce((sum, item) => sum + item.revenueUsd, 0);
        
        if (weekendRevenue > weekdayRevenue / 2) {
          insights.push('Weekend performance is strong - consider weekend promotions');
        }
        break;

      case 'partner':
        topPartner = heatmap[0];
        partnerConcentration = (topPartner.revenueUsd / totalRevenue) * 100;
        insights.push(`Top partner: ${topPartner.label} (${partnerConcentration.toFixed(1)}% of revenue)`);
        
        if (partnerConcentration > 50) {
          insights.push('High partner concentration - consider diversification');
        }
        break;

      case 'game_mode':
        topMode = heatmap[0];
        insights.push(`Top revenue game mode: ${topMode.label} ($${topMode.revenueUsd.toFixed(2)})`);
        
        modeConcentration = (topMode.revenueUsd / totalRevenue) * 100;
        if (modeConcentration > 70) {
          insights.push('High mode concentration - monitor for mode-specific issues');
        }
        break;

      case 'feature':
        topFeature = heatmap[0];
        insights.push(`Top revenue feature: ${topFeature.label} ($${topFeature.revenueUsd.toFixed(2)})`);
        break;
    }

    // General insights
    insights.push(`Total revenue: $${totalRevenue.toFixed(2)} across ${heatmap.length} ${dimension}s`);
    insights.push(`Average per ${dimension}: $${avgRevenue.toFixed(2)}`);

    return insights;
  }

  // Detect peak windows from heatmap data
  async detectPeakWindows(dimension = 'hour') {
    try {
      const heatmap = await this.generateRevenueHeatmap(dimension);
      
      if (!heatmap.success) {
        return heatmap;
      }

      const data = heatmap.heatmap.data;
      const totalRevenue = data.reduce((sum, item) => sum + item.revenueUsd, 0);
      const avgRevenue = totalRevenue / data.length;
      const threshold = avgRevenue * 1.5; // 50% above average = peak

      const peaks = data.filter(item => item.revenueUsd >= threshold);
      
      // Calculate peak confidence
      const peakConfidence = Math.min(0.95, 0.5 + (peaks.length / data.length) * 0.5);
      
      // Store confidence for forecast adjustment
      if (peakConfidence > 0.8) {
        await this.adjustForecastWeight('peak_window_detected', peakConfidence, 0.1);
      }

      return {
        success: true,
        peakAnalysis: {
          dimension,
          peaks,
          peakCount: peaks.length,
          peakConfidence,
          threshold,
          totalRevenue,
          averageRevenue: avgRevenue
        }
      };
    } catch (error) {
      logger.error('Failed to detect peak windows:', error);
      return { success: false, error: error.message };
    }
  }

  // Adjust forecast weights based on insights
  async adjustForecastWeight(reason, confidenceThreshold, weightAdjustment) {
    try {
      const stmt = db.db.prepare(`
        INSERT INTO forecast_adjustments 
        (adjustment_reason, confidence_threshold, weight_adjustment)
        VALUES (?, ?, ?)
      `);
      
      stmt.run(reason, confidenceThreshold, weightAdjustment);
      
      logger.info(`Forecast weight adjusted: ${reason} - ${weightAdjustment} (confidence: ${confidenceThreshold})`);
      
      return { success: true };
    } catch (error) {
      logger.error('Failed to adjust forecast weight:', error);
      return { success: false, error: error.message };
    }
  }

  // Get forecast with adjustments
  async getAdjustedForecast(partnerId, month) {
    try {
      // Get base forecast
      const baseForecast = db.db.prepare(`
        SELECT predicted_revenue_cents, confidence_score
        FROM revenue_forecasts 
        WHERE partner_id = ? AND forecast_month = ?
      `).get(partnerId, month);

      if (!baseForecast) {
        return { success: false, error: 'No base forecast found' };
      }

      // Get applicable adjustments
      const adjustments = db.db.prepare(`
        SELECT weight_adjustment
        FROM forecast_adjustments 
        WHERE confidence_threshold <= ?
        ORDER BY applied_at DESC
      `).all(baseForecast.confidence_score);

      // Apply adjustments
      let totalAdjustment = 0;
      for (const adj of adjustments) {
        totalAdjustment += adj.weight_adjustment;
      }

      const adjustedRevenue = baseForecast.predicted_revenue_cents * (1 + totalAdjustment);
      const adjustedConfidence = Math.min(0.95, baseForecast.confidence_score + (totalAdjustment * 0.5));

      return {
        success: true,
        forecast: {
          partnerId,
          month,
          baseRevenue: baseForecast.predicted_revenue_cents / 100,
          adjustedRevenue: adjustedRevenue / 100,
          adjustment: totalAdjustment,
          confidence: adjustedConfidence,
          adjustments: adjustments
        }
      };
    } catch (error) {
      logger.error('Failed to get adjusted forecast:', error);
      return { success: false, error: error.message };
    }
  }

  // Get correlation between features and revenue
  async getFeatureRevenueCorrelation(partnerId = null) {
    try {
      const query = `
        SELECT 
          feature_used,
          COUNT(*) as usage_count,
          SUM(amount_cents) as total_revenue_cents,
          AVG(amount_cents) as avg_revenue_cents,
          COUNT(DISTINCT partner_id) as partner_count
        FROM partner_revenue 
        WHERE timestamp >= datetime('now', '-30 days')
          AND feature_used IS NOT NULL
          ${partnerId ? 'AND partner_id = ?' : ''}
        GROUP BY feature_used
        HAVING usage_count >= 5
        ORDER BY total_revenue_cents DESC
      `;

      const results = db.db.prepare(query).all(...(partnerId ? [partnerId] : []));

      const correlations = results.map(row => ({
        feature: row.feature_used,
        usageCount: row.usage_count,
        totalRevenue: row.total_revenue_cents / 100,
        avgRevenue: row.avg_revenue_cents / 100,
        partnerCount: row.partner_count,
        revenuePerUsage: (row.total_revenue_cents / 100) / row.usage_count
      }));

      return {
        success: true,
        correlations,
        insights: this.generateFeatureInsights(correlations)
      };
    } catch (error) {
      logger.error('Failed to get feature correlations:', error);
      return { success: false, error: error.message };
    }
  }

  generateFeatureInsights(correlations) {
    const insights = [];
    
    if (correlations.length === 0) {
      return ['No feature data available'];
    }

    const topFeature = correlations[0];
    insights.push(`Highest revenue feature: ${topFeature.feature} ($${topFeature.totalRevenue.toFixed(2)})`);

    // Find high-value features
    const highValueFeatures = correlations.filter(f => f.avgRevenue > 10);
    if (highValueFeatures.length > 0) {
      insights.push(`${highValueFeatures.length} features generate >$10 average per use`);
    }

    // Find frequently used features
    const frequentFeatures = correlations.filter(f => f.usageCount > 50);
    if (frequentFeatures.length > 0) {
      insights.push(`${frequentFeatures.length} features used >50 times in period`);
    }

    return insights;
  }
}

module.exports = new AnalyticsModule();

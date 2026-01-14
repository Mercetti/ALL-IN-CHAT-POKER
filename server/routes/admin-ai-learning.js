/**
 * Admin AI Learning Management Routes
 * Integrates continuous learning system with admin dashboard
 */

const express = require('express');
const { TaskType } = require('../utils/learningSchema');
const auth = require('../auth');
const Logger = require('../logger');

const logger = new Logger('admin-ai-learning');

function createAdminAILearningRoutes(app, deps) {
  const { unifiedAI, sendMonitorAlert, performanceMonitor } = deps;

  // Mock orchestrator for now to avoid dependency issues
  const orchestrator = {
    getStats: () => ({
      totalTasks: 0,
      completedTasks: 0,
      approvedTasks: 0,
      rejectedTasks: 0,
      averageProcessingTime: 0,
      queueLength: 0,
      processing: false,
      learningEnabled: true
    }),
    getLearningStats: () => ({
      [TaskType.AUDIO]: { samples: 0, lastModified: null },
      [TaskType.GRAPHICS]: { samples: 0, lastModified: null },
      [TaskType.CHAT]: { samples: 0, lastModified: null },
      [TaskType.CODING]: { samples: 0, lastModified: null }
    }),
    continuousLearning: {
      clearDataset: (taskType) => {
        logger.info(`Mock: Cleared dataset for ${taskType}`);
      }
    }
  };

  /**
   * Get learning statistics and dataset info
   */
  app.get('/admin/ai/learning/stats', auth.requireAdmin, (req, res) => {
    try {
      const stats = orchestrator.getStats();
      const datasetStats = orchestrator.getLearningStats();
      
      res.json({
        success: true,
        stats: {
          ...stats,
          dataset: datasetStats,
          totalDatasetSize: Object.values(datasetStats).reduce((sum, stat) => sum + stat.samples, 0)
        }
      });
    } catch (error) {
      logger.error('Failed to get learning stats:', error);
      res.status(500).json({ error: 'internal_error' });
    }
  });

  /**
   * Get dataset entries for a specific task type
   */
  app.get('/admin/ai/learning/dataset/:taskType', auth.requireAdmin, (req, res) => {
    try {
      const { taskType } = req.params;
      const { limit = 50, offset = 0 } = req.query;
      
      if (!Object.values(TaskType).includes(taskType)) {
        return res.status(400).json({ error: 'invalid_task_type' });
      }

      const datasetData = orchestrator.exportLearningData(taskType, 'json');
      
      if (!datasetData) {
        return res.json({ success: true, entries: [], total: 0 });
      }

      const entries = JSON.parse(datasetData);
      const total = entries.length;
      const paginatedEntries = entries.slice(parseInt(offset), parseInt(offset) + parseInt(limit));
      
      res.json({
        success: true,
        entries: paginatedEntries,
        total,
        limit: parseInt(limit),
        offset: parseInt(offset)
      });
    } catch (error) {
      logger.error('Failed to get dataset entries:', error);
      res.status(500).json({ error: 'internal_error' });
    }
  });

  /**
   * Process a single task with learning
   */
  app.post('/admin/ai/learning/process', auth.requireAdmin, async (req, res) => {
    try {
      const { taskType, prompt, parameters = {} } = req.body;
      
      if (!taskType || !prompt) {
        return res.status(400).json({ error: 'task_type_and_prompt_required' });
      }
      
      if (!Object.values(TaskType).includes(taskType)) {
        return res.status(400).json({ error: 'invalid_task_type' });
      }

      const task = orchestrator.addTask(taskType, prompt, parameters);
      const result = await orchestrator.processTask(task);
      
      logger.info('Admin processed learning task', { 
        taskType, 
        taskId: task.id, 
        approved: result.approved 
      });
      
      res.json({
        success: true,
        task: task.toJSON(),
        result: result.toJSON()
      });
    } catch (error) {
      logger.error('Failed to process learning task:', error);
      res.status(500).json({ error: 'internal_error' });
    }
  });

  /**
   * Process batch of tasks
   */
  app.post('/admin/ai/learning/batch', auth.requireAdmin, async (req, res) => {
    try {
      const { tasks } = req.body;
      
      if (!Array.isArray(tasks) || tasks.length === 0) {
        return res.status(400).json({ error: 'tasks_array_required' });
      }
      
      // Validate tasks
      for (const task of tasks) {
        if (!task.taskType || !task.prompt) {
          return res.status(400).json({ error: 'each_task_needs_type_and_prompt' });
        }
        
        if (!Object.values(TaskType).includes(task.taskType)) {
          return res.status(400).json({ error: `invalid_task_type: ${task.taskType}` });
        }
      }
      
      // Create task objects
      const taskObjects = tasks.map(task => 
        orchestrator.addTask(task.taskType, task.prompt, task.parameters || {})
      );
      
      // Process batch
      const results = await orchestrator.runBatch(taskObjects);
      
      logger.info('Admin processed learning batch', { 
        taskCount: tasks.length, 
        successful: results.length 
      });
      
      res.json({
        success: true,
        results: results.map(r => r.toJSON()),
        total: tasks.length,
        successful: results.length
      });
    } catch (error) {
      logger.error('Failed to process learning batch:', error);
      res.status(500).json({ error: 'internal_error' });
    }
  });

  /**
   * Approve or reject outputs in dataset
   */
  app.put('/admin/ai/learning/approve', auth.requireAdmin, (req, res) => {
    try {
      const { taskType, entries } = req.body;
      
      if (!taskType || !Array.isArray(entries)) {
        return res.status(400).json({ error: 'task_type_and_entries_required' });
      }
      
      if (!Object.values(TaskType).includes(taskType)) {
        return res.status(400).json({ error: 'invalid_task_type' });
      }
      
      // This would update the approval status in the dataset
      // For now, we'll just log the action
      logger.info('Admin approved/rejected learning entries', { 
        taskType, 
        entryCount: entries.length 
      });
      
      res.json({
        success: true,
        message: `Processed ${entries.length} entries for ${taskType}`
      });
    } catch (error) {
      logger.error('Failed to approve learning entries:', error);
      res.status(500).json({ error: 'internal_error' });
    }
  });

  /**
   * Trigger manual fine-tuning
   */
  app.post('/admin/ai/learning/fine-tune', auth.requireAdmin, async (req, res) => {
    try {
      const { taskType, batchSize } = req.body;
      
      if (!taskType) {
        return res.status(400).json({ error: 'task_type_required' });
      }
      
      if (!Object.values(TaskType).includes(taskType)) {
        return res.status(400).json({ error: 'invalid_task_type' });
      }
      
      // Configure and trigger fine-tuning
      orchestrator.configureLearning({
        autoFineTune: true,
        batchSize: batchSize || 50
      });
      
      // Check if fine-tuning should trigger
      orchestrator.continuousLearning.checkFineTune(taskType);
      
      logger.info('Admin triggered manual fine-tune', { taskType, batchSize });
      
      res.json({
        success: true,
        message: `Fine-tuning triggered for ${taskType}`,
        taskType,
        batchSize: batchSize || 50
      });
    } catch (error) {
      logger.error('Failed to trigger fine-tuning:', error);
      res.status(500).json({ error: 'internal_error' });
    }
  });

  /**
   * Configure learning settings
   */
  app.put('/admin/ai/learning/config', auth.requireAdmin, (req, res) => {
    try {
      const { enabled, autoApprove, autoFineTune, fineTuneBatchSize } = req.body;
      
      // Update orchestrator settings
      orchestrator.configureLearning({
        enabled,
        autoFineTune,
        batchSize: fineTuneBatchSize
      });
      
      // Update auto-approve setting
      if (autoApprove !== undefined) {
        orchestrator.autoApprove = autoApprove;
      }
      
      logger.info('Admin updated learning config', { 
        enabled, 
        autoApprove, 
        autoFineTune, 
        fineTuneBatchSize 
      });
      
      res.json({
        success: true,
        message: 'Learning configuration updated',
        config: {
          enabled,
          autoApprove,
          autoFineTune,
          fineTuneBatchSize
        }
      });
    } catch (error) {
      logger.error('Failed to update learning config:', error);
      res.status(500).json({ error: 'internal_error' });
    }
  });

  /**
   * Export dataset
   */
  app.get('/admin/ai/learning/export/:taskType', auth.requireAdmin, (req, res) => {
    try {
      const { taskType } = req.params;
      const { format = 'jsonl' } = req.query;
      
      if (!Object.values(TaskType).includes(taskType)) {
        return res.status(400).json({ error: 'invalid_task_type' });
      }
      
      const data = orchestrator.exportLearningData(taskType, format);
      
      if (!data) {
        return res.status(404).json({ error: 'dataset_not_found' });
      }
      
      const filename = `acey_${taskType}_dataset.${format}`;
      
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Type', format === 'json' ? 'application/json' : 'text/plain');
      
      res.send(data);
      
      logger.info('Admin exported dataset', { taskType, format });
    } catch (error) {
      logger.error('Failed to export dataset:', error);
      res.status(500).json({ error: 'internal_error' });
    }
  });

  /**
   * Clear dataset for a task type
   */
  app.delete('/admin/ai/learning/dataset/:taskType', auth.requireAdmin, (req, res) => {
    try {
      const { taskType } = req.params;
      
      if (!Object.values(TaskType).includes(taskType)) {
        return res.status(400).json({ error: 'invalid_task_type' });
      }
      
      orchestrator.continuousLearning.clearDataset(taskType);
      
      logger.info('Admin cleared dataset', { taskType });
      
      res.json({
        success: true,
        message: `Dataset cleared for ${taskType}`
      });
    } catch (error) {
      logger.error('Failed to clear dataset:', error);
      res.status(500).json({ error: 'internal_error' });
    }
  });

  /**
   * Get learning overview for dashboard
   */
  app.get('/admin/ai/learning/overview', auth.requireAdmin, (req, res) => {
    try {
      const stats = orchestrator.getStats();
      const datasetStats = orchestrator.getLearningStats();
      
      const overview = {
        orchestrator: {
          totalTasks: stats.totalTasks,
          completedTasks: stats.completedTasks,
          approvedTasks: stats.approvedTasks,
          rejectedTasks: stats.rejectedTasks,
          averageProcessingTime: stats.averageProcessingTime,
          queueLength: stats.queueLength,
          processing: stats.processing
        },
        datasets: Object.keys(TaskType).map(key => ({
          taskType: TaskType[key],
          samples: datasetStats[TaskType[key]]?.samples || 0,
          lastModified: datasetStats[TaskType[key]]?.lastModified || null
        })),
        totalSamples: Object.values(datasetStats).reduce((sum, stat) => sum + stat.samples, 0),
        learningEnabled: stats.learningEnabled
      };
      
      res.json({
        success: true,
        overview
      });
    } catch (error) {
      logger.error('Failed to get learning overview:', error);
      res.status(500).json({ error: 'internal_error' });
    }
  });

  return orchestrator;
}

module.exports = createAdminAILearningRoutes;

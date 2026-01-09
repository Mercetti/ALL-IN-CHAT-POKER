/**
 * AI Code Quality Integration
 * Integrates quality guardrails into existing AI systems
 */

const AICodingAssistant = require('./ai-coding-assistant');
const logger = require('./logger');

class AIQualityIntegration {
  constructor() {
    this.codingAssistant = new AICodingAssistant();
    this.isInitialized = false;
  }

  /**
   * Initialize the quality integration
   */
  async initialize() {
    try {
      logger.info('Initializing AI Quality Integration...');
      
      const success = await this.codingAssistant.initialize();
      if (!success) {
        throw new Error('Failed to initialize AI Coding Assistant');
      }

      // Set up periodic quality checks
      this.setupPeriodicChecks();

      // Integrate with existing AI endpoints
      this.integrateWithAIEndpoints();

      this.isInitialized = true;
      logger.info('AI Quality Integration initialized successfully');

      return true;
    } catch (error) {
      logger.error('Failed to initialize AI Quality Integration', { error: error.message });
      return false;
    }
  }

  /**
   * Sets up periodic quality checks
   */
  setupPeriodicChecks() {
    // Run quality check every hour
    setInterval(async () => {
      try {
        const check = await this.codingAssistant.runQualityCheck();
        if (!check.healthy) {
          logger.warn('Code quality issues detected', { issues: check.issues });
        }
      } catch (error) {
        logger.error('Periodic quality check failed', { error: error.message });
      }
    }, 60 * 60 * 1000); // 1 hour
  }

  /**
   * Integrates with existing AI endpoints
   */
  integrateWithAIEndpoints() {
    // This would integrate with your existing AI system endpoints
    // For now, we'll create new endpoints that demonstrate the integration

    // Add to existing Express app (this would be called from server.js)
    this.addQualityEndpoints = (app) => {
      // AI Code Generation with Quality Guardrails
      app.post('/admin/ai/code/generate', async (req, res) => {
        try {
          const { type, description, context } = req.body;
          
          if (!type || !description) {
            return res.status(400).json({ 
              error: 'missing_parameters',
              message: 'type and description are required'
            });
          }

          const result = await this.codingAssistant.generateCode({
            type,
            description,
            context
          });

          if (result.success) {
            res.json({
              success: true,
              code: result.code,
              suggestions: result.suggestions,
              warnings: result.warnings
            });
          } else {
            res.status(400).json({
              success: false,
              error: result.error,
              suggestions: result.suggestions
            });
          }
        } catch (error) {
          logger.error('AI code generation failed', { error: error.message });
          res.status(500).json({ error: 'internal_error' });
        }
      });

      // Code Quality Check
      app.get('/admin/ai/code/quality', async (req, res) => {
        try {
          const check = await this.codingAssistant.runQualityCheck();
          
          res.json({
            success: true,
            healthy: check.healthy,
            issues: check.issues,
            recommendations: check.recommendations
          });
        } catch (error) {
          logger.error('Code quality check failed', { error: error.message });
          res.status(500).json({ error: 'internal_error' });
        }
      });

      // Refactoring Assistance
      app.post('/admin/ai/code/refactor', async (req, res) => {
        try {
          const { code } = req.body;
          
          if (!code) {
            return res.status(400).json({ 
              error: 'missing_code',
              message: 'code is required'
            });
          }

          const suggestions = await this.codingAssistant.suggestRefactoring(code);
          
          res.json({
            success: true,
            analysis: suggestions.analysis,
            suggestions: suggestions.suggestions,
            actionPlan: suggestions.actionPlan
          });
        } catch (error) {
          logger.error('Refactoring assistance failed', { error: error.message });
          res.status(500).json({ error: 'internal_error' });
        }
      });

      // Validate Generated Code
      app.post('/admin/ai/code/validate', async (req, res) => {
        try {
          const { code, context } = req.body;
          
          if (!code) {
            return res.status(400).json({ 
              error: 'missing_code',
              message: 'code is required'
            });
          }

          const validation = this.codingAssistant.qualityGuardian.validateGeneratedCode(code, context);
          
          res.json({
            success: true,
            isValid: validation.isValid,
            issues: validation.issues,
            suggestions: validation.suggestions
          });
        } catch (error) {
          logger.error('Code validation failed', { error: error.message });
          res.status(500).json({ error: 'internal_error' });
        }
      });
    };
  }

  /**
   * Enhances existing AI systems with quality guardrails
   */
  enhanceExistingAISystem(existingAI) {
    // Wrap existing AI generation methods with quality validation
    const originalGenerate = existingAI.generateCode || existingAI.generate;
    
    existingAI.generateCode = async (request) => {
      // Generate code using original AI
      const originalResult = await originalGenerate.call(existingAI, request);
      
      if (originalResult && originalResult.code) {
        // Validate the generated code
        const validation = this.codingAssistant.qualityGuardian.validateGeneratedCode(
          originalResult.code, 
          request.context
        );
        
        if (!validation.isValid) {
          logger.warn('Original AI generated code failed quality validation', { 
            issues: validation.issues 
          });
          
          // Try to fix the code
          const fixedCode = await this.codingAssistant.autoFixCode(
            originalResult.code, 
            validation.issues
          );
          
          // Re-validate
          const revalidation = this.codingAssistant.qualityGuardian.validateGeneratedCode(
            fixedCode, 
            request.context
          );
          
          if (revalidation.isValid) {
            logger.info('Successfully fixed AI-generated code');
            return {
              ...originalResult,
              code: fixedCode,
              qualityFixed: true,
              originalIssues: validation.issues
            };
          } else {
            logger.error('Could not fix AI-generated code', { 
              issues: revalidation.issues 
            });
            
            return {
              ...originalResult,
              qualityIssues: revalidation.issues,
              suggestions: validation.suggestions
            };
          }
        }
      }
      
      return originalResult;
    };

    // Add quality monitoring to existing AI
    existingAI.monitorQuality = async () => {
      return await this.codingAssistant.runQualityCheck();
    };

    // Add refactoring assistance to existing AI
    existingAI.suggestRefactoring = async (code) => {
      return await this.codingAssistant.suggestRefactoring(code);
    };

    logger.info('Enhanced existing AI system with quality guardrails');
    return existingAI;
  }

  /**
   * Gets quality guidelines for AI training
   */
  getQualityGuidelines() {
    return this.codingAssistant.qualityGuardian.getCodingGuidelines();
  }

  /**
   * Creates quality-focused prompts for AI
   */
  createQualityPrompt(task) {
    const guidelines = this.getQualityGuidelines();
    
    return `
You are an expert Node.js/Express developer with strict code quality standards.

QUALITY GUIDELINES:
- Never create duplicate function definitions
- Never add additional server.listen() calls (only one should exist at end of server.js)
- Always move standalone functions to appropriate modules
- Always remove unused imports
- Use logger instead of console.log
- No hardcoded values - use configuration
- Follow single responsibility principle
- Keep functions under 50 lines when possible
- Proper error handling with try/catch blocks

CURRENT CODEBASE CONTEXT:
- Functions: ${this.codingAssistant.context.functionCount}
- Routes: ${this.codingAssistant.context.routeCount}
- File size: ${this.codingAssistant.context.codeStructure.totalLines} lines

TASK: ${task}

Generate clean, maintainable code that follows these guidelines and integrates properly with the existing codebase structure.
    `.trim();
  }

  /**
   * Validates AI responses before returning to user
   */
  async validateAIResponse(response, context) {
    if (response && response.code) {
      const validation = this.codingAssistant.qualityGuardian.validateGeneratedCode(
        response.code, 
        context
      );
      
      if (!validation.isValid) {
        logger.warn('AI response failed quality validation', { 
          issues: validation.issues 
        });
        
        return {
          ...response,
          qualityIssues: validation.issues,
          needsReview: true,
          suggestions: validation.suggestions
        };
      }
    }
    
    return response;
  }
}

module.exports = AIQualityIntegration;

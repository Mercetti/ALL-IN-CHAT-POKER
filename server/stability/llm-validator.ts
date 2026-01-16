/**
 * LLM Validator
 * Validates outputs before storing for learning
 */

export interface LLMOutput {
  id: string;
  type: string;
  content: any;
  timestamp: number;
  skillName: string;
  validation?: {
    passed: boolean;
    errors: string[];
    warnings: string[];
  };
}

export class LLMValidator {
  private validationRules: Map<string, (output: any) => ValidationResult>;

  constructor() {
    this.setupValidationRules();
  }

  // Main validation method
  validate(output: any): boolean {
    if (!output) {
      console.error('LLM Validator: Output is null or undefined');
      return false;
    }

    try {
      const result = this.performValidation(output);
      
      // Store validation result on output
      if (output.validation) {
        output.validation = result;
      }
      
      if (result.passed) {
        console.log(`LLM Validator: Output ${output.id || 'unknown'} passed validation`);
        return true;
      } else {
        console.warn(`LLM Validator: Output ${output.id || 'unknown'} failed validation:`, result.errors);
        return false;
      }
      
    } catch (error: any) {
      console.error(`LLM Validator: Validation error: ${error.message}`);
      return false;
    }
  }

  private performValidation(output: any): ValidationResult {
    const result: ValidationResult = {
      passed: true,
      errors: [],
      warnings: []
    };

    // Basic structure validation
    if (!this.validateBasicStructure(output, result)) {
      result.passed = false;
    }

    // Type-specific validation
    if (output.type && this.validationRules.has(output.type)) {
      const validator = this.validationRules.get(output.type);
      const typeResult = validator(output);
      result.errors.push(...typeResult.errors);
      result.warnings.push(...typeResult.warnings);
      
      if (typeResult.errors.length > 0) {
        result.passed = false;
      }
    }

    // Content validation
    if (!this.validateContent(output, result)) {
      result.passed = false;
    }

    // Security validation
    if (!this.validateSecurity(output, result)) {
      result.passed = false;
    }

    return result;
  }

  private validateBasicStructure(output: any, result: ValidationResult): boolean {
    if (!output.id || typeof output.id !== 'string') {
      result.errors.push('Missing or invalid output ID');
      return false;
    }

    if (!output.type || typeof output.type !== 'string') {
      result.errors.push('Missing or invalid output type');
      return false;
    }

    if (!output.content) {
      result.errors.push('Missing output content');
      return false;
    }

    return true;
  }

  private validateContent(output: any, result: ValidationResult): boolean {
    const content = output.content;

    // Check for empty content
    if (!content || (typeof content === 'string' && content.trim().length === 0)) {
      result.errors.push('Output content is empty');
      return false;
    }

    // Type-specific content validation
    switch (output.type) {
      case 'code':
        return this.validateCodeContent(content, result);
      case 'audio':
        return this.validateAudioContent(content, result);
      case 'graphics':
        return this.validateGraphicsContent(content, result);
      case 'text':
        return this.validateTextContent(content, result);
      case 'financial':
        return this.validateFinancialContent(content, result);
      default:
        result.warnings.push(`Unknown content type: ${output.type}`);
        return true; // Allow unknown types but warn
    }
  }

  private validateCodeContent(content: any, result: ValidationResult): boolean {
    if (typeof content !== 'string' && typeof content !== 'object') {
      result.errors.push('Code content must be string or object');
      return false;
    }

    // Basic syntax validation for string code
    if (typeof content === 'string') {
      if (content.length > 100000) {
        result.warnings.push('Code content is very large');
      }
      
      // Check for potentially dangerous patterns
      const dangerousPatterns = [
        /eval\s*\(/gi,
        /exec\s*\(/gi,
        /system\s*\(/gi
      ];
      
      for (const pattern of dangerousPatterns) {
        if (pattern.test(content)) {
          result.errors.push('Code contains potentially dangerous patterns');
          return false;
        }
      }
    }

    return true;
  }

  private validateAudioContent(content: any, result: ValidationResult): boolean {
    // Basic audio validation
    if (typeof content !== 'object' && typeof content !== 'string') {
      result.errors.push('Audio content must be object or string');
      return false;
    }

    return true;
  }

  private validateGraphicsContent(content: any, result: ValidationResult): boolean {
    // Basic graphics validation
    if (typeof content !== 'object' && typeof content !== 'string') {
      result.errors.push('Graphics content must be object or string');
      return false;
    }

    return true;
  }

  private validateTextContent(content: any, result: ValidationResult): boolean {
    if (typeof content !== 'string') {
      result.errors.push('Text content must be string');
      return false;
    }

    if (content.length > 50000) {
      result.warnings.push('Text content is very long');
    }

    return true;
  }

  private validateFinancialContent(content: any, result: ValidationResult): boolean {
    if (typeof content !== 'object') {
      result.errors.push('Financial content must be object');
      return false;
    }

    // Check for required financial fields
    const requiredFields = ['amount', 'currency'];
    for (const field of requiredFields) {
      if (!(field in content)) {
        result.errors.push(`Missing required financial field: ${field}`);
        return false;
      }
    }

    // Validate amount is positive number
    if (typeof content.amount !== 'number' || content.amount < 0) {
      result.errors.push('Amount must be a positive number');
      return false;
    }

    return true;
  }

  private validateSecurity(output: any, result: ValidationResult): boolean {
    // Check for security issues
    const content = output.content;

    // Check for potential injection attempts
    if (typeof content === 'string') {
      const injectionPatterns = [
        /<script[^>]*>.*?<\/script>/gi,
        /javascript:/gi,
        /on\w+\s*=/gi
      ];

      for (const pattern of injectionPatterns) {
        if (pattern.test(content)) {
          result.errors.push('Content contains potentially dangerous patterns');
          return false;
        }
      }
    }

    // Check for excessive size (potential DoS)
    const contentSize = JSON.stringify(content).length;
    if (contentSize > 1000000) { // 1MB limit
      result.errors.push('Content size exceeds maximum allowed limit');
      return false;
    }

    return true;
  }

  private setupValidationRules(): void {
    this.validationRules = new Map();
    
    // Add type-specific validators
    this.validationRules.set('code', (output: any) => this.validateCodeContent(output.content, { passed: true, errors: [], warnings: [] }));
    this.validationRules.set('audio', (output: any) => this.validateAudioContent(output.content, { passed: true, errors: [], warnings: [] }));
    this.validationRules.set('graphics', (output: any) => this.validateGraphicsContent(output.content, { passed: true, errors: [], warnings: [] }));
    this.validationRules.set('text', (output: any) => this.validateTextContent(output.content, { passed: true, errors: [], warnings: [] }));
    this.validationRules.set('financial', (output: any) => this.validateFinancialContent(output.content, { passed: true, errors: [], warnings: [] }));
  }

  // Get validation statistics
  getValidationStats(): any {
    return {
      totalValidations: 0, // Would be tracked in real implementation
      passedValidations: 0,
      failedValidations: 0,
      commonErrors: [], // Would be tracked
      lastValidation: new Date().toISOString()
    };
  }
}

interface ValidationResult {
  passed: boolean;
  errors: string[];
  warnings: string[];
}

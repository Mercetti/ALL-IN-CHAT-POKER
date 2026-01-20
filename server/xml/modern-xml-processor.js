/**
 * Modern XML Processor for Java 21+ Compatibility
 * Replaces deprecated javax.xml.transform APIs with modern alternatives
 * Provides secure and efficient XML processing capabilities
 */

const { XMLParser, XMLBuilder } = require('fast-xml-parser');
const { DOMParser, XMLSerializer } = require('xmldom');
const crypto = require('crypto');

class ModernXMLProcessor {
  constructor(options = {}) {
    this.parserOptions = {
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      textNodeName: '#text',
      format: true,
      indentBy: '  ',
      suppressEmptyNode: false,
      ...options.parserOptions
    };
    
    this.builderOptions = {
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      textNodeName: '#text',
      format: true,
      indentBy: '  ',
      suppressEmptyNode: false,
      ...options.builderOptions
    };
    
    this.securityOptions = {
      allowExternalEntities: false,
      allowDTD: false,
      allowScript: false,
      allowComments: false,
      allowProcessingInstructions: false,
      ...options.securityOptions
    };
  }

  /**
   * Parse XML string to JavaScript object
   * @param {string} xmlString - XML string to parse
   * @param {Object} options - Parsing options
   * @returns {Object} Parsed JavaScript object
   */
  parseXML(xmlString, options = {}) {
    try {
      // Security validation
      this.validateXMLSecurity(xmlString);
      
      // Create parser with options
      const parser = new XMLParser({
        ...this.parserOptions,
        ...options
      });
      
      // Parse XML
      const result = parser.parse(xmlString);
      
      return result;
    } catch (error) {
      throw new Error(`XML parsing failed: ${error.message}`);
    }
  }

  /**
   * Convert JavaScript object to XML string
   * @param {Object} jsObject - JavaScript object to convert
   * @param {Object} options - Building options
   * @returns {string} XML string
   */
  buildXML(jsObject, options = {}) {
    try {
      // Create builder with options
      const builder = new XMLBuilder({
        ...this.builderOptions,
        ...options
      });
      
      // Build XML
      const xmlString = builder.build(jsObject);
      
      return xmlString;
    } catch (error) {
      throw new Error(`XML building failed: ${error.message}`);
    }
  }

  /**
   * Transform XML using XSLT-like transformation
   * @param {string} xmlString - Source XML
   * @param {Object} transformation - Transformation rules
   * @returns {string} Transformed XML
   */
  transformXML(xmlString, transformation) {
    try {
      // Parse source XML
      const sourceObj = this.parseXML(xmlString);
      
      // Apply transformation
      const transformedObj = this.applyTransformation(sourceObj, transformation);
      
      // Build result XML
      const resultXML = this.buildXML(transformedObj);
      
      return resultXML;
    } catch (error) {
      throw new Error(`XML transformation failed: ${error.message}`);
    }
  }

  /**
   * Apply transformation rules to object
   * @param {Object} sourceObj - Source object
   * @param {Object} transformation - Transformation rules
   * @returns {Object} Transformed object
   */
  applyTransformation(sourceObj, transformation) {
    const result = {};
    
    // Apply transformation rules
    for (const [targetPath, sourcePath] of Object.entries(transformation)) {
      const sourceValue = this.getNestedValue(sourceObj, sourcePath);
      if (sourceValue !== undefined) {
        this.setNestedValue(result, targetPath, sourceValue);
      }
    }
    
    return result;
  }

  /**
   * Get nested value from object using dot notation
   * @param {Object} obj - Source object
   * @param {string} path - Dot notation path
   * @returns {*} Value at path
   */
  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }

  /**
   * Set nested value in object using dot notation
   * @param {Object} obj - Target object
   * @param {string} path - Dot notation path
   * @param {*} value - Value to set
   */
  setNestedValue(obj, path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    const target = keys.reduce((current, key) => {
      if (!current[key]) current[key] = {};
      return current[key];
    }, obj);
    target[lastKey] = value;
  }

  /**
   * Validate XML security
   * @param {string} xmlString - XML string to validate
   */
  validateXMLSecurity(xmlString) {
    // Check for external entities
    if (this.securityOptions.allowExternalEntities === false) {
      if (xmlString.includes('&') && xmlString.includes(';')) {
        throw new Error('External entities not allowed');
      }
    }
    
    // Check for DTD
    if (this.securityOptions.allowDTD === false) {
      if (xmlString.includes('<!DOCTYPE')) {
        throw new Error('DTD not allowed');
      }
    }
    
    // Check for scripts
    if (this.securityOptions.allowScript === false) {
      if (xmlString.includes('<script') || xmlString.includes('javascript:')) {
        throw new Error('Scripts not allowed');
      }
    }
    
    // Check for processing instructions
    if (this.securityOptions.allowProcessingInstructions === false) {
      if (xmlString.includes('<?')) {
        throw new Error('Processing instructions not allowed');
      }
    }
  }

  /**
   * Validate XML schema
   * @param {string} xmlString - XML string to validate
   * @param {Object} schema - Schema definition
   * @returns {boolean} Validation result
   */
  validateSchema(xmlString, schema) {
    try {
      const parsed = this.parseXML(xmlString);
      return this.validateObjectSchema(parsed, schema);
    } catch (error) {
      return false;
    }
  }

  /**
   * Validate object against schema
   * @param {Object} obj - Object to validate
   * @param {Object} schema - Schema definition
   * @returns {boolean} Validation result
   */
  validateObjectSchema(obj, schema) {
    for (const [key, type] of Object.entries(schema)) {
      if (obj[key] === undefined) {
        return false; // Required field missing
      }
      
      if (type === 'string' && typeof obj[key] !== 'string') {
        return false; // Type mismatch
      }
      
      if (type === 'number' && typeof obj[key] !== 'number') {
        return false; // Type mismatch
      }
      
      if (type === 'boolean' && typeof obj[key] !== 'boolean') {
        return false; // Type mismatch
      }
      
      if (Array.isArray(type) && !Array.isArray(obj[key])) {
        return false; // Type mismatch
      }
      
      if (typeof type === 'object' && typeof obj[key] !== 'object') {
        return false; // Type mismatch
      }
    }
    
    return true;
  }

  /**
   * Minify XML string
   * @param {string} xmlString - XML string to minify
   * @returns {string} Minified XML string
   */
  minifyXML(xmlString) {
    try {
      const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: '@_',
        textNodeName: '#text',
        format: false,
        suppressEmptyNode: true
      });
      
      const builder = new XMLBuilder({
        ignoreAttributes: false,
        attributeNamePrefix: '@_',
        textNodeName: '#text',
        format: false,
        suppressEmptyNode: true
      });
      
      const parsed = parser.parse(xmlString);
      return builder.build(parsed);
    } catch (error) {
      throw new Error(`XML minification failed: ${error.message}`);
    }
  }

  /**
   * Pretty print XML string
   * @param {string} xmlString - XML string to pretty print
   * @param {Object} options - Formatting options
   * @returns {string} Pretty printed XML string
   */
  prettyPrintXML(xmlString, options = {}) {
    try {
      const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: '@_',
        textNodeName: '#text',
        format: false,
        suppressEmptyNode: false
      });
      
      const builder = new XMLBuilder({
        ignoreAttributes: false,
        attributeNamePrefix: '@_',
        textNodeName: '#text',
        format: true,
        indentBy: options.indentBy || '  ',
        suppressEmptyNode: false
      });
      
      const parsed = parser.parse(xmlString);
      return builder.build(parsed);
    } catch (error) {
      throw new Error(`XML pretty printing failed: ${error.message}`);
    }
  }

  /**
   * Extract specific nodes from XML
   * @param {string} xmlString - XML string
   * @param {string} xpath - XPath expression (simplified)
   * @returns {Array} Array of matching nodes
   */
  extractNodes(xmlString, xpath) {
    try {
      const parsed = this.parseXML(xmlString);
      return this.extractNodesFromObject(parsed, xpath);
    } catch (error) {
      throw new Error(`Node extraction failed: ${error.message}`);
    }
  }

  /**
   * Extract nodes from object using simplified XPath
   * @param {Object} obj - Object to search
   * @param {string} xpath - XPath expression
   * @returns {Array} Array of matching nodes
   */
  extractNodesFromObject(obj, xpath) {
    const results = [];
    const parts = xpath.split('/');
    
    const traverse = (current, path, index) => {
      if (index >= path.length) {
        results.push(current);
        return;
      }
      
      const key = path[index];
      if (key === '*') {
        // Wildcard - traverse all children
        for (const childKey of Object.keys(current)) {
          if (childKey.startsWith('@_')) continue; // Skip attributes
          traverse(current[childKey], path, index + 1);
        }
      } else if (current[key]) {
        traverse(current[key], path, index + 1);
      }
    };
    
    traverse(obj, parts, 0);
    return results;
  }

  /**
   * Generate XML hash for integrity verification
   * @param {string} xmlString - XML string
   * @returns {string} SHA-256 hash
   */
  generateXMLHash(xmlString) {
    return crypto.createHash('sha256').update(xmlString).digest('hex');
  }

  /**
   * Verify XML integrity
   * @param {string} xmlString - XML string
   * @param {string} expectedHash - Expected hash
   * @returns {boolean} Verification result
   */
  verifyXMLIntegrity(xmlString, expectedHash) {
    const actualHash = this.generateXMLHash(xmlString);
    return actualHash === expectedHash;
  }

  /**
   * Convert XML to JSON
   * @param {string} xmlString - XML string
   * @returns {string} JSON string
   */
  xmlToJSON(xmlString) {
    try {
      const parsed = this.parseXML(xmlString);
      return JSON.stringify(parsed, null, 2);
    } catch (error) {
      throw new Error(`XML to JSON conversion failed: ${error.message}`);
    }
  }

  /**
   * Convert JSON to XML
   * @param {string} jsonString - JSON string
   * @param {string} rootElement - Root element name
   * @returns {string} XML string
   */
  jsonToXML(jsonString, rootElement = 'root') {
    try {
      const parsed = JSON.parse(jsonString);
      const wrapped = { [rootElement]: parsed };
      return this.buildXML(wrapped);
    } catch (error) {
      throw new Error(`JSON to XML conversion failed: ${error.message}`);
    }
  }

  /**
   * Merge multiple XML documents
   * @param {Array<string>} xmlStrings - Array of XML strings
   * @param {string} rootElement - Root element for merged document
   * @returns {string} Merged XML string
   */
  mergeXML(xmlStrings, rootElement = 'merged') {
    try {
      const merged = {};
      
      xmlStrings.forEach((xmlString, index) => {
        const parsed = this.parseXML(xmlString);
        Object.assign(merged, parsed);
      });
      
      const wrapped = { [rootElement]: merged };
      return this.buildXML(wrapped);
    } catch (error) {
      throw new Error(`XML merge failed: ${error.message}`);
    }
  }

  /**
   * Split XML into multiple documents
   * @param {string} xmlString - XML string to split
   * @param {Array<string>} splitPaths - Paths to split on
   * @returns {Array<string>} Array of XML strings
   */
  splitXML(xmlString, splitPaths) {
    try {
      const parsed = this.parseXML(xmlString);
      const results = [];
      
      splitPaths.forEach((path, index) => {
        const extracted = this.extractNodesFromObject(parsed, path.split('/'));
        if (extracted.length > 0) {
          const wrapped = { [`document_${index + 1}`]: extracted[0] };
          results.push(this.buildXML(wrapped));
        }
      });
      
      return results;
    } catch (error) {
      throw new Error(`XML split failed: ${error.message}`);
    }
  }
}

module.exports = ModernXMLProcessor;

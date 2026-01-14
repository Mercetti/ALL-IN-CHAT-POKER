/**
 * Safe DOM Utilities
 * Provides secure alternatives to innerHTML and unsafe DOM manipulation
 */

class SafeDOM {
  constructor() {
    this.isInitialized = false;
    this.init();
  }

  init() {
    this.isInitialized = true;
  }

  /**
   * Safely set text content (prevents XSS)
   */
  static setText(element, text) {
    if (element && typeof element.textContent !== 'undefined') {
      element.textContent = text;
    }
  }

  /**
   * Safely set HTML content with sanitization
   */
  static setHTML(element, html, options = {}) {
    if (!element) return;

    // Basic HTML sanitization
    const sanitized = this.sanitizeHTML(html, options);
    
    // Use DOMParser for safe HTML parsing
    const parser = new DOMParser();
    const doc = parser.parseFromString(sanitized, 'text/html');
    
    // Clear existing content
    while (element.firstChild) {
      element.removeChild(element.firstChild);
    }
    
    // Append sanitized content
    const body = doc.body;
    while (body.firstChild) {
      element.appendChild(body.firstChild);
    }
  }

  /**
   * Basic HTML sanitization
   */
  static sanitizeHTML(html, options = {}) {
    const allowedTags = options.allowedTags || [
      'p', 'br', 'strong', 'em', 'u', 'i', 'b',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li', 'span', 'div',
      'a', 'img', 'code', 'pre', 'blockquote'
    ];
    
    const allowedAttributes = options.allowedAttributes || {
      'a': ['href', 'title', 'target'],
      'img': ['src', 'alt', 'title', 'width', 'height'],
      'span': ['class', 'id'],
      'div': ['class', 'id'],
      'p': ['class', 'id'],
      'code': ['class'],
      'pre': ['class']
    };

    // Remove dangerous elements and attributes
    let sanitized = html;
    
    // Remove script tags and content
    sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    
    // Remove on* event handlers
    sanitized = sanitized.replace(/\s+on\w+\s*=\s*["'][^"']*["']/gi, '');
    
    // Remove javascript: URLs
    sanitized = sanitized.replace(/javascript:/gi, '');
    
    // Remove data: URLs except for images
    sanitized = sanitized.replace(/data:(?!image\/)/gi, '');
    
    // Remove style tags with dangerous content
    sanitized = sanitized.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
    
    // Remove iframe, object, embed tags
    sanitized = sanitized.replace(/<\/?(iframe|object|embed|form|input|button|select|textarea)\b[^>]*>/gi, '');
    
    // Remove meta tags
    sanitized = sanitized.replace(/<meta\b[^>]*>/gi, '');
    
    // Remove link tags
    sanitized = sanitized.replace(/<link\b[^>]*>/gi, '');
    
    return sanitized;
  }

  /**
   * Create element safely
   */
  static createElement(tagName, attributes = {}, textContent = '') {
    const element = document.createElement(tagName);
    
    // Set attributes safely
    Object.keys(attributes).forEach(key => {
      if (this.isValidAttribute(key, attributes[key])) {
        element.setAttribute(key, attributes[key]);
      }
    });
    
    // Set text content safely
    if (textContent) {
      this.setText(element, textContent);
    }
    
    return element;
  }

  /**
   * Check if attribute is safe
   */
  static isValidAttribute(name, value) {
    // Reject event handlers
    if (name.startsWith('on')) return false;
    
    // Reject javascript: URLs
    if (value && typeof value === 'string' && value.toLowerCase().includes('javascript:')) return false;
    
    // Reject data: URLs (except images)
    if (name === 'src' && value && typeof value === 'string' && value.toLowerCase().startsWith('data:')) {
      return value.toLowerCase().startsWith('data:image/');
    }
    
    return true;
  }

  /**
   * Create fragment from template
   */
  static createFragment(html) {
    const template = document.createElement('template');
    template.innerHTML = this.sanitizeHTML(html);
    return template.content.cloneNode(true);
  }

  /**
   * Append multiple children safely
   */
  static appendChildren(parent, children) {
    children.forEach(child => {
      if (child instanceof Node) {
        parent.appendChild(child);
      } else if (typeof child === 'string') {
        parent.appendChild(document.createTextNode(child));
      }
    });
  }

  /**
   * Remove all children safely
   */
  static removeChildren(element) {
    while (element.firstChild) {
      element.removeChild(element.firstChild);
    }
  }

  /**
   * Replace element content safely
   */
  static replaceContent(element, newContent) {
    this.removeChildren(element);
    
    if (typeof newContent === 'string') {
      this.setText(element, newContent);
    } else if (newContent instanceof Node) {
      element.appendChild(newContent);
    } else if (Array.isArray(newContent)) {
      this.appendChildren(element, newContent);
    }
  }

  /**
   * Create safe link
   */
  static createLink(href, text, options = {}) {
    const link = this.createElement('a', {
      href: this.sanitizeURL(href),
      title: options.title || '',
      target: options.target || '_self',
      rel: options.target === '_blank' ? 'noopener noreferrer' : ''
    }, text);
    
    return link;
  }

  /**
   * Sanitize URL
   */
  static sanitizeURL(url) {
    if (!url || typeof url !== 'string') return '#';
    
    // Remove javascript: URLs
    if (url.toLowerCase().startsWith('javascript:')) return '#';
    
    // Allow http, https, mailto, tel protocols
    const allowedProtocols = ['http:', 'https:', 'mailto:', 'tel:', '#'];
    const hasAllowedProtocol = allowedProtocols.some(protocol => 
      url.toLowerCase().startsWith(protocol)
    );
    
    return hasAllowedProtocol ? url : '#';
  }

  /**
   * Create safe image
   */
  static createImage(src, alt, options = {}) {
    const img = this.createElement('img', {
      src: this.sanitizeImageURL(src),
      alt: alt || '',
      width: options.width || '',
      height: options.height || '',
      title: options.title || ''
    });
    
    return img;
  }

  /**
   * Sanitize image URL
   */
  static sanitizeImageURL(url) {
    if (!url || typeof url !== 'string') return '';
    
    // Allow http, https, and data:image URLs
    if (url.toLowerCase().startsWith('data:image/')) return url;
    if (url.toLowerCase().startsWith('http://')) return url;
    if (url.toLowerCase().startsWith('https://')) return url;
    if (url.startsWith('/')) return url;
    
    return '';
  }

  /**
   * Create safe button
   */
  static createButton(text, onClick, options = {}) {
    const button = this.createElement('button', {
      type: 'button',
      class: options.className || '',
      id: options.id || '',
      disabled: options.disabled || false
    }, text);
    
    if (typeof onClick === 'function') {
      button.addEventListener('click', onClick);
    }
    
    return button;
  }

  /**
   * Create safe input
   */
  static createInput(type, options = {}) {
    const input = this.createElement('input', {
      type: type || 'text',
      name: options.name || '',
      id: options.id || '',
      class: options.className || '',
      placeholder: options.placeholder || '',
      value: options.value || '',
      required: options.required || false,
      disabled: options.disabled || false,
      maxlength: options.maxlength || ''
    });
    
    return input;
  }

  /**
   * Create safe form
   */
  static createForm(action, method, options = {}) {
    const form = this.createElement('form', {
      action: this.sanitizeURL(action),
      method: method || 'GET',
      class: options.className || '',
      id: options.id || ''
    });
    
    return form;
  }

  /**
   * Escape HTML entities
   */
  static escapeHTML(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Unescape HTML entities
   */
  static unescapeHTML(html) {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || div.innerText || '';
  }
}

// Global API
window.SafeDOM = SafeDOM;

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SafeDOM;
}

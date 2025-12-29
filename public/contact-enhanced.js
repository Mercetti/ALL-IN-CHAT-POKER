// Enhanced Contact Page JavaScript
class EnhancedContact {
    constructor() {
        this.currentContactType = null;
        this.form = null;
        this.init();
    }

    init() {
        this.bindEvents();
        this.initForm();
        this.initFAQ();
        this.initAnimations();
    }

    bindEvents() {
        // Option cards hover effects
        document.querySelectorAll('.option-card').forEach(card => {
            card.addEventListener('mouseenter', (e) => this.handleCardHover(e, true));
            card.addEventListener('mouseleave', (e) => this.handleCardHover(e, false));
        });

        // Form validation
        this.form = document.getElementById('contactForm');
        if (this.form) {
            this.form.addEventListener('submit', (e) => this.handleFormSubmit(e));
            
            // Real-time validation
            const inputs = this.form.querySelectorAll('.form-input, .form-textarea');
            inputs.forEach(input => {
                input.addEventListener('blur', () => this.validateField(input));
                input.addEventListener('input', () => this.clearFieldError(input));
            });

            // Character counter
            const messageTextarea = document.getElementById('message');
            if (messageTextarea) {
                messageTextarea.addEventListener('input', () => this.updateCharCount());
            }
        }

        // FAQ items
        document.querySelectorAll('.faq-question').forEach(question => {
            question.addEventListener('click', () => {
                const faqItem = question.parentElement;
                this.toggleFAQ(faqItem);
            });
        });

        // Contact methods
        document.querySelectorAll('.method-link').forEach(link => {
            link.addEventListener('click', (e) => this.handleContactMethod(e));
        });
    }

    initForm() {
        // Set up form field icons and animations
        this.addFormIcons();
        this.setupFormAnimations();
    }

    addFormIcons() {
        const fieldIcons = {
            name: '👤',
            email: '📧',
            twitchUsername: '🎮',
            subject: '📝',
            message: '💬'
        };

        Object.entries(fieldIcons).forEach((fieldName, icon) => {
            const field = document.getElementById(fieldName);
            if (field) {
                this.addFieldIcon(field, icon);
            }
        });
    }

    addFieldIcon(field, icon) {
        const wrapper = document.createElement('div');
        wrapper.className = 'form-input-wrapper';
        
        field.parentNode.insertBefore(wrapper, field);
        wrapper.appendChild(field);
        
        const iconElement = document.createElement('span');
        iconElement.className = 'form-input-icon';
        iconElement.textContent = icon;
        wrapper.insertBefore(iconElement, field);
        
        // Add styles for the icon
        const iconStyles = `
            .form-input-wrapper {
                position: relative;
            }
            .form-input-icon {
                position: absolute;
                left: 1rem;
                top: 50%;
                transform: translateY(-50%);
                color: var(--text-muted);
                pointer-events: none;
                transition: color var(--transition-normal);
            }
            .form-input-wrapper .form-input,
            .form-input-wrapper .form-textarea {
                padding-left: 3rem;
            }
            .form-input-wrapper:focus-within .form-input-icon {
                color: var(--primary-color);
            }
        `;
        
        if (!document.getElementById('contact-form-icon-styles')) {
            const styleSheet = document.createElement('style');
            styleSheet.id = 'contact-form-icon-styles';
            styleSheet.textContent = iconStyles;
            document.head.appendChild(styleSheet);
        }
    }

    setupFormAnimations() {
        // Animate form fields on focus
        const inputs = this.form?.querySelectorAll('.form-input, .form-textarea');
        inputs?.forEach(input => {
            input.addEventListener('focus', () => this.animateFieldFocus(input));
            input.addEventListener('blur', () => this.animateFieldBlur(input));
        });
    }

    animateFieldFocus(field) {
        field.style.transform = 'scale(1.02)';
        field.style.boxShadow = '0 0 20px rgba(0, 212, 255, 0.2)';
    }

    animateFieldBlur(field) {
        field.style.transform = '';
        field.style.boxShadow = '';
    }

    selectContactType(type) {
        this.currentContactType = type;
        
        // Update form type badge
        const badge = document.getElementById('formTypeBadge');
        if (badge) {
            const badgeData = {
                support: { icon: '🛠️', text: 'Technical Support' },
                feedback: { icon: '💡', text: 'Feedback & Suggestions' },
                partnership: { icon: '🤝', text: 'Partnership Inquiry' },
                general: { icon: '📝', text: 'General Inquiry' }
            };
            
            const data = badgeData[type];
            badge.innerHTML = `
                <span class="badge-icon">${data.icon}</span>
                <span class="badge-text">${data.text}</span>
            `;
        }

        // Show form section
        const formSection = document.getElementById('contactFormSection');
        if (formSection) {
            formSection.classList.add('active');
            formSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }

        // Pre-fill subject based on type
        const subjectField = document.getElementById('subject');
        if (subjectField) {
            const subjects = {
                support: 'Technical Support Request',
                feedback: 'Feedback & Feature Request',
                partnership: 'Partnership Inquiry',
                general: 'General Question'
            };
            subjectField.value = subjects[type] || '';
        }

        // Track selection
        this.trackContactTypeSelection(type);
    }

    async handleFormSubmit(event) {
        event.preventDefault();
        
        if (!this.validateForm()) {
            return;
        }

        const submitBtn = document.getElementById('submitBtn');
        const originalText = submitBtn.textContent;
        
        // Show loading state
        submitBtn.classList.add('loading');
        submitBtn.textContent = 'Sending...';
        submitBtn.disabled = true;

        try {
            // Collect form data
            const formData = new FormData(this.form);
            const data = Object.fromEntries(formData.entries());
            
            // Add contact type
            data.contactType = this.currentContactType;
            data.timestamp = new Date().toISOString();

            // Simulate API call (replace with actual endpoint)
            await this.submitContactForm(data);

            // Show success message
            this.showSuccessMessage();
            
            // Reset form
            this.resetForm();

            // Track submission
            this.trackFormSubmission(data);

        } catch (error) {
            console.error('Form submission failed:', error);
            this.showErrorMessage(error.message);
        } finally {
            // Reset button state
            submitBtn.classList.remove('loading');
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    }

    validateForm() {
        let isValid = true;
        const requiredFields = ['name', 'email', 'subject', 'message'];

        requiredFields.forEach(fieldName => {
            const field = document.getElementById(fieldName);
            if (!this.validateField(field)) {
                isValid = false;
            }
        });

        return isValid;
    }

    validateField(field) {
        if (!field) return true;

        const value = field.value.trim();
        const errorElement = document.getElementById(`${field.id}Error`);
        
        // Clear previous state
        field.classList.remove('error', 'success');
        if (errorElement) errorElement.classList.remove('show');

        // Validation rules
        let isValid = true;
        let errorMessage = '';

        if (field.hasAttribute('required') && !value) {
            isValid = false;
            errorMessage = `Please enter ${field.name}`;
        } else if (field.type === 'email' && value && !this.isValidEmail(value)) {
            isValid = false;
            errorMessage = 'Please enter a valid email address';
        } else if (field.id === 'message' && value.length > 1000) {
            isValid = false;
            errorMessage = 'Message must be less than 1000 characters';
        }

        // Update UI
        if (!isValid) {
            field.classList.add('error');
            if (errorElement) {
                errorElement.textContent = errorMessage;
                errorElement.classList.add('show');
            }
        } else if (value) {
            field.classList.add('success');
        }

        return isValid;
    }

    clearFieldError(field) {
        field.classList.remove('error');
        const errorElement = document.getElementById(`${field.id}Error`);
        if (errorElement) {
            errorElement.classList.remove('show');
        }
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    updateCharCount() {
        const messageTextarea = document.getElementById('message');
        const charCountElement = document.getElementById('charCount');
        
        if (messageTextarea && charCountElement) {
            const count = messageTextarea.value.length;
            charCountElement.textContent = count;
            
            // Update color based on count
            if (count > 900) {
                charCountElement.style.color = 'var(--warning-color)';
            } else if (count > 950) {
                charCountElement.style.color = 'var(--error-color)';
            } else {
                charCountElement.style.color = 'var(--text-muted)';
            }
        }
    }

    async submitContactForm(data) {
        // Simulate API call - replace with actual endpoint
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                // Simulate 90% success rate
                if (Math.random() > 0.1) {
                    resolve({ success: true, message: 'Message sent successfully!' });
                } else {
                    reject(new Error('Failed to send message. Please try again.'));
                }
            }, 2000);
        });
    }

    showSuccessMessage() {
        if (window.enhancedCommon) {
            window.enhancedCommon.showToast('Message sent successfully! We\'ll get back to you within 24 hours.', 'success');
        } else {
            // Fallback success message
            const successDiv = document.createElement('div');
            successDiv.className = 'success-message';
            successDiv.innerHTML = `
                <div class="success-icon">✅</div>
                <div class="success-text">
                    <h4>Message Sent!</h4>
                    <p>We'll get back to you within 24 hours.</p>
                </div>
            `;
            
            const formSection = document.getElementById('contactFormSection');
            if (formSection) {
                formSection.appendChild(successDiv);
                setTimeout(() => successDiv.remove(), 5000);
            }
        }
    }

    showErrorMessage(message) {
        if (window.enhancedCommon) {
            window.enhancedCommon.showToast(message, 'error');
        } else {
            // Fallback error message
            console.error(message);
        }
    }

    resetForm() {
        if (this.form) {
            this.form.reset();
            
            // Clear validation states
            this.form.querySelectorAll('.form-input, .form-textarea').forEach(field => {
                field.classList.remove('error', 'success');
            });
            
            // Hide error messages
            this.form.querySelectorAll('.form-error').forEach(error => {
                error.classList.remove('show');
            });
            
            // Reset character count
            const charCountElement = document.getElementById('charCount');
            if (charCountElement) {
                charCountElement.textContent = '0';
            }
        }

        // Hide form section
        const formSection = document.getElementById('contactFormSection');
        if (formSection) {
            formSection.classList.remove('active');
        }

        // Reset contact type
        this.currentContactType = null;
    }

    handleCardHover(event, isEntering) {
        const card = event.currentTarget;
        
        if (isEntering) {
            // Add glow effect
            card.style.boxShadow = '0 10px 30px rgba(0, 212, 255, 0.3)';
            
            // Animate icon
            const icon = card.querySelector('.option-icon');
            if (icon) {
                icon.style.transform = 'scale(1.1) rotate(5deg)';
            }
        } else {
            // Remove glow effect
            card.style.boxShadow = '';
            
            // Reset icon
            const icon = card.querySelector('.option-icon');
            if (icon) {
                icon.style.transform = '';
            }
        }
    }

    handleContactMethod(event) {
        const link = event.currentTarget;
        const href = link.getAttribute('href');
        
        // Track contact method click
        const method = link.textContent.trim();
        this.trackContactMethodClick(method);
        
        // Handle email links
        if (href.startsWith('mailto:')) {
            event.preventDefault();
            window.location.href = href;
        }
    }

    initFAQ() {
        // Auto-expand first FAQ item
        const firstFAQ = document.querySelector('.faq-item');
        if (firstFAQ) {
            this.toggleFAQ(firstFAQ);
        }
    }

    toggleFAQ(faqItem) {
        const isExpanded = faqItem.classList.contains('expanded');
        
        // Close all other FAQ items
        document.querySelectorAll('.faq-item').forEach(item => {
            if (item !== faqItem) {
                item.classList.remove('expanded');
            }
        });

        // Toggle current item
        faqItem.classList.toggle('expanded');
        
        // Track FAQ interaction
        if (!isExpanded) {
            const question = faqItem.querySelector('h3').textContent;
            this.trackFAQInteraction(question);
        }
    }

    initAnimations() {
        // Intersection Observer for cards and methods
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.animateElement(entry.target);
                }
            });
        }, observerOptions);

        // Observe elements
        document.querySelectorAll('.option-card, .contact-method, .faq-item').forEach(el => {
            observer.observe(el);
        });
    }

    animateElement(element) {
        element.style.opacity = '0';
        element.style.transform = 'translateY(30px)';
        
        setTimeout(() => {
            element.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
        }, 100);
    }

    // Analytics tracking methods
    trackContactTypeSelection(type) {
        console.log(`Contact type selected: ${type}`);
    }

    trackFormSubmission(data) {
        console.log('Form submitted:', data);
    }

    trackContactMethodClick(method) {
        console.log(`Contact method clicked: ${method}`);
    }

    trackFAQInteraction(question) {
        console.log(`FAQ opened: ${question}`);
    }

    // Public API
    selectContactType(type) {
        this.selectContactType(type);
    }

    resetForm() {
        this.resetForm();
    }
}

// Add success message styles
const successStyles = `
.success-message {
    display: flex;
    align-items: center;
    gap: 1rem;
    background: var(--success-color);
    color: var(--text-inverse);
    padding: 1rem 1.5rem;
    border-radius: var(--radius-lg);
    margin-top: 1rem;
    animation: slideIn 0.5s ease-out;
}

.success-icon {
    font-size: var(--font-size-xl);
}

.success-text h4 {
    margin: 0 0 0.25rem 0;
    font-size: var(--font-size-lg);
}

.success-text p {
    margin: 0;
    opacity: 0.9;
}
`;

// Inject styles
const styleSheet = document.createElement('style');
styleSheet.textContent = successStyles;
document.head.appendChild(styleSheet);

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.enhancedContact = new EnhancedContact();
});

// Export for potential external use
window.EnhancedContact = EnhancedContact;

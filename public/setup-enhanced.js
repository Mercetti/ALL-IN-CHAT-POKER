// Enhanced Setup Page JavaScript
class EnhancedSetup {
    constructor() {
        this.currentStep = 1;
        this.totalSteps = 5;
        this.completedSteps = new Set();
        this.init();
    }

    init() {
        this.bindEvents();
        this.updateStepIndicator();
        this.showStep(this.currentStep);
        this.initAnimations();
        this.loadProgress();
    }

    bindEvents() {
        // Step navigation
        document.getElementById('prevStep')?.addEventListener('click', () => this.previousStep());
        document.getElementById('nextStep')?.addEventListener('click', () => this.nextStep());
        document.getElementById('completeSetup')?.addEventListener('click', () => this.completeSetup());

        // Copy buttons
        document.querySelectorAll('.copy-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.copyToClipboard(e.target));
        });

        // Troubleshooting items
        document.querySelectorAll('.troubleshooting-item').forEach(item => {
            item.addEventListener('click', () => this.toggleTroubleshooting(item));
        });

        // Overview cards
        document.querySelectorAll('.overview-card').forEach(card => {
            card.addEventListener('click', () => this.scrollToSection(card.dataset.section));
        });

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft' && !e.target.matches('input, textarea')) {
                this.previousStep();
            } else if (e.key === 'ArrowRight' && !e.target.matches('input, textarea')) {
                this.nextStep();
            }
        });

        // Step indicators
        document.querySelectorAll('.step-indicator').forEach((indicator, index) => {
            indicator.addEventListener('click', () => this.goToStep(index + 1));
        });
    }

    updateStepIndicator() {
        const progressPercent = ((this.currentStep - 1) / (this.totalSteps - 1)) * 100;
        const progressBar = document.querySelector('.step-progress-bar');
        if (progressBar) {
            progressBar.style.width = `${progressPercent}%`;
        }

        // Update step indicators
        document.querySelectorAll('.step-indicator').forEach((indicator, index) => {
            const stepNum = index + 1;
            indicator.classList.remove('active', 'completed');
            
            if (stepNum === this.currentStep) {
                indicator.classList.add('active');
            } else if (this.completedSteps.has(stepNum)) {
                indicator.classList.add('completed');
            }
        });

        // Update navigation buttons
        const prevBtn = document.getElementById('prevStep');
        const nextBtn = document.getElementById('nextStep');
        const completeBtn = document.getElementById('completeSetup');

        if (prevBtn) {
            prevBtn.disabled = this.currentStep === 1;
        }

        if (nextBtn && completeBtn) {
            if (this.currentStep === this.totalSteps) {
                nextBtn.style.display = 'none';
                completeBtn.style.display = 'inline-flex';
            } else {
                nextBtn.style.display = 'inline-flex';
                completeBtn.style.display = 'none';
            }
        }

        // Save progress
        this.saveProgress();
    }

    showStep(stepNum) {
        // Hide all steps
        document.querySelectorAll('.step-content').forEach(content => {
            content.classList.remove('active');
        });

        // Show current step
        const currentStepContent = document.getElementById(`step-${stepNum}`);
        if (currentStepContent) {
            currentStepContent.classList.add('active');
        }

        this.updateStepIndicator();
    }

    nextStep() {
        if (this.currentStep < this.totalSteps) {
            this.completedSteps.add(this.currentStep);
            this.currentStep++;
            this.showStep(this.currentStep);
            this.showToast('Step completed!', 'success');
        }
    }

    previousStep() {
        if (this.currentStep > 1) {
            this.currentStep--;
            this.showStep(this.currentStep);
        }
    }

    goToStep(stepNum) {
        if (stepNum >= 1 && stepNum <= this.totalSteps) {
            // Mark all previous steps as completed
            for (let i = 1; i < stepNum; i++) {
                this.completedSteps.add(i);
            }
            this.currentStep = stepNum;
            this.showStep(this.currentStep);
        }
    }

    completeSetup() {
        this.completedSteps.add(this.currentStep);
        this.saveProgress();
        this.showToast('Setup completed successfully! 🎉', 'success');
        
        // Redirect to welcome page after a delay
        setTimeout(() => {
            window.location.href = '/welcome-enhanced.html';
        }, 2000);
    }

    copyToClipboard(button) {
        const codeBlock = button.closest('.code-block');
        const code = codeBlock.querySelector('code');
        
        if (code) {
            navigator.clipboard.writeText(code.textContent).then(() => {
                button.textContent = 'Copied!';
                button.classList.add('copied');
                
                setTimeout(() => {
                    button.textContent = 'Copy';
                    button.classList.remove('copied');
                }, 2000);
                
                this.showToast('Copied to clipboard!', 'success');
            }).catch(() => {
                // Fallback for older browsers
                const textArea = document.createElement('textarea');
                textArea.value = code.textContent;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                
                button.textContent = 'Copied!';
                button.classList.add('copied');
                
                setTimeout(() => {
                    button.textContent = 'Copy';
                    button.classList.remove('copied');
                }, 2000);
                
                this.showToast('Copied to clipboard!', 'success');
            });
        }
    }

    toggleTroubleshooting(item) {
        const isExpanded = item.classList.contains('expanded');
        
        // Close all other items
        document.querySelectorAll('.troubleshooting-item').forEach(otherItem => {
            if (otherItem !== item) {
                otherItem.classList.remove('expanded');
            }
        });
        
        // Toggle current item
        item.classList.toggle('expanded');
        
        // Update aria-expanded for accessibility
        const toggle = item.querySelector('.troubleshooting-toggle');
        if (toggle) {
            toggle.setAttribute('aria-expanded', !isExpanded);
        }
    }

    scrollToSection(sectionId) {
        const section = document.getElementById(sectionId);
        if (section) {
            section.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    showToast(message, type = 'success') {
        const toastContainer = document.querySelector('.toast-container');
        if (!toastContainer) return;

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icon = type === 'success' ? '✓' : type === 'error' ? '✗' : '⚠';
        
        toast.innerHTML = `
            <span class="toast-icon">${icon}</span>
            <span class="toast-message">${message}</span>
            <button class="toast-close" aria-label="Close notification">×</button>
        `;

        toastContainer.appendChild(toast);

        // Add close functionality
        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.addEventListener('click', () => {
            toast.remove();
        });

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
        }, 5000);
    }

    saveProgress() {
        const progress = {
            currentStep: this.currentStep,
            completedSteps: Array.from(this.completedSteps),
            timestamp: new Date().toISOString()
        };
        localStorage.setItem('setup-progress', JSON.stringify(progress));
    }

    loadProgress() {
        const saved = localStorage.getItem('setup-progress');
        if (saved) {
            try {
                const progress = JSON.parse(saved);
                this.currentStep = progress.currentStep || 1;
                this.completedSteps = new Set(progress.completedSteps || []);
                
                // If progress is older than 24 hours, reset it
                const savedTime = new Date(progress.timestamp);
                const now = new Date();
                const hoursDiff = (now - savedTime) / (1000 * 60 * 60);
                
                if (hoursDiff > 24) {
                    this.resetProgress();
                } else {
                    this.showStep(this.currentStep);
                    this.showToast('Progress restored from previous session', 'success');
                }
            } catch (e) {
                console.error('Failed to load setup progress:', e);
                this.resetProgress();
            }
        }
    }

    resetProgress() {
        this.currentStep = 1;
        this.completedSteps.clear();
        localStorage.removeItem('setup-progress');
        this.showStep(1);
    }

    initAnimations() {
        // Intersection Observer for scroll animations
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, observerOptions);

        // Observe glass panels
        document.querySelectorAll('.glass-panel').forEach(panel => {
            panel.style.opacity = '0';
            panel.style.transform = 'translateY(20px)';
            panel.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            observer.observe(panel);
        });

        // Observe overview cards
        document.querySelectorAll('.overview-card').forEach((card, index) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            card.style.transition = `opacity 0.6s ease ${index * 0.1}s, transform 0.6s ease ${index * 0.1}s`;
            observer.observe(card);
        });

        // Parallax effect for floating elements
        window.addEventListener('scroll', () => {
            const scrolled = window.pageYOffset;
            const parallaxElements = document.querySelectorAll('.floating-card, .gradient-orb');
            
            parallaxElements.forEach((element, index) => {
                const speed = 0.5 + (index * 0.1);
                element.style.transform = `translateY(${scrolled * speed}px)`;
            });
        });
    }

    // Utility methods
    validateStep(stepNum) {
        // Add validation logic for specific steps if needed
        return true;
    }

    getStepData(stepNum) {
        // Get data for specific step (e.g., form inputs)
        return {};
    }

    setStepData(stepNum, data) {
        // Set data for specific step
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new EnhancedSetup();
});

// Export for potential external use
window.EnhancedSetup = EnhancedSetup;

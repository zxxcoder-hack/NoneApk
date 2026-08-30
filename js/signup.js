// signup.js - Handles user registration with NoneApk API

import { CONFIG } from './config.js';

class NoneApkAuth {
    constructor() {
        this.apiUrl = CONFIG.API_URL;
        this.endpoints = {
            signup: '/signup',
            login: '/login',
            profile: '/profile',
            logout: '/logout'
        };
    }

    // Show loading state on button
    setLoading(button, isLoading) {
        if (isLoading) {
            button.disabled = true;
            button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating account...';
            button.classList.add('loading');
        } else {
            button.disabled = false;
            button.innerHTML = '<i class="fas fa-user-plus"></i> Create account';
            button.classList.remove('loading');
        }
    }

    // Display error message
    showError(message, fieldId = null) {
        // Clear all field errors first
        this.clearFieldErrors();
        
        if (fieldId) {
            const errorElement = document.getElementById(fieldId);
            if (errorElement) {
                errorElement.textContent = message;
                errorElement.style.display = 'block';
                // Highlight the field
                const input = errorElement.closest('.input-group')?.querySelector('input');
                if (input) input.classList.add('error');
                return;
            }
        }
        
        // Fallback to global error
        const errorDiv = document.getElementById('global-error') || this.createGlobalErrorElement();
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            errorDiv.style.display = 'none';
        }, 5000);
    }

    clearFieldErrors() {
        document.querySelectorAll('.field-error').forEach(el => {
            el.textContent = '';
            el.style.display = 'none';
        });
        document.querySelectorAll('input.error').forEach(el => {
            el.classList.remove('error');
        });
    }

    createGlobalErrorElement() {
        const errorDiv = document.createElement('div');
        errorDiv.id = 'global-error';
        errorDiv.className = 'error-message';
        errorDiv.style.cssText = `
            background: #fee;
            color: #c00;
            padding: 10px 15px;
            border-radius: 8px;
            margin-bottom: 15px;
            display: none;
            font-size: 14px;
            border: 1px solid #fcc;
            animation: slideDown 0.3s ease;
        `;
        const form = document.querySelector('form');
        form.insertBefore(errorDiv, form.firstChild);
        return errorDiv;
    }

    // Show success message
    showSuccess(message) {
        const successDiv = document.getElementById('success-message') || this.createSuccessElement();
        successDiv.textContent = message;
        successDiv.style.display = 'block';
        
        setTimeout(() => {
            successDiv.style.display = 'none';
        }, 5000);
    }

    createSuccessElement() {
        const successDiv = document.createElement('div');
        successDiv.id = 'success-message';
        successDiv.className = 'success-message';
        successDiv.style.cssText = `
            background: #e8f5e9;
            color: #2e7d32;
            padding: 10px 15px;
            border-radius: 8px;
            margin-bottom: 15px;
            display: none;
            font-size: 14px;
            border: 1px solid #c8e6c9;
            animation: slideDown 0.3s ease;
        `;
        const form = document.querySelector('form');
        form.insertBefore(successDiv, form.firstChild);
        return successDiv;
    }

    // Validate form inputs
    validateForm(data) {
        const errors = {};

        // Validate name
        if (!data.name || data.name.trim().length < 2 || data.name.trim().length > 50) {
            errors.name = 'Name must be between 2 and 50 characters';
        }

        // Validate email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!data.email || !emailRegex.test(data.email.trim())) {
            errors.email = 'Please enter a valid email address';
        }

        // Validate password
        if (!data.password || data.password.length < 8) {
            errors.password = 'Password must be at least 8 characters';
        } else {
            const hasUpperCase = /[A-Z]/.test(data.password);
            const hasLowerCase = /[a-z]/.test(data.password);
            const hasNumber = /[0-9]/.test(data.password);
            const hasSpecial = /[^A-Za-z0-9]/.test(data.password);
            
            if (!hasUpperCase || !hasLowerCase || !hasNumber || !hasSpecial) {
                errors.password = 'Password must contain uppercase, lowercase, number, and special character';
            }
        }

        // Validate terms agreement
        if (!data.agreedToTerms) {
            errors.terms = 'You must agree to the Terms & Conditions and Privacy Policy';
        }

        return errors;
    }

    // Main signup function
    async signup(userData) {
        try {
            // Validate form
            const validationErrors = this.validateForm(userData);
            
            // Display validation errors
            let hasErrors = false;
            for (const [field, message] of Object.entries(validationErrors)) {
                const errorId = field === 'terms' ? 'terms-error' : `${field}-error`;
                this.showError(message, errorId);
                hasErrors = true;
            }
            
            if (hasErrors) {
                return { success: false, errors: validationErrors };
            }

            // Get the submit button
            const button = document.getElementById('signup-btn');
            this.setLoading(button, true);

            // Make API request
            const response = await fetch(`${this.apiUrl}${this.endpoints.signup}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    email: userData.email.trim(),
                    password: userData.password,
                    name: userData.name.trim()
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Signup failed');
            }

            // Success - store token and user data
            if (data.success && data.token) {
                // Store authentication data
                localStorage.setItem('noneapk_token', data.token);
                localStorage.setItem('noneapk_user', JSON.stringify(data.user));
                
                this.showSuccess('Account created successfully! Redirecting...');
                
                // Redirect to dashboard after 1.5 seconds
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1500);
                
                return { success: true, data };
            } else {
                throw new Error(data.error || 'Signup failed');
            }

        } catch (error) {
            console.error('Signup error:', error);
            this.showError(error.message || 'Unable to create account. Please try again.');
            return { success: false, error: error.message };
        } finally {
            // Reset button state
            const button = document.getElementById('signup-btn');
            this.setLoading(button, false);
        }
    }

    // Check if user is already logged in
    checkAuth() {
        const token = localStorage.getItem('noneapk_token');
        const user = localStorage.getItem('noneapk_user');
        
        if (token && user) {
            try {
                const userData = JSON.parse(user);
                return { isAuthenticated: true, user: userData };
            } catch (e) {
                return { isAuthenticated: false, user: null };
            }
        }
        return { isAuthenticated: false, user: null };
    }

    // Redirect if already logged in
    redirectIfAuthenticated() {
        const auth = this.checkAuth();
        if (auth.isAuthenticated) {
            window.location.href = 'dashboard.html';
        }
    }
}

// ============================================
// DOM EVENT HANDLERS
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    const auth = new NoneApkAuth();
    
    // Redirect if already logged in
    auth.redirectIfAuthenticated();

    // Get form elements
    const form = document.getElementById('signup-form');
    const nameInput = document.getElementById('signup-name');
    const emailInput = document.getElementById('signup-email');
    const passwordInput = document.getElementById('signup-password');
    const termsCheckbox = document.getElementById('terms-agree');
    const roleRadios = document.querySelectorAll('input[name="role"]');

    // Add real-time validation feedback
    nameInput.addEventListener('blur', function() {
        const name = this.value.trim();
        const errorElement = document.getElementById('name-error');
        
        if (name && (name.length < 2 || name.length > 50)) {
            errorElement.textContent = 'Name must be between 2 and 50 characters';
            errorElement.style.display = 'block';
            this.classList.add('error');
        } else if (name) {
            errorElement.style.display = 'none';
            this.classList.remove('error');
            this.classList.add('success');
        } else {
            errorElement.style.display = 'none';
            this.classList.remove('error', 'success');
        }
    });

    emailInput.addEventListener('blur', function() {
        const email = this.value.trim();
        const errorElement = document.getElementById('email-error');
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        
        if (email && !emailRegex.test(email)) {
            errorElement.textContent = 'Please enter a valid email address';
            errorElement.style.display = 'block';
            this.classList.add('error');
        } else if (email) {
            errorElement.style.display = 'none';
            this.classList.remove('error');
            this.classList.add('success');
        } else {
            errorElement.style.display = 'none';
            this.classList.remove('error', 'success');
        }
    });

    passwordInput.addEventListener('blur', function() {
        const password = this.value;
        const errorElement = document.getElementById('password-error');
        
        if (password && password.length > 0) {
            const errors = [];
            
            if (password.length < 8) {
                errors.push('At least 8 characters');
            }
            if (!/[A-Z]/.test(password)) {
                errors.push('One uppercase letter');
            }
            if (!/[a-z]/.test(password)) {
                errors.push('One lowercase letter');
            }
            if (!/[0-9]/.test(password)) {
                errors.push('One number');
            }
            if (!/[^A-Za-z0-9]/.test(password)) {
                errors.push('One special character');
            }
            
            if (errors.length > 0) {
                errorElement.textContent = 'Password needs: ' + errors.join(', ');
                errorElement.style.display = 'block';
                this.classList.add('error');
                this.classList.remove('success');
            } else {
                errorElement.style.display = 'none';
                this.classList.remove('error');
                this.classList.add('success');
            }
        } else {
            errorElement.style.display = 'none';
            this.classList.remove('error', 'success');
        }
    });

    // Password strength indicator
    passwordInput.addEventListener('input', function() {
        const password = this.value;
        const strengthBar = document.getElementById('strength-bar');
        const hints = document.querySelectorAll('.password-hints small');
        
        if (password.length === 0) {
            strengthBar.style.width = '0%';
            strengthBar.style.background = '#ddd';
            hints.forEach(hint => {
                hint.style.color = '#666';
                hint.querySelector('i').className = 'fas fa-circle';
            });
            return;
        }
        
        let strength = 0;
        const checks = {
            length: password.length >= 8,
            upper: /[A-Z]/.test(password),
            lower: /[a-z]/.test(password),
            number: /[0-9]/.test(password),
            special: /[^A-Za-z0-9]/.test(password)
        };
        
        // Update hints
        const hintMap = [
            { key: 'length', text: 'At least 8 characters' },
            { key: 'upper', text: 'Uppercase & lowercase' },
            { key: 'number', text: 'Number & special character' }
        ];
        
        // Simplified hint updates
        const hintConditions = [
            checks.length,
            checks.upper && checks.lower,
            checks.number && checks.special
        ];
        
        hints.forEach((hint, index) => {
            if (hintConditions[index]) {
                hint.style.color = '#4caf50';
                hint.querySelector('i').className = 'fas fa-check-circle';
                strength++;
            } else {
                hint.style.color = '#666';
                hint.querySelector('i').className = 'fas fa-circle';
            }
        });
        
        const percentage = (strength / 3) * 100;
        strengthBar.style.width = percentage + '%';
        
        if (strength <= 1) {
            strengthBar.style.background = '#ff4444';
        } else if (strength <= 2) {
            strengthBar.style.background = '#ffa500';
        } else {
            strengthBar.style.background = '#4caf50';
        }
    });

    // Terms checkbox validation on change
    termsCheckbox.addEventListener('change', function() {
        const errorElement = document.getElementById('terms-error');
        if (this.checked) {
            errorElement.style.display = 'none';
            this.closest('.checkbox-container').classList.remove('error');
        } else {
            this.closest('.checkbox-container').classList.add('error');
        }
    });

    // Open terms/privacy in new tab when clicked
    document.querySelectorAll('.terms-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            window.open(this.href, '_blank');
        });
    });

    // Form submission
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Get form data
        const name = nameInput.value.trim();
        const email = emailInput.value.trim();
        const password = passwordInput.value;
        const agreedToTerms = termsCheckbox.checked;
        
        // Get selected role
        let role = 'user';
        roleRadios.forEach(radio => {
            if (radio.checked) {
                role = radio.value;
            }
        });

        // Create user data object
        const userData = {
            name: name,
            email: email,
            password: password,
            role: role,
            agreedToTerms: agreedToTerms
        };

        // Call signup
        await auth.signup(userData);
    });

    // Add keyboard shortcut for submit (Ctrl+Enter)
    form.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            form.dispatchEvent(new Event('submit'));
        }
    });

    // Add password visibility toggle
    const passwordGroup = passwordInput.closest('.input-group');
    const passwordToggle = document.createElement('button');
    passwordToggle.type = 'button';
    passwordToggle.className = 'password-toggle';
    passwordToggle.innerHTML = '<i class="fas fa-eye"></i>';
    passwordToggle.style.cssText = `
        position: absolute;
        right: 10px;
        top: 50%;
        transform: translateY(-50%);
        background: none;
        border: none;
        cursor: pointer;
        color: #666;
        padding: 5px;
        z-index: 1;
    `;
    
    passwordGroup.style.position = 'relative';
    passwordGroup.appendChild(passwordToggle);
    
    passwordToggle.addEventListener('click', function() {
        const input = this.parentElement.querySelector('input');
        const icon = this.querySelector('i');
        if (input.type === 'password') {
            input.type = 'text';
            icon.className = 'fas fa-eye-slash';
        } else {
            input.type = 'password';
            icon.className = 'fas fa-eye';
        }
    });});

// ============================================
// HELPER FUNCTIONS FOR OTHER PAGES
// ============================================

// Export for use in other scripts if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NoneApkAuth;
}
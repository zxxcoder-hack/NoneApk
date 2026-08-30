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
        this.clearFieldErrors();
        
        if (fieldId) {
            const errorElement = document.getElementById(fieldId);
            if (errorElement) {
                errorElement.textContent = message;
                errorElement.style.display = 'block';
                const input = errorElement.closest('.input-group')?.querySelector('input');
                if (input) input.classList.add('error');
                return;
            }
        }
        
        const errorDiv = document.getElementById('global-error') || this.createGlobalErrorElement();
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        
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
    
    validateForm(data) {
        const errors = {};
        
        if (!data.name || data.name.trim().length < 2 || data.name.trim().length > 50) {
            errors.name = 'Name must be between 2 and 50 characters';
        }
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!data.email || !emailRegex.test(data.email.trim())) {
            errors.email = 'Please enter a valid email address';
        }
        
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
        
        if (!data.agreedToTerms) {
            errors.terms = 'You must agree to the Terms & Conditions and Privacy Policy';
        }
        
        return errors;
    }
    
    async signup(userData) {
        try {
            const validationErrors = this.validateForm(userData);
            
            let hasErrors = false;
            for (const [field, message] of Object.entries(validationErrors)) {
                const errorId = field === 'terms' ? 'terms-error' : `${field}-error`;
                this.showError(message, errorId);
                hasErrors = true;
            }
            
            if (hasErrors) {
                return { success: false, errors: validationErrors };
            }
            
            const button = document.getElementById('signup-btn');
            this.setLoading(button, true);
            
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
            
            if (data.success && data.token) {
                localStorage.setItem('noneapk_token', data.token);
                localStorage.setItem('noneapk_user', JSON.stringify(data.user));
                
                this.showSuccess('Account created successfully! Redirecting...');
                
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
            const button = document.getElementById('signup-btn');
            this.setLoading(button, false);
        }
    }
    
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
    
    redirectIfAuthenticated() {
        const auth = this.checkAuth();
        if (auth.isAuthenticated) {
            window.location.href = 'dashboard.html';
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    const auth = new NoneApkAuth();
    auth.redirectIfAuthenticated();
    
    const form = document.getElementById('signup-form');
    const nameInput = document.getElementById('signup-name');
    const emailInput = document.getElementById('signup-email');
    const passwordInput = document.getElementById('signup-password');
    const termsCheckbox = document.getElementById('terms-agree');
    const roleRadios = document.querySelectorAll('input[name="role"]');
    
    // Add your event listeners here...
    // (Keep all your existing event listener code)
    
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const name = nameInput.value.trim();
        const email = emailInput.value.trim();
        const password = passwordInput.value;
        const agreedToTerms = termsCheckbox.checked;
        
        let role = 'user';
        roleRadios.forEach(radio => {
            if (radio.checked) {
                role = radio.value;
            }
        });
        
        const userData = {
            name: name,
            email: email,
            password: password,
            role: role,
            agreedToTerms: agreedToTerms
        };
        
        await auth.signup(userData);
    });
});
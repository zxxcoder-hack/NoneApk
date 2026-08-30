// login.js - Handles user login with NoneApk API
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
            button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';
            button.classList.add('loading');
        } else {
            button.disabled = false;
            button.innerHTML = 'Log in';
            button.classList.remove('loading');
        }
    }

    // Display error message
    showError(message) {
        const errorDiv = document.getElementById('error-message') || this.createErrorElement();
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        
        setTimeout(() => {
            errorDiv.style.display = 'none';
        }, 5000);
    }

    createErrorElement() {
        const errorDiv = document.createElement('div');
        errorDiv.id = 'error-message';
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
        const errors = [];

        if (!data.email || data.email.trim().length === 0) {
            errors.push('Please enter your email or username');
        }

        if (!data.password || data.password.length === 0) {
            errors.push('Please enter your password');
        }

        return errors;
    }

    // Main login function
    async login(credentials) {
        try {
            const validationErrors = this.validateForm(credentials);
            if (validationErrors.length > 0) {
                this.showError(validationErrors[0]);
                return { success: false, errors: validationErrors };
            }

            const button = document.querySelector('.btn-primary');
            this.setLoading(button, true);

            const response = await fetch(`${this.apiUrl}${this.endpoints.login}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    email: credentials.email.trim(),
                    password: credentials.password
                })
            });

            const data = await response.json();

            if (!response.ok) {
                if (response.status === 423) {
                    throw new Error('Account is locked. Please try again later.');
                } else if (response.status === 429) {
                    throw new Error('Too many login attempts. Please wait a few minutes.');
                } else if (response.status === 401) {
                    throw new Error('Invalid email or password');
                } else {
                    throw new Error(data.error || 'Login failed. Please try again.');
                }
            }

            if (data.success && data.token) {
                localStorage.setItem('noneapk_token', data.token);
                localStorage.setItem('noneapk_user', JSON.stringify(data.user));
                
                this.showSuccess('Login successful! Redirecting...');
                
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1000);
                
                return { success: true, data };
            } else {
                throw new Error(data.error || 'Login failed');
            }

        } catch (error) {
            console.error('Login error:', error);
            this.showError(error.message || 'Unable to login. Please try again.');
            return { success: false, error: error.message };
        } finally {
            const button = document.querySelector('.btn-primary');
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

    // Logout function
    async logout() {
        try {
            const token = localStorage.getItem('noneapk_token');
            if (token) {
                await fetch(`${this.apiUrl}${this.endpoints.logout}`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
            }
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            localStorage.removeItem('noneapk_token');
            localStorage.removeItem('noneapk_user');
            window.location.href = 'login.html';
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
    const form = document.querySelector('form');
    const emailInput = document.querySelector('input[placeholder="you@example.com"]');
    const passwordInput = document.querySelector('input[placeholder="••••••••"]');

    // Add real-time validation feedback
    emailInput.addEventListener('blur', function() {
        const email = this.value.trim();
        const emailGroup = this.closest('.input-group');
        const existingError = emailGroup.querySelector('.field-error');
        
        if (existingError) existingError.remove();
        
        if (email && email.length > 0) {
            const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
            if (!isEmail && email.length < 3) {
                const error = document.createElement('div');
                error.className = 'field-error';
                error.style.cssText = `
                    color: #c00;
                    font-size: 12px;
                    margin-top: 4px;
                `;
                error.textContent = 'Please enter a valid email or username';
                emailGroup.appendChild(error);
                this.style.borderColor = '#c00';
            } else {
                this.style.borderColor = '#4caf50';
            }
        } else {
            this.style.borderColor = '';
        }
    });

    passwordInput.addEventListener('blur', function() {
        const password = this.value;
        const passwordGroup = this.closest('.input-group');
        const existingError = passwordGroup.querySelector('.field-error');
        
        if (existingError) existingError.remove();
        
        if (password && password.length > 0 && password.length < 8) {
            const error = document.createElement('div');
            error.className = 'field-error';
            error.style.cssText = `
                color: #c00;
                font-size: 12px;
                margin-top: 4px;
            `;
            error.textContent = 'Password must be at least 8 characters';
            passwordGroup.appendChild(error);
            this.style.borderColor = '#c00';
        } else if (password && password.length >= 8) {
            this.style.borderColor = '#4caf50';
        } else {
            this.style.borderColor = '';
        }
    });

    // Form submission
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const email = emailInput.value.trim();
        const password = passwordInput.value;

        await auth.login({ email, password });
    });

    // Add keyboard shortcuts
    form.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            form.dispatchEvent(new Event('submit'));
        }
    });

    // Add password visibility toggle
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
    
    const passwordGroup = passwordInput.closest('.input-group');
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
    });

    // Add "Forgot password?" link
    const forgotPasswordLink = document.createElement('a');
    forgotPasswordLink.href = '#';
    forgotPasswordLink.className = 'forgot-password';
    forgotPasswordLink.textContent = 'Forgot password?';
    forgotPasswordLink.style.cssText = `
        display: block;
        text-align: right;
        font-size: 14px;
        color: #6c63ff;
        text-decoration: none;
        margin-top: 5px;
        margin-bottom: 15px;
    `;
    
    forgotPasswordLink.addEventListener('click', function(e) {
        e.preventDefault();
        alert('Password reset functionality will be available soon. Please contact support.');
    });
    
    passwordGroup.parentElement.insertBefore(forgotPasswordLink, passwordGroup.nextSibling);

    // Handle "Remember me" checkbox if it exists
    const rememberCheckbox = document.getElementById('remember-me');
    if (rememberCheckbox) {
        const savedEmail = localStorage.getItem('noneapk_saved_email');
        if (savedEmail) {
            emailInput.value = savedEmail;
            rememberCheckbox.checked = true;
        }
        
        rememberCheckbox.addEventListener('change', function() {
            if (this.checked) {
                localStorage.setItem('noneapk_saved_email', emailInput.value);
            } else {
                localStorage.removeItem('noneapk_saved_email');
            }
        });
    }

    console.log('🔐 Login page ready');
});

// ============================================
// EXPOSE HELPER FUNCTIONS
// ============================================

// Export for use in other scripts if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NoneApkAuth;
}
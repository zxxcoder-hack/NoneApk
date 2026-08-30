// profile.js - Handles user profile management with NoneApk API
import { CONFIG } from './config.js';

class NoneApkProfile {
    constructor() {
        this.apiUrl = CONFIG.API_URL;
        this.endpoints = {
            profile: '/profile',
            logout: '/logout',
            updateProfile: '/profile'
        };
        this.token = localStorage.getItem('noneapk_token');
        this.user = JSON.parse(localStorage.getItem('noneapk_user') || '{}');
    }

    // Check if user is authenticated
    isAuthenticated() {
        if (!this.token) {
            window.location.href = 'login.html';
            return false;
        }
        return true;
    }

    // Fetch user profile from API
    async fetchProfile() {
        try {
            const response = await fetch(`${this.apiUrl}${this.endpoints.profile}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                if (response.status === 401) {
                    localStorage.removeItem('noneapk_token');
                    localStorage.removeItem('noneapk_user');
                    window.location.href = 'login.html';
                    throw new Error('Session expired. Please login again.');
                }
                throw new Error('Failed to fetch profile');
            }

            const data = await response.json();
            if (data.success) {
                localStorage.setItem('noneapk_user', JSON.stringify(data.user));
                this.user = data.user;
                return data.user;
            } else {
                throw new Error(data.error || 'Failed to fetch profile');
            }
        } catch (error) {
            console.error('Fetch profile error:', error);
            throw error;
        }
    }

    // Update user profile
    async updateProfile(profileData) {
        try {
            const response = await fetch(`${this.apiUrl}${this.endpoints.updateProfile}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(profileData)
            });

            if (!response.ok) {
                if (response.status === 401) {
                    localStorage.removeItem('noneapk_token');
                    localStorage.removeItem('noneapk_user');
                    window.location.href = 'login.html';
                    throw new Error('Session expired. Please login again.');
                }
                const data = await response.json();
                throw new Error(data.error || 'Failed to update profile');
            }

            const data = await response.json();
            if (data.success) {
                localStorage.setItem('noneapk_user', JSON.stringify(data.user));
                this.user = data.user;
                return data.user;
            } else {
                throw new Error(data.error || 'Failed to update profile');
            }
        } catch (error) {
            console.error('Update profile error:', error);
            throw error;
        }
    }

    // Change password
    async changePassword(currentPassword, newPassword) {
        try {
            const response = await fetch(`${this.apiUrl}/change-password`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    currentPassword,
                    newPassword
                })
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to change password');
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Change password error:', error);
            throw error;
        }
    }

    // Delete account
    async deleteAccount(email) {
        try {
            const response = await fetch(`${this.apiUrl}/delete-account`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email })
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to delete account');
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Delete account error:', error);
            throw error;
        }
    }

    // Logout
    async logout() {
        try {
            await fetch(`${this.apiUrl}${this.endpoints.logout}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                }
            });
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            localStorage.removeItem('noneapk_token');
            localStorage.removeItem('noneapk_user');
            window.location.href = 'login.html';
        }
    }

    // Validate name
    validateName(name) {
        return name && name.length >= 2 && name.length <= 50;
    }

    // Validate password
    validatePassword(password) {
        if (!password || password.length < 8) return false;
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumber = /[0-9]/.test(password);
        const hasSpecial = /[^A-Za-z0-9]/.test(password);
        return hasUpperCase && hasLowerCase && hasNumber && hasSpecial;
    }

    // Show toast notification
    showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.className = `toast ${type}`;
        toast.style.display = 'block';
        
        setTimeout(() => {
            toast.style.display = 'none';
        }, 4000);
    }

    // Set loading state on button
    setLoading(button, isLoading, originalText = '') {
        if (isLoading) {
            button.disabled = true;
            button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
        } else {
            button.disabled = false;
            button.innerHTML = originalText || button.textContent;
        }
    }
}

// ============================================
// DOM EVENT HANDLERS
// ============================================

document.addEventListener('DOMContentLoaded', async function() {
    const profile = new NoneApkProfile();
    
    // Check authentication
    if (!profile.isAuthenticated()) return;

    // DOM Elements
    const elements = {
        // Profile display
        avatarInitials: document.getElementById('avatar-initials'),
        profileName: document.getElementById('profile-name'),
        profileEmail: document.getElementById('profile-email'),
        profileRole: document.getElementById('profile-role'),
        userNameDisplay: document.getElementById('user-name-display'),
        memberSince: document.getElementById('member-since'),
        
        // Form inputs
        editName: document.getElementById('edit-name'),
        editEmail: document.getElementById('edit-email'),
        editTheme: document.getElementById('edit-theme'),
        
        // Buttons
        saveProfileBtn: document.getElementById('save-profile-btn'),
        cancelBtn: document.getElementById('cancel-btn'),
        logoutLink: document.getElementById('logout-link'),
        changePasswordBtn: document.getElementById('change-password-btn'),
        deleteAccountBtn: document.getElementById('delete-account-btn'),
        avatarUploadBtn: document.getElementById('avatar-upload-btn'),
        avatarInput: document.getElementById('avatar-input'),
        
        // Modals
        passwordModal: document.getElementById('password-modal'),
        passwordModalClose: document.getElementById('password-modal-close'),
        passwordCancelBtn: document.getElementById('password-cancel-btn'),
        passwordSaveBtn: document.getElementById('password-save-btn'),
        currentPassword: document.getElementById('current-password'),
        newPassword: document.getElementById('new-password'),
        confirmPassword: document.getElementById('confirm-password'),
        
        deleteModal: document.getElementById('delete-modal'),
        deleteModalClose: document.getElementById('delete-modal-close'),
        deleteCancelBtn: document.getElementById('delete-cancel-btn'),
        deleteConfirmBtn: document.getElementById('delete-confirm-btn'),
        deleteConfirmEmail: document.getElementById('delete-confirm-email'),
        
        // Forms
        profileForm: document.getElementById('profile-form'),
        passwordForm: document.getElementById('password-form'),
        deleteForm: document.getElementById('delete-form')
    };

    // Load profile data
    async function loadProfile() {
        try {
            const userData = await profile.fetchProfile();
            displayProfile(userData);
        } catch (error) {
            profile.showToast('Failed to load profile: ' + error.message, 'error');
        }
    }

    // Display profile data
    function displayProfile(userData) {
        const initials = userData.name
            .split(' ')
            .map(word => word[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
        
        elements.avatarInitials.textContent = initials;
        elements.profileName.textContent = userData.name;
        elements.profileEmail.textContent = userData.email;
        elements.userNameDisplay.textContent = userData.name;
        
        const role = userData.role || 'user';
        const roleBadge = elements.profileRole.querySelector('.role-badge');
        if (roleBadge) {
            roleBadge.textContent = role.charAt(0).toUpperCase() + role.slice(1);
            roleBadge.className = `role-badge ${role}`;
        }
        
        elements.editName.value = userData.name;
        elements.editEmail.value = userData.email;
        elements.editTheme.value = userData.theme || 'dark';
        
        if (userData.createdAt) {
            const date = new Date(userData.createdAt);
            elements.memberSince.textContent = date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        }
    }

    // Save profile changes
    async function saveProfile() {
        const name = elements.editName.value.trim();
        
        if (!profile.validateName(name)) {
            profile.showToast('Name must be between 2 and 50 characters', 'error');
            elements.editName.focus();
            return;
        }
        
        const theme = elements.editTheme.value;
        
        try {
            profile.setLoading(elements.saveProfileBtn, true, 'Save Changes');
            
            const updatedUser = await profile.updateProfile({
                name: name,
                theme: theme
            });
            
            displayProfile(updatedUser);
            profile.showToast('Profile updated successfully!', 'success');
        } catch (error) {
            profile.showToast('Failed to update profile: ' + error.message, 'error');
        } finally {
            profile.setLoading(elements.saveProfileBtn, false, 'Save Changes');
        }
    }

    // Change password
    async function changePassword() {
        const currentPassword = elements.currentPassword.value;
        const newPassword = elements.newPassword.value;
        const confirmPassword = elements.confirmPassword.value;
        
        if (!currentPassword || !newPassword || !confirmPassword) {
            profile.showToast('All password fields are required', 'error');
            return;
        }
        
        if (newPassword !== confirmPassword) {
            profile.showToast('New passwords do not match', 'error');
            return;
        }
        
        if (!profile.validatePassword(newPassword)) {
            profile.showToast('Password must be at least 8 characters with uppercase, lowercase, number, and special character', 'error');
            return;
        }
        
        try {
            profile.setLoading(elements.passwordSaveBtn, true, 'Update Password');
            
            await profile.changePassword(currentPassword, newPassword);
            
            elements.currentPassword.value = '';
            elements.newPassword.value = '';
            elements.confirmPassword.value = '';
            
            elements.passwordModal.style.display = 'none';
            
            profile.showToast('Password changed successfully!', 'success');
        } catch (error) {
            profile.showToast('Failed to change password: ' + error.message, 'error');
        } finally {
            profile.setLoading(elements.passwordSaveBtn, false, 'Update Password');
        }
    }

    // Delete account
    async function deleteAccount() {
        const email = elements.deleteConfirmEmail.value.trim();
        
        if (!email) {
            profile.showToast('Please enter your email to confirm', 'error');
            return;
        }
        
        if (email !== profile.user.email) {
            profile.showToast('Email does not match your account email', 'error');
            return;
        }
        
        if (!confirm('Are you sure you want to permanently delete your account? This action cannot be undone!')) {
            return;
        }
        
        try {
            profile.setLoading(elements.deleteConfirmBtn, true, 'Yes, Delete My Account');
            
            await profile.deleteAccount(email);
            
            localStorage.removeItem('noneapk_token');
            localStorage.removeItem('noneapk_user');
            
            profile.showToast('Account deleted successfully', 'success');
            
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 2000);
        } catch (error) {
            profile.showToast('Failed to delete account: ' + error.message, 'error');
        } finally {
            profile.setLoading(elements.deleteConfirmBtn, false, 'Yes, Delete My Account');
        }
    }

    // ============================================
    // EVENT LISTENERS
    // ============================================

    // Load profile on page load
    await loadProfile();

    // Save profile
    elements.profileForm.addEventListener('submit', function(e) {
        e.preventDefault();
        saveProfile();
    });

    // Cancel button - reset form values
    elements.cancelBtn.addEventListener('click', function() {
        displayProfile(profile.user);
        profile.showToast('Changes discarded', 'info');
    });

    // Logout
    elements.logoutLink.addEventListener('click', function(e) {
        e.preventDefault();
        if (confirm('Are you sure you want to logout?')) {
            profile.logout();
        }
    });

    // Change password modal
    elements.changePasswordBtn.addEventListener('click', function() {
        elements.passwordModal.style.display = 'flex';
        elements.currentPassword.focus();
    });

    function closePasswordModal() {
        elements.passwordModal.style.display = 'none';
        elements.currentPassword.value = '';
        elements.newPassword.value = '';
        elements.confirmPassword.value = '';
    }

    elements.passwordModalClose.addEventListener('click', closePasswordModal);
    elements.passwordCancelBtn.addEventListener('click', closePasswordModal);
    elements.passwordModal.addEventListener('click', function(e) {
        if (e.target === this) closePasswordModal();
    });

    // Submit password change
    elements.passwordForm.addEventListener('submit', function(e) {
        e.preventDefault();
        changePassword();
    });

    // Delete account modal
    elements.deleteAccountBtn.addEventListener('click', function() {
        elements.deleteModal.style.display = 'flex';
        elements.deleteConfirmEmail.focus();
    });

    function closeDeleteModal() {
        elements.deleteModal.style.display = 'none';
        elements.deleteConfirmEmail.value = '';
    }

    elements.deleteModalClose.addEventListener('click', closeDeleteModal);
    elements.deleteCancelBtn.addEventListener('click', closeDeleteModal);
    elements.deleteModal.addEventListener('click', function(e) {
        if (e.target === this) closeDeleteModal();
    });

    // Confirm delete
    elements.deleteConfirmBtn.addEventListener('click', deleteAccount);
    elements.deleteForm.addEventListener('submit', function(e) {
        e.preventDefault();
        deleteAccount();
    });

    // Avatar upload (placeholder functionality)
    elements.avatarUploadBtn.addEventListener('click', function() {
        elements.avatarInput.click();
    });

    elements.avatarInput.addEventListener('change', function(e) {
        const file = this.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(ev) {
                profile.showToast('Avatar upload feature coming soon!', 'info');
            };
            reader.readAsDataURL(file);
        }
        this.value = '';
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            if (elements.passwordModal.style.display === 'flex') {
                closePasswordModal();
            }
            if (elements.deleteModal.style.display === 'flex') {
                closeDeleteModal();
            }
        }
        
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            if (!elements.passwordModal.style.display === 'flex' && !elements.deleteModal.style.display === 'flex') {
                saveProfile();
            }
        }
    });

    // Settings link
    document.getElementById('settings-link').addEventListener('click', function(e) {
        e.preventDefault();
        document.querySelector('.account-actions').scrollIntoView({ behavior: 'smooth' });
    });

    // Session management
    document.getElementById('sessions-btn').addEventListener('click', function() {
        profile.showToast('Session management coming soon!', 'info');
    });

    console.log('👤 Profile page ready');
});

// ============================================
// EXPOSE HELPER FUNCTIONS
// ============================================

// Export for use in other scripts if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NoneApkProfile;
}
// main.js - Complete with catalog loading and authentication
import { CONFIG } from './config.js';

// ============================================
// AUTHENTICATION MANAGEMENT
// ============================================

class NoneApkAuth {
    constructor() {
        this.apiUrl = CONFIG.API_URL;
        this.token = localStorage.getItem('noneapk_token');
        this.user = JSON.parse(localStorage.getItem('noneapk_user') || 'null');
        this.isAuthenticated = !!this.token && !!this.user;
        
        this.updateNavigation();
    }

    updateNavigation() {
        const authLinks = document.getElementById('authLinks');
        if (!authLinks) return;
        
        if (this.isAuthenticated && this.user) {
            const name = this.user.name || 'User';
            const initials = name
                .split(' ')
                .map(word => word[0])
                .join('')
                .toUpperCase()
                .slice(0, 2);
            
            authLinks.innerHTML = `
                <div class="user-menu">
                    <div class="user-profile">
                        <a href="profile.html" class="profile-link" title="Profile">
                            <div class="avatar-circle">${initials}</div>
                        </a>
                        <span class="user-name">${name}</span>
                        <button class="logout-btn" id="logoutBtn" title="Logout">
                            <i class="fas fa-sign-out-alt"></i>
                        </button>
                    </div>
                </div>
            `;
            
            const logoutBtn = document.getElementById('logoutBtn');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.handleLogout();
                });
            }
        } else {
            authLinks.innerHTML = `
                <a href="login.html"><i class="fas fa-sign-in-alt"></i> Login</a>
                <a href="signup.html">Sign up</a>
            `;
        }
    }

    async handleLogout() {
        if (confirm('Are you sure you want to logout?')) {
            try {
                if (this.token) {
                    await fetch(`${this.apiUrl}/logout`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${this.token}`,
                            'Content-Type': 'application/json'
                        }
                    });
                }
            } catch (error) {
                console.error('Logout error:', error);
            } finally {
                localStorage.removeItem('noneapk_token');
                localStorage.removeItem('noneapk_user');
                
                this.token = null;
                this.user = null;
                this.isAuthenticated = false;
                
                this.updateNavigation();
                this.showToast('Logged out successfully', 'success');
            }
        }
    }

    showToast(message, type = 'info') {
        const existingToast = document.querySelector('.toast-notification');
        if (existingToast) existingToast.remove();
        
        const toast = document.createElement('div');
        toast.className = `toast-notification ${type}`;
        toast.innerHTML = `
            <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
            <span>${message}</span>
        `;
        toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 9999;
            animation: slideUp 0.3s ease;
            box-shadow: 0 4px 15px rgba(0,0,0,0.15);
            display: flex;
            align-items: center;
            gap: 10px;
            font-size: 14px;
            background: ${type === 'success' ? '#4caf50' : type === 'error' ? '#f44336' : '#2196f3'};
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transition = 'opacity 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    checkAuth() {
        return this.isAuthenticated;
    }

    getUser() {
        return this.user;
    }
}

// ============================================
// GLOBAL FUNCTIONS FOR APP CARDS (Exposed to window)
// ============================================

// Make functions globally accessible for onclick handlers
window.openAppByPackage = function(packageName) {
    if (packageName) {
        window.location.href = 'apk.html?package=' + encodeURIComponent(packageName);
    }
};

window.openApp = function(name, dev, icon, version, packageName, minSdk, compileSdk, androidVer, size, downloads, updated, shortDesc, longDesc) {
    const params = new URLSearchParams({
        name: name,
        dev: dev,
        icon: icon,
        version: version,
        package: packageName,
        minSdk: minSdk,
        compileSdk: compileSdk,
        androidVer: androidVer,
        size: size,
        downloads: downloads,
        updated: updated,
        shortDesc: shortDesc,
        longDesc: longDesc
    });
    window.location.href = 'apk.html?' + params.toString();
};

window.findAppByPackage = function(packageName) {
    if (window.allApps) {
        return window.allApps.find(app => app.Package === packageName);
    }
    return null;
};

// ============================================
// CATALOG FUNCTIONS
// ============================================

function loadCatalogAndRender() {
    const container = document.getElementById('appContainer');
    const loadingMsg = document.getElementById('loadingMessage');
    
    if (!container) return;
    
    const catalogFiles = ['file/catalog/catalog_1.json', 'file/catalog/catalog_2.json', 'file/catalog/catalog_3.json'];
    let allApps = [];
    
    function loadCatalogs() {
        const fetchPromises = catalogFiles.map(url =>
            fetch(url)
            .then(res => {
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                return res.json();
            })
            .catch(err => {
                console.warn('Failed to load', url, err);
                return null;
            })
        );
        
        Promise.all(fetchPromises).then(results => {
            const valid = results.filter(r => r && r.Apps && Array.isArray(r.Apps));
            if (valid.length === 0) {
                if (loadingMsg) {
                    loadingMsg.innerHTML = '⚠️ Could not load catalog data. Please check file paths.';
                }
                return;
            }
            const merged = [];
            valid.forEach(cat => cat.Apps.forEach(app => merged.push(app)));
            allApps = merged;
            
            window.allApps = allApps;
            
            if (loadingMsg) {
                loadingMsg.style.display = 'none';
            }
            renderSections(allApps);
        }).catch(err => {
            if (loadingMsg) {
                loadingMsg.innerHTML = '⚠️ Error loading catalogs.';
            }
            console.error(err);
        });
    }
    
    function shuffle(arr) {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }
    
    function sample(arr, n) {
        if (!arr || arr.length === 0) return [];
        const copy = [...arr];
        shuffle(copy);
        return copy.slice(0, Math.min(n, copy.length));
    }
    
    function buildCard(app) {
        const name = app.AppName || 'Unknown';
        const dev = app.PublisherId || 'Unknown';
        const rating = app.Rating ? parseFloat(app.Rating).toFixed(1) : '?';
        const icon = app.AppIcon || app.Thumbnail || '';
        const packageName = app.Package || '';
        
        return `
            <div class="app-card" onclick="window.openAppByPackage('${packageName}')">
                <div class="app-icon">${icon ? `<img src="${icon}" alt="" onerror="this.style.display='none'">` : `<i class="fas fa-cube"></i>`}</div>
                <div class="app-name">${name}</div>
                <div class="app-dev">${dev}</div>
                <span class="badge">⭐ ${rating}</span>
            </div>
        `;
    }
    
    function createSection(title, icon, appList, seeAllLink = '#') {
        if (!appList || appList.length === 0) return '';
        const cards = appList.map(app => buildCard(app)).join('');
        
        const typeMap = {
            'Latest': 'latest',
            'Trending': 'trending',
            'Top Games': 'top-games',
            'Top Apps': 'top-apps',
            'New Games Update': 'new-games',
            'New Apps Update': 'new-apps',
            'Hot Games': 'hot-games',
            'Hot Apps': 'hot-apps'
        };
        
        const type = typeMap[title] || 'latest';
        const seeAllLinkWithType = `list.html?type=${type}`;
        
        return `
            <section class="section">
                <div class="section-header">
                    <h2><i class="fas ${icon}"></i> ${title}</h2>
                    <a href="${seeAllLinkWithType}">More →</a>
                </div>
                <div class="app-scroll">${cards}</div>
            </section>
        `;
    }
    
    function renderSections(apps) {
        if (!apps || apps.length === 0) {
            container.innerHTML = `<div style="padding:2rem;text-align:center;color:#64748b;">No apps found in catalog.</div>`;
            return;
        }
        
        const games = apps.filter(a => {
            const cat = (a.CategoryName || '').toLowerCase();
            return cat.includes('game') || cat.includes('casino') || cat.includes('action') ||
                cat.includes('arcade') || cat.includes('puzzle') || cat.includes('racing') ||
                cat.includes('sports') || cat.includes('strategy');
        });
        const nonGames = apps.filter(a => !games.includes(a));
        
        const sortedByRating = [...apps].sort((a, b) => (parseFloat(b.Rating) || 0) - (parseFloat(a.Rating) || 0));
        const topRated = sortedByRating.slice(0, 30);
        
        const sections = [
            { title: 'Latest', icon: 'fa-clock', data: sample(apps, 12) },
            { title: 'Trending', icon: 'fa-fire', data: sample(topRated, 10) },
            { title: 'Top Games', icon: 'fa-gamepad', data: sample(games, 10) },
            { title: 'Top Apps', icon: 'fa-star', data: sample(nonGames, 10) },
            { title: 'New Games Update', icon: 'fa-sync-alt', data: sample(games, 8) },
            { title: 'New Apps Update', icon: 'fa-upload', data: sample(nonGames, 8) },
            { title: 'Hot Games', icon: 'fa-temperature-high', data: sample(games, 6) },
            { title: 'Hot Apps', icon: 'fa-bolt', data: sample(nonGames, 6) }
        ];
        
        let html = '';
        sections.forEach(section => {
            html += createSection(section.title, section.icon, section.data);
        });
        
        container.innerHTML = html;
    }
    
    loadCatalogs();
}

// ============================================
// MAIN INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    // Initialize authentication
    const auth = new NoneApkAuth();
    window.noneApkAuth = auth;

    // Mobile menu toggle
    const menuToggle = document.getElementById('menuToggle');
    const navLinks = document.getElementById('navLinks');
    
    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', function(e) {
            e.stopPropagation();
            navLinks.classList.toggle('active');
            const icon = this.querySelector('i');
            icon.className = navLinks.classList.contains('active') ? 'fas fa-times' : 'fas fa-bars';
        });
        
        document.addEventListener('click', function(e) {
            if (!e.target.closest('.navbar') && navLinks.classList.contains('active')) {
                navLinks.classList.remove('active');
                const icon = menuToggle.querySelector('i');
                if (icon) icon.className = 'fas fa-bars';
            }
        });
        
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', function() {
                if (window.innerWidth < 1024) {
                    navLinks.classList.remove('active');
                    const icon = menuToggle.querySelector('i');
                    if (icon) icon.className = 'fas fa-bars';
                }
            });
        });
        
        window.addEventListener('resize', function() {
            if (window.innerWidth >= 1024 && navLinks.classList.contains('active')) {
                navLinks.classList.remove('active');
                const icon = menuToggle.querySelector('i');
                if (icon) icon.className = 'fas fa-bars';
            }
        });
    }
    
    // Load catalog data
    loadCatalogAndRender();
    
    // Listen for storage changes
    window.addEventListener('storage', function(e) {
        if (e.key === 'noneapk_token' || e.key === 'noneapk_user') {
            const token = localStorage.getItem('noneapk_token');
            const user = JSON.parse(localStorage.getItem('noneapk_user') || 'null');
            
            if (window.noneApkAuth) {
                window.noneApkAuth.token = token;
                window.noneApkAuth.user = user;
                window.noneApkAuth.isAuthenticated = !!token && !!user;
                window.noneApkAuth.updateNavigation();
            }
        }
    });
});

// ============================================
// EXPOSE HELPER FUNCTIONS
// ============================================

window.isAuthenticated = function() {
    return !!localStorage.getItem('noneapk_token') && !!localStorage.getItem('noneapk_user');
};

window.getCurrentUser = function() {
    try {
        return JSON.parse(localStorage.getItem('noneapk_user') || 'null');
    } catch {
        return null;
    }
};

window.logoutUser = function() {
    localStorage.removeItem('noneapk_token');
    localStorage.removeItem('noneapk_user');
    if (window.noneApkAuth) {
        window.noneApkAuth.updateNavigation();
    }
    window.location.reload();
};
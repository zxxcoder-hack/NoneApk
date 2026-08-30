// js/config.js - Production Configuration for GitHub Pages
export const CONFIG = {
  // Your Cloudflare Worker URL (replace with your actual worker URL)
  API_URL: 'https://worker.noneapk.xyz',
  
  // Or if using a custom domain for your worker
  // API_URL: 'https://api.yourdomain.com',
  
  // GitHub Pages base URL (for redirects)
  BASE_URL: window.location.origin,
  
  // App name
  APP_NAME: 'NoneApk',
  
  // Environment
  ENV: 'production'
};
(function() {
  const overlayEl = () => document.getElementById('paymentOverlay');
  const detailsEl = () => document.getElementById('paymentDetails');
  
  function openOverlay(text) {
    const el = overlayEl();
    if (!el) return;
    el.hidden = false;
    detailsEl().textContent = text;
  }
  
  function closeOverlay() {
    const el = overlayEl();
    if (el) el.hidden = true;
  }
  
  async function startPayment({ appId, product }) {
    const cfg = await window.DataLoader.loadPayConfig();
    const pluginBase = cfg.pluginBaseUrl || window.APP_CONFIG.paykassmaPluginBase;
    const walletType = product.walletType || cfg.defaultWalletType || 'bkash_api';
    const currency = product.currency || cfg.defaultCurrency || window.APP_CONFIG.defaultCurrency;
    
    openOverlay(`Preparing ${product.name} (${currency} ${Number(product.price).toFixed(2)}) via ${walletType.replace(/_/g, ' ')}…`);
    
    const params = new URLSearchParams({
      label: appId,
      currency_code: currency,
      wallet_type: walletType,
      fixed_amount: Number(product.price).toFixed(2),
      custom_transaction_id: `txn_${Date.now()}_${product.id}`,
      lang: cfg.lang || window.APP_CONFIG.locale
    });
    
    const paymentUrl = pluginBase + '?' + params.toString();
    
    setTimeout(() => {
      detailsEl().innerHTML =
        `<span style="color:var(--success);">✓ Ready to redirect</span><br>` +
        `<span style="font-size:0.75rem;color:var(--text-muted);">(Demo — opening plugin in new tab)</span>`;
      window.open(paymentUrl, '_blank', 'noopener');
      setTimeout(closeOverlay, 2200);
    }, 1000);
  }
  
  window.Paykassma = { startPayment, closeOverlay };
})();
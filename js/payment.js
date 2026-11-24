(function () {
  const overlayEl = () => document.getElementById('paymentOverlay');
  const detailsEl = () => document.getElementById('paymentDetails');

  function openOverlay(text) {
    const el = overlayEl();
    if (!el) return;
    el.hidden = false;
    detailsEl().textContent = text || 'Payments are temporarily unavailable. Please try again later.';
  }

  function closeOverlay() {
    const el = overlayEl();
    if (el) el.hidden = true;
  }

  async function startPayment({ appId, product }) {
    // Placeholder — no gateway configured yet.
    // When you integrate a real provider, replace this body with the redirect/API call.
    openOverlay(
      `Checkout for "${product.name}" (${product.currency || window.APP_CONFIG.defaultCurrency} ${Number(product.price).toFixed(2)}) is not available yet. Please check back soon.`
    );
  }

  window.Payment = { startPayment, closeOverlay };
})();
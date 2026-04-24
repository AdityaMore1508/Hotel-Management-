/* ============================================================
   toast.js — Toast Notification System
   ============================================================ */
(function () {
  function getContainer() {
    let c = document.getElementById('toast-container');
    if (!c) {
      c = document.createElement('div');
      c.id = 'toast-container';
      document.body.appendChild(c);
    }
    return c;
  }

  window.showToast = function (title, message, type, duration) {
    message  = message  || '';
    type     = type     || 'info';
    duration = duration !== undefined ? duration : 3500;

    const icons = { success: '✓', error: '✕', warning: '⚠', info: 'ℹ' };
    const container = getContainer();
    const toast = document.createElement('div');
    toast.className = 'toast ' + type;
    toast.innerHTML =
      '<span class="toast-icon">' + (icons[type] || 'ℹ') + '</span>' +
      '<div class="toast-content">' +
        '<div class="toast-title">' + title + '</div>' +
        (message ? '<div class="toast-message">' + message + '</div>' : '') +
      '</div>';
    container.appendChild(toast);
    if (duration > 0) setTimeout(function () { dismiss(toast); }, duration);
    toast.addEventListener('click', function () { dismiss(toast); });
    return toast;
  };

  function dismiss(toast) {
    if (!toast.parentNode) return;
    toast.classList.add('removing');
    setTimeout(function () { if (toast.parentNode) toast.parentNode.removeChild(toast); }, 280);
  }

  window.toastSuccess = function (t, m) { return showToast(t, m, 'success'); };
  window.toastError   = function (t, m) { return showToast(t, m, 'error', 5000); };
  window.toastInfo    = function (t, m) { return showToast(t, m, 'info'); };
  window.toastWarning = function (t, m) { return showToast(t, m, 'warning', 4000); };
})();

/* ============================================================
   auth.js — Session, Guards, Navbar, API wrapper
   Reads API_BASE from js/config.js
   ============================================================ */

var API_BASE = (typeof CONFIG !== 'undefined' && CONFIG.API_BASE) ? CONFIG.API_BASE : '';

/* ── Session ───────────────────────────────────────────────── */
function getUser() {
  try { var u = localStorage.getItem('hms_user'); return u ? JSON.parse(u) : null; }
  catch (e) { return null; }
}
function setUser(user) { localStorage.setItem('hms_user', JSON.stringify(user)); }
function clearUser()   { localStorage.removeItem('hms_user'); }
function isAdmin()     { var u = getUser(); return u && u.role === 'admin'; }
function isLoggedIn()  { return getUser() !== null; }

/* ── Guards ────────────────────────────────────────────────── */
function requireAuth() {
  if (!isLoggedIn()) { window.location.href = 'login.html'; return false; }
  return true;
}
function requireAdmin() {
  if (!isLoggedIn()) { window.location.href = 'login.html'; return false; }
  if (!isAdmin()) {
    showToast('Access Denied', 'Admin privileges required.', 'error');
    setTimeout(function () { window.location.href = 'index.html'; }, 1500);
    return false;
  }
  return true;
}
function redirectIfLoggedIn() { if (isLoggedIn()) window.location.href = 'index.html'; }

/* ── Navbar ────────────────────────────────────────────────── */
function injectNavbar(activePage) {
  var user = getUser();
  if (!user) return;

  var adminLinks = isAdmin() ?
    '<a href="rooms.html"  class="nav-link ' + (activePage === 'rooms' ? 'active' : '') + '"><span class="nav-icon">🛏</span> Rooms</a>' +
    '<a href="add.html"    class="nav-link ' + (activePage === 'add'   ? 'active' : '') + '"><span class="nav-icon">➕</span> Add Room</a>'
    : '';

  var navHTML =
    '<nav class="navbar">' +
      '<a href="index.html" class="navbar-brand">' +
        '<div class="brand-icon">🏨</div>' +
        '<span>Grand<span class="accent">HMS</span></span>' +
      '</a>' +
      '<div class="nav-toggle" id="navToggle" onclick="toggleNav()">' +
        '<span></span><span></span><span></span>' +
      '</div>' +
      '<div class="navbar-links" id="navLinks">' +
        '<a href="index.html" class="nav-link ' + (activePage === 'dashboard' ? 'active' : '') + '"><span class="nav-icon">⊞</span> Dashboard</a>' +
        adminLinks +
      '</div>' +
      '<div class="navbar-right">' +
        '<div class="nav-user">' +
          '<div class="avatar">' + (user.name ? user.name[0].toUpperCase() : 'U') + '</div>' +
          '<span>' + (user.name || 'User') + '</span>' +
          (isAdmin() ? '<span class="text-gold" style="font-size:.7rem;margin-left:4px;">★ Admin</span>' : '') +
        '</div>' +
        '<button class="btn-logout" onclick="logout()"><span>⎋</span> Logout</button>' +
      '</div>' +
    '</nav>';

  document.body.insertAdjacentHTML('afterbegin', navHTML);
}

function toggleNav() {
  var nl = document.getElementById('navLinks');
  if (nl) nl.classList.toggle('open');
}

/* ── Logout ────────────────────────────────────────────────── */
function logout() {
  fetch(API_BASE + '/logout', { method: 'POST', credentials: 'include' })
    .catch(function () {})
    .finally(function () { clearUser(); window.location.href = 'login.html'; });
}

/* ── Loading overlay ───────────────────────────────────────── */
function showLoading(msg) {
  msg = msg || 'Loading...';
  var el = document.getElementById('loadingOverlay');
  if (!el) {
    el = document.createElement('div');
    el.id = 'loadingOverlay';
    el.className = 'loading-overlay';
    el.innerHTML = '<div class="spinner"></div><p class="loading-text">' + msg + '</p>';
    document.body.appendChild(el);
  }
  el.classList.add('active');
  el.querySelector('.loading-text').textContent = msg;
}
function hideLoading() {
  var el = document.getElementById('loadingOverlay');
  if (el) el.classList.remove('active');
}

/* ── Confirm dialog ────────────────────────────────────────── */
function showConfirm(title, message, onConfirm) {
  var overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML =
    '<div class="confirm-dialog">' +
      '<div class="confirm-icon">⚠️</div>' +
      '<div class="confirm-title">' + title + '</div>' +
      '<p class="confirm-message">' + message + '</p>' +
      '<div class="confirm-actions">' +
        '<button class="btn btn-secondary" id="confirmCancel">Cancel</button>' +
        '<button class="btn btn-danger"    id="confirmOk">Confirm</button>' +
      '</div>' +
    '</div>';
  document.body.appendChild(overlay);
  overlay.querySelector('#confirmCancel').onclick = function () { overlay.remove(); };
  overlay.querySelector('#confirmOk').onclick = function () { overlay.remove(); onConfirm(); };
  overlay.onclick = function (e) { if (e.target === overlay) overlay.remove(); };
}

/* ── API wrapper ───────────────────────────────────────────── */
function apiFetch(endpoint, options) {
  options = options || {};
  var defaults = { credentials: 'include', headers: { 'Content-Type': 'application/json' } };
  var merged = Object.assign({}, defaults, options);
  if (options.headers) merged.headers = Object.assign({}, defaults.headers, options.headers);
  return fetch(API_BASE + endpoint, merged).then(function (res) {
    if (res.status === 401) { clearUser(); window.location.href = 'login.html'; throw new Error('Unauthorized'); }
    return res;
  });
}

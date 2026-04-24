/* ============================================================
   dashboard.js — Dashboard: room cards, book, checkout, search
   ============================================================ */
var allRooms     = [];
var userBookings = [];

async function initDashboard() {
  if (!requireAuth()) return;
  injectNavbar('dashboard');
  renderSkeletons();
  await Promise.all([fetchRooms(), fetchUserBookings()]);
  renderStats();
  renderRooms(allRooms);
  populateTypeFilter();
  if (isAdmin()) document.getElementById('adminAddBtn').style.display = 'block';
}

function renderSkeletons() {
  var grid = document.getElementById('roomsGrid');
  var html = '';
  for (var i = 0; i < 6; i++) {
    html += '<div class="room-card" style="pointer-events:none;">' +
      '<div class="skeleton" style="height:200px;border-radius:0;"></div>' +
      '<div class="room-card-body">' +
        '<div class="skeleton" style="height:22px;width:60%;margin-bottom:12px;"></div>' +
        '<div class="skeleton" style="height:14px;width:40%;margin-bottom:8px;"></div>' +
        '<div class="skeleton" style="height:36px;border-radius:6px;margin-top:16px;"></div>' +
      '</div></div>';
  }
  grid.innerHTML = html;
}

async function fetchRooms() {
  try {
    var res  = await apiFetch('/api/rooms');
    var data = await res.json();
    allRooms = Array.isArray(data) ? data : (data.rooms || []);
  } catch (e) { toastError('Fetch Error', 'Could not load rooms.'); allRooms = []; }
}

async function fetchUserBookings() {
  try {
    var res = await apiFetch('/api/bookings/my');
    if (res.ok) {
      var data = await res.json();
      userBookings = (Array.isArray(data) ? data : (data.bookings || [])).map(function (b) { return b.room_id; });
    }
  } catch (e) { userBookings = []; }
}

function renderStats() {
  var total     = allRooms.length;
  var available = allRooms.filter(function (r) { return r.available; }).length;
  document.getElementById('statTotal').textContent     = total;
  document.getElementById('statAvailable').textContent = available;
  document.getElementById('statBooked').textContent    = total - available;
}

function renderRooms(rooms) {
  var grid = document.getElementById('roomsGrid');
  if (!rooms || rooms.length === 0) {
    grid.innerHTML = '<div class="empty-state" style="grid-column:1/-1;"><div class="empty-icon">🛏</div><h3>No Rooms Found</h3><p>Try adjusting your search or filters.</p></div>';
    return;
  }
  grid.innerHTML = rooms.map(function (room, i) { return buildRoomCard(room, i); }).join('');
}

function buildRoomCard(room, index) {
  var available    = Boolean(room.available);
  var isUserBooked = userBookings.indexOf(room.id) !== -1;

  var imgHTML = room.image
    ? '<img src="' + esc(room.image) + '" class="room-card-image" alt="Room" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\';" /><div class="room-card-image-placeholder" style="display:none;">🛏</div>'
    : '<div class="room-card-image-placeholder">🛏</div>';

  var actionBtns = '';
  if (available) {
    actionBtns = '<button class="btn btn-primary btn-sm" onclick="openBookingModal(' + room.id + ',\'' + esc(room.room_number) + '\')">📅 Book Room</button>';
  } else if (isUserBooked) {
    actionBtns = '<button class="btn btn-success btn-sm" onclick="checkoutRoom(' + room.id + ')">✓ Checkout</button>';
  } else {
    actionBtns = '<button class="btn btn-secondary btn-sm" disabled>Unavailable</button>';
  }

  var adminBtns = isAdmin()
    ? '<a href="add.html?id=' + room.id + '" class="btn btn-outline btn-sm">✏️</a>' +
      '<button class="btn btn-danger btn-sm" onclick="deleteRoom(' + room.id + ')">🗑</button>'
    : '';

  return '<div class="room-card" style="animation-delay:' + (index * 0.06) + 's;">' +
    imgHTML +
    '<div class="room-card-body">' +
      '<div class="room-card-header">' +
        '<div class="room-number"><span>#</span>' + esc(room.room_number) + '</div>' +
        '<span class="availability-badge ' + (available ? 'badge-available' : 'badge-booked') + '">' + (available ? '✓ Available' : '✕ Booked') + '</span>' +
      '</div>' +
      '<div class="room-type">' + esc(room.type) + '</div>' +
      (room.description ? '<p class="room-description">' + esc(room.description) + '</p>' : '') +
      '<div class="room-price"><span class="price-amount">₹' + Number(room.price).toLocaleString('en-IN') + '</span><span class="price-label">/ night</span></div>' +
      '<div class="room-card-actions">' + actionBtns + adminBtns + '</div>' +
    '</div></div>';
}

/* ── Filter ─────────────────────────────────────────────────── */
function filterRooms() {
  var s = document.getElementById('searchInput').value.toLowerCase().trim();
  var t = document.getElementById('filterType').value;
  var a = document.getElementById('filterAvail').value;
  var filtered = allRooms.filter(function (r) {
    var ms = !s || r.room_number.toLowerCase().includes(s) || r.type.toLowerCase().includes(s);
    var mt = !t || r.type.toLowerCase() === t.toLowerCase();
    var ma = a === '' ? true : a === 'available' ? Boolean(r.available) : !Boolean(r.available);
    return ms && mt && ma;
  });
  renderRooms(filtered);
}

function resetFilters() {
  document.getElementById('searchInput').value = '';
  document.getElementById('filterType').value  = '';
  document.getElementById('filterAvail').value = '';
  renderRooms(allRooms);
}

function populateTypeFilter() {
  var types  = [...new Set(allRooms.map(function (r) { return r.type; }))].sort();
  var select = document.getElementById('filterType');
  types.forEach(function (t) {
    var opt = document.createElement('option');
    opt.value = t; opt.textContent = t;
    select.appendChild(opt);
  });
}

/* ── Booking Modal ──────────────────────────────────────────── */
function openBookingModal(roomId, roomNumber) {
  var today    = new Date().toISOString().split('T')[0];
  var tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  var overlay  = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'bookingModal';
  overlay.innerHTML =
    '<div class="modal">' +
      '<div class="modal-header">' +
        '<h2 class="modal-title">Book Room #' + esc(roomNumber) + '</h2>' +
        '<button class="modal-close" onclick="document.getElementById(\'bookingModal\').remove()">✕</button>' +
      '</div>' +
      '<div class="modal-body">' +
        '<div class="form-group"><label class="form-label">Check-In Date</label>' +
        '<input type="date" id="checkIn" class="form-control" value="' + today + '" min="' + today + '" /></div>' +
        '<div class="form-group"><label class="form-label">Check-Out Date</label>' +
        '<input type="date" id="checkOut" class="form-control" value="' + tomorrow + '" min="' + tomorrow + '" /></div>' +
      '</div>' +
      '<div class="modal-footer">' +
        '<button class="btn btn-secondary" onclick="document.getElementById(\'bookingModal\').remove()">Cancel</button>' +
        '<button class="btn btn-primary" id="confirmBookBtn" onclick="confirmBooking(' + roomId + ')">📅 Confirm Booking</button>' +
      '</div>' +
    '</div>';
  document.body.appendChild(overlay);
  overlay.addEventListener('click', function (e) { if (e.target === overlay) overlay.remove(); });
}

async function confirmBooking(roomId) {
  var checkIn  = document.getElementById('checkIn').value;
  var checkOut = document.getElementById('checkOut').value;
  if (!checkIn) { toastError('Validation', 'Please select a check-in date.'); return; }
  var btn = document.getElementById('confirmBookBtn');
  btn.disabled = true; btn.textContent = 'Booking…';
  try {
    var res  = await apiFetch('/api/book/' + roomId, { method: 'PUT', body: JSON.stringify({ check_in_date: checkIn, check_out_date: checkOut || null }) });
    var data = await res.json();
    if (!res.ok) { toastError('Booking Failed', data.message || 'Could not complete booking.'); }
    else {
      document.getElementById('bookingModal').remove();
      toastSuccess('Booking Confirmed!', 'Check-in: ' + checkIn);
      var room = allRooms.find(function (r) { return r.id === roomId; });
      if (room) room.available = false;
      userBookings.push(roomId);
      renderStats(); filterRooms();
    }
  } catch (e) { toastError('Error', 'Booking request failed.'); }
  finally { if (document.getElementById('confirmBookBtn')) { btn.disabled = false; btn.textContent = '📅 Confirm Booking'; } }
}

/* ── Checkout ───────────────────────────────────────────────── */
async function checkoutRoom(roomId) {
  showConfirm('Checkout Room', 'Confirm checkout from this room?', async function () {
    try {
      var res  = await apiFetch('/api/checkout/' + roomId, { method: 'PUT' });
      var data = await res.json();
      if (!res.ok) { toastError('Checkout Failed', data.message || 'Could not checkout.'); }
      else {
        toastSuccess('Checked Out', 'Room is now available.');
        var room = allRooms.find(function (r) { return r.id === roomId; });
        if (room) room.available = true;
        userBookings = userBookings.filter(function (id) { return id !== roomId; });
        renderStats(); filterRooms();
      }
    } catch (e) { toastError('Error', 'Checkout failed.'); }
  });
}

/* ── Admin Delete ───────────────────────────────────────────── */
async function deleteRoom(roomId) {
  showConfirm('Delete Room', 'This cannot be undone. Delete this room?', async function () {
    try {
      var res = await apiFetch('/api/rooms/' + roomId, { method: 'DELETE' });
      if (!res.ok) { var d = await res.json(); toastError('Delete Failed', d.message || 'Could not delete.'); }
      else {
        toastSuccess('Room Deleted', 'Room removed successfully.');
        allRooms = allRooms.filter(function (r) { return r.id !== roomId; });
        renderStats(); filterRooms();
      }
    } catch (e) { toastError('Error', 'Delete failed.'); }
  });
}

function esc(str) {
  if (str == null) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

window.addEventListener('DOMContentLoaded', async function () {
  await initDashboard();
  document.getElementById('searchInput').addEventListener('input', filterRooms);
  document.getElementById('filterType').addEventListener('change', filterRooms);
  document.getElementById('filterAvail').addEventListener('change', filterRooms);
});

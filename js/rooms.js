/* ============================================================
   rooms.js — Admin Rooms Management Table
   ============================================================ */
var allRooms = [];

async function initRooms() {
  if (!requireAdmin()) return;
  injectNavbar('rooms');
  await fetchRooms();
  renderTable(allRooms);
  populateTypeFilter();
}

async function fetchRooms() {
  try {
    var res  = await apiFetch('/api/rooms');
    var data = await res.json();
    allRooms = Array.isArray(data) ? data : (data.rooms || []);
  } catch (e) { toastError('Fetch Error', 'Could not load rooms.'); allRooms = []; }
}

function renderTable(rooms) {
  var tbody   = document.getElementById('roomsTableBody');
  var countEl = document.getElementById('roomCount');
  if (countEl) countEl.textContent = rooms.length;
  if (!rooms.length) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:3rem;color:var(--text-muted);"><div style="font-size:2rem;margin-bottom:.5rem;">🛏</div>No rooms found. <a href="add.html" class="text-gold">Add one?</a></td></tr>';
    return;
  }
  tbody.innerHTML = rooms.map(function (r) { return buildRow(r); }).join('');
}

function buildRow(room) {
  var avail   = Boolean(room.available);
  var imgCell = room.image
    ? '<img src="' + esc(room.image) + '" class="td-room-img" alt="" onerror="this.style.display=\'none\';" />'
    : '<span style="font-size:1.5rem;">🛏</span>';
  return '<tr data-id="' + room.id + '">' +
    '<td>' + imgCell + '</td>' +
    '<td><strong>#' + esc(room.room_number) + '</strong></td>' +
    '<td>' + esc(room.type) + '</td>' +
    '<td style="max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + esc(room.description || '—') + '</td>' +
    '<td>₹' + Number(room.price).toLocaleString('en-IN') + '</td>' +
    '<td><span class="availability-badge ' + (avail ? 'badge-available' : 'badge-booked') + '">' + (avail ? '✓ Available' : '✕ Booked') + '</span></td>' +
    '<td><div class="td-actions">' +
      '<a href="add.html?id=' + room.id + '" class="btn btn-outline btn-sm">✏️ Edit</a>' +
      '<button class="btn btn-danger btn-sm" onclick="deleteRoom(' + room.id + ')">🗑 Delete</button>' +
    '</div></td>' +
  '</tr>';
}

function filterTable() {
  var s = document.getElementById('tableSearch').value.toLowerCase().trim();
  var t = document.getElementById('tableTypeFilter').value;
  var a = document.getElementById('tableAvailFilter').value;
  var f = allRooms.filter(function (r) {
    var ms = !s || r.room_number.toLowerCase().includes(s) || r.type.toLowerCase().includes(s);
    var mt = !t || r.type.toLowerCase() === t.toLowerCase();
    var ma = a === '' ? true : a === 'available' ? Boolean(r.available) : !Boolean(r.available);
    return ms && mt && ma;
  });
  renderTable(f);
}

function resetTableFilters() {
  document.getElementById('tableSearch').value      = '';
  document.getElementById('tableTypeFilter').value  = '';
  document.getElementById('tableAvailFilter').value = '';
  renderTable(allRooms);
}

async function deleteRoom(roomId) {
  showConfirm('Delete Room', 'This cannot be undone. Delete this room?', async function () {
    try {
      var res = await apiFetch('/api/rooms/' + roomId, { method: 'DELETE' });
      if (!res.ok) { var d = await res.json(); toastError('Delete Failed', d.message || 'Could not delete.'); }
      else {
        toastSuccess('Room Deleted', 'Room removed successfully.');
        allRooms = allRooms.filter(function (r) { return r.id !== roomId; });
        filterTable(); populateTypeFilter();
      }
    } catch (e) { toastError('Error', 'Delete failed.'); }
  });
}

function populateTypeFilter() {
  var types  = [...new Set(allRooms.map(function (r) { return r.type; }))].sort();
  var select = document.getElementById('tableTypeFilter');
  select.innerHTML = '<option value="">All Types</option>';
  types.forEach(function (t) { var o = document.createElement('option'); o.value = t; o.textContent = t; select.appendChild(o); });
}

function esc(str) {
  if (str == null) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

window.addEventListener('DOMContentLoaded', async function () {
  await initRooms();
  document.getElementById('tableSearch').addEventListener('input', filterTable);
  document.getElementById('tableTypeFilter').addEventListener('change', filterTable);
  document.getElementById('tableAvailFilter').addEventListener('change', filterTable);
});

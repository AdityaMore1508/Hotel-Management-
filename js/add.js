/* ============================================================
   add.js — Add & Edit Room
   ============================================================ */
var urlParams = new URLSearchParams(window.location.search);
var editId    = urlParams.get('id');
var isEdit    = !!editId;

async function initAddRoom() {
  if (!requireAdmin()) return;
  injectNavbar(isEdit ? 'rooms' : 'add');
  document.getElementById('formTitle').textContent = isEdit ? '✏️ Edit Room' : '➕ Add Room';
  document.title = (isEdit ? 'Edit' : 'Add') + ' Room — Grand HMS';
  document.getElementById('submitBtnText').textContent = isEdit ? 'Save Changes' : 'Add Room';
  if (isEdit) await loadRoomData();
}

async function loadRoomData() {
  showLoading('Loading room data…');
  try {
    var res = await apiFetch('/api/rooms/' + editId);
    if (!res.ok) { toastError('Not Found', 'Room not found.'); setTimeout(function () { window.location.href = 'rooms.html'; }, 1500); return; }
    var room = await res.json();
    document.getElementById('roomNumber').value      = room.room_number  || '';
    document.getElementById('roomType').value        = room.type         || '';
    document.getElementById('roomDescription').value = room.description  || '';
    document.getElementById('roomPrice').value       = room.price        || '';
    document.getElementById('roomImage').value       = room.image        || '';
    document.getElementById('roomAvailable').value   = room.available ? '1' : '0';
    if (room.image) updateImagePreview(room.image);
  } catch (e) { toastError('Error', 'Could not load room data.'); }
  finally { hideLoading(); }
}

function updateImagePreview(url) {
  var preview     = document.getElementById('imagePreview');
  var placeholder = document.getElementById('imagePlaceholder');
  if (!url) { preview.style.display = 'none'; placeholder.style.display = 'flex'; return; }
  preview.src = url;
  preview.style.display = 'block';
  placeholder.style.display = 'none';
  preview.onerror = function () { preview.style.display = 'none'; placeholder.style.display = 'flex'; };
}

async function handleSubmit(e) {
  e.preventDefault();
  document.querySelectorAll('.form-error').forEach(function (el) { el.classList.remove('visible'); });

  var roomNumber  = document.getElementById('roomNumber').value.trim();
  var roomType    = document.getElementById('roomType').value.trim();
  var description = document.getElementById('roomDescription').value.trim();
  var price       = document.getElementById('roomPrice').value.trim();
  var image       = document.getElementById('roomImage').value.trim();
  var available   = document.getElementById('roomAvailable').value;

  var valid = true;
  if (!roomNumber) { document.getElementById('roomNumberErr').classList.add('visible'); valid = false; }
  if (!roomType)   { document.getElementById('roomTypeErr').classList.add('visible');   valid = false; }
  if (!price || isNaN(price) || Number(price) < 0) { document.getElementById('roomPriceErr').classList.add('visible'); valid = false; }
  if (!valid) return;

  var payload = { room_number: roomNumber, type: roomType, description: description, price: parseFloat(price), image: image || null, available: available === '1' };

  var submitBtn = document.getElementById('submitBtn');
  var btnText   = document.getElementById('submitBtnText');
  submitBtn.disabled = true;
  btnText.textContent = isEdit ? 'Saving…' : 'Adding…';

  try {
    var res = isEdit
      ? await apiFetch('/api/rooms/' + editId, { method: 'PUT',  body: JSON.stringify(payload) })
      : await apiFetch('/api/rooms',             { method: 'POST', body: JSON.stringify(payload) });
    var data = await res.json();
    if (!res.ok) { toastError(isEdit ? 'Update Failed' : 'Add Failed', data.message || 'Operation failed.'); }
    else {
      toastSuccess(isEdit ? 'Room Updated!' : 'Room Added!', 'Room #' + roomNumber + (isEdit ? ' updated.' : ' added.'));
      setTimeout(function () { window.location.href = 'rooms.html'; }, 900);
    }
  } catch (e) { toastError('Error', 'Request failed.'); }
  finally { submitBtn.disabled = false; btnText.textContent = isEdit ? 'Save Changes' : 'Add Room'; }
}

window.addEventListener('DOMContentLoaded', function () {
  initAddRoom();
  document.getElementById('addRoomForm').addEventListener('submit', handleSubmit);
  document.getElementById('roomImage').addEventListener('input', function (e) { updateImagePreview(e.target.value.trim()); });
});

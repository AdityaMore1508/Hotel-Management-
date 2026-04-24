# 🏨 Grand HMS — Hotel Management System Frontend

## ⚡ Setup in 3 Steps

### Step 1 — Set your backend URL
Open `js/config.js` and change the `API_BASE` to your backend URL:

```js
const CONFIG = {
  API_BASE: 'http://localhost:3000',  // your backend address
};
```

### Step 2 — Run your Node.js backend
Make sure your Express + MySQL backend is running.

### Step 3 — Open the app
Open `login.html` in your browser or visit your GitHub Pages URL.

---

## 📁 File Structure
```
├── index.html       ← Dashboard
├── login.html       ← Login page
├── register.html    ← Register page
├── rooms.html       ← Admin: rooms table
├── add.html         ← Admin: add/edit room
├── css/
│   └── style.css    ← All styles
├── js/
│   ├── config.js    ← ⭐ EDIT THIS — set your API URL
│   ├── auth.js      ← Session & guards
│   ├── toast.js     ← Notifications
│   ├── dashboard.js ← Dashboard logic
│   ├── rooms.js     ← Rooms table logic
│   └── add.js       ← Add/Edit room logic
└── images/          ← Optional static images
```

## 🔌 Required Backend API Routes
| Method | Route | Description |
|--------|-------|-------------|
| POST | /login | Login |
| POST | /register | Register |
| POST | /logout | Logout |
| GET | /api/rooms | Get all rooms |
| GET | /api/rooms/:id | Get single room |
| POST | /api/rooms | Add room |
| PUT | /api/rooms/:id | Update room |
| DELETE | /api/rooms/:id | Delete room |
| PUT | /api/book/:id | Book a room |
| PUT | /api/checkout/:id | Checkout |

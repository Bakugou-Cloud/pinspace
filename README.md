# 📌 PinSpace — Pinterest Clone

A full-featured Pinterest-like social image sharing platform.

## 🚀 Features
- 👤 User registration & login (JWT auth)
- 📌 Upload pins with title, description, tags, category
- 🏠 Masonry feed (like Pinterest)
- ❤️ Like / unlike pins
- 💬 Comments with real-time updates
- 💾 Save pins to your collection
- 👥 Follow / unfollow users
- 🔍 Search by title, tag, category
- 🔗 Shareable link for every pin
- 🔔 Real-time notifications (Socket.IO)
- 📱 Fully responsive (mobile friendly)
- 🛡️ Admin panel — manage users & pins

## 🛠️ Tech Stack
- **Backend:** Node.js + Express.js
- **Database:** MongoDB + Mongoose
- **Auth:** JWT (JSON Web Tokens)
- **Images:** Cloudinary
- **Real-time:** Socket.IO
- **Frontend:** HTML + CSS + Vanilla JS

## ⚙️ Setup

### 1. Install
```bash
npm install
```

### 2. Configure .env
```bash
cp .env.example .env
```
Fill in your credentials:
```
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/pinspace
CLOUDINARY_CLOUD_NAME=your_name
CLOUDINARY_API_KEY=your_key
CLOUDINARY_API_SECRET=your_secret
JWT_SECRET=some_long_random_string
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
PORT=3000
```

### 3. Run
```bash
npm run dev
```

Open: http://localhost:3000

## 📄 Pages
| URL | Description |
|---|---|
| `/` | Main feed (Pinterest-like) |
| `/pin/:id` | Pin detail with comments |
| `/profile/:username` | User profile page |
| `/admin` | Admin panel (owner only) |

## 🔌 API Reference
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | ❌ | Register |
| POST | `/api/auth/login` | ❌ | Login |
| GET | `/api/auth/me` | ✅ | My profile |
| PUT | `/api/auth/profile` | ✅ | Update profile |
| POST | `/api/auth/avatar` | ✅ | Upload avatar |
| GET | `/api/auth/user/:username` | ❌ | Get user |
| POST | `/api/auth/follow/:id` | ✅ | Follow/unfollow |
| GET | `/api/pins` | ❌ | Get all pins |
| POST | `/api/pins` | ✅ | Create pin |
| GET | `/api/pins/:id` | ❌ | Get pin |
| DELETE | `/api/pins/:id` | ✅ | Delete pin |
| POST | `/api/pins/:id/like` | ✅ | Like/unlike |
| POST | `/api/pins/:id/save` | ✅ | Save/unsave |
| POST | `/api/pins/:id/comment` | ✅ | Add comment |
| DELETE | `/api/pins/:id/comment/:cid` | ✅ | Delete comment |
| POST | `/api/pins/:id/report` | ✅ | Report pin |
| POST | `/api/admin/login` | ❌ | Admin login |
| GET | `/api/admin/stats` | 🛡️ | Dashboard stats |
| GET | `/api/admin/pins` | 🛡️ | All pins |
| DELETE | `/api/admin/pins/:id` | 🛡️ | Delete pin |
| GET | `/api/admin/users` | 🛡️ | All users |
| POST | `/api/admin/users/:id/ban` | 🛡️ | Ban/unban user |
| DELETE | `/api/admin/users/:id` | 🛡️ | Delete user |

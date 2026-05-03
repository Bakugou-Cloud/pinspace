# PinSpace — A Pinterest-Inspired Social Media Platform

## About This Project

PinSpace is a full-stack social media web application built as part of our **Cloud Computing** course final project at **K K Modi University**. The idea behind this project was to build something that actually works in the real world — so we took inspiration from Pinterest and built our own version of it from scratch.

The app lets anyone sign up, upload images, like and comment on other people's posts, follow users, and discover content through a clean Pinterest-style masonry feed. We also built a complete admin panel so the owner of the platform can manage users, delete inappropriate content, and handle reports.

This project was built under the guidance of **Dr. Shuchi Sethi** (Cloud Computing Faculty) as our final presentation submission.

---

## Team Members

| Name | Year | Role |
|---|---|---|
| Ronit Yadav | 2nd Year | Frontend Development, UI/UX, Database, Admin Panel |
| Priyanshu Yadav | 2nd Year | API Integration, Testing, Marketing |
| Sejal Sahu | 3rd Year | Backend Development, Cloud Storage, Marketing |

---

## What This App Can Do

When you open PinSpace you get a Pinterest-style homepage showing all uploaded images in a beautiful masonry grid layout. Here is everything the app supports:

**For Users:**
- Create an account and log in securely
- Upload images with a title, description, tags and category
- Browse through all posts in the feed
- Filter posts by category like Art, Travel, Food, Technology etc.
- Search for anything by title, tag or description
- Like and unlike any post
- Comment on posts in real time
- Save posts to your personal collection
- Follow and unfollow other users
- Get real time notifications when someone likes or comments on your post
- Share any post using a direct link
- Edit your profile, bio and upload a profile photo
- Report posts that violate community guidelines

**For Admin:**
- Separate admin login panel
- Dashboard showing total users, pins, reported content
- Delete any post from the platform
- View and handle reported posts
- Ban or unban any user account
- Delete any user account along with all their content

---

## Technologies We Used

We used the following technologies to build this project:

- **Node.js and Express.js** — for building the backend server and REST APIs
- **MongoDB with Mongoose** — as our cloud database to store all user and post data
- **Cloudinary** — cloud storage service for storing all uploaded images
- **Socket.IO** — for real time features like live comments and notifications
- **JWT (JSON Web Tokens)** — for secure user authentication and sessions
- **HTML, CSS and Vanilla JavaScript** — for building the entire frontend

---

## How to Run This Project Locally

### What You Need First
- Node.js installed on your computer
- MongoDB installed locally or a MongoDB Atlas account
- A free Cloudinary account for image storage

### Step 1 — Install Dependencies
```bash
npm install
```

### Step 2 — Set Up Environment Variables
Create a `.env` file in the root folder and add:
```
MONGODB_URI=mongodb://localhost:27017/pinspace
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
JWT_SECRET=any_long_random_string
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
PORT=3000
```

### Step 3 — Start the App
```bash
npm run dev
```

### Step 4 — Open in Browser
```
http://localhost:3000
```

Admin Panel:
```
http://localhost:3000/admin
```

---

## Project Structure

```
pinspace/
├── server.js              → Main entry point
├── config/
│   └── cloudinary.js      → Cloudinary configuration
├── middleware/
│   └── auth.js            → JWT authentication middleware
├── models/
│   ├── User.js            → User database schema
│   └── Pin.js             → Post and comment schema
├── routes/
│   ├── auth.js            → Login, register, profile, follow
│   ├── pins.js            → Upload, like, comment, report
│   └── admin.js           → Admin controls
├── public/
│   ├── index.html         → Main feed page
│   ├── pin.html           → Single post page
│   ├── profile.html       → User profile page
│   └── admin.html         → Admin dashboard
└── .env.example           → Environment variables template
```

---

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|---|---|---|---|
| POST | `/api/auth/register` | Create new account |
| POST | `/api/auth/login` | Login to account |
| GET | `/api/auth/me` | Get my profile |
| PUT | `/api/auth/profile` | Update profile |
| POST | `/api/auth/avatar` | Upload profile photo |
| GET | `/api/auth/user/:username` | View any user profile |
| POST | `/api/auth/follow/:id` | Follow or unfollow a user |

### Posts (Pins)
| Method | Endpoint | Description |
|---|---|---|---|
| GET | `/api/pins` | Get all posts |
| POST | `/api/pins` | Upload new post |
| GET | `/api/pins/:id` | Get single post |
| DELETE | `/api/pins/:id` | Delete your post |
| POST | `/api/pins/:id/like` | Like or unlike |
| POST | `/api/pins/:id/save` | Save or unsave |
| POST | `/api/pins/:id/comment` | Add a comment |
| POST | `/api/pins/:id/report` | Report a post |

### Admin
| Method | Endpoint | Description |
|---|---|---|---|
| POST | `/api/admin/login` | Admin login |
| GET | `/api/admin/stats` | Dashboard statistics |
| GET | `/api/admin/pins` | View all posts |
| DELETE | `/api/admin/pins/:id` | Delete any post |
| GET | `/api/admin/users` | View all users |
| POST | `/api/admin/users/:id/ban` | Ban or unban a user |
| DELETE | `/api/admin/users/:id` | Delete a user |

---

## Subject Details

- **Subject:** Cloud Computing
- **Faculty:** Dr. Shuchi Sethi
- **University:** K K Modi University
- **Year:** 2nd & 3rd Year (Mixed Batch)
- **Purpose:** Final Project Presentation

---

*Built with ❤️ by Ronit Yadav, Priyanshu Yadav and Sejal Sahu*

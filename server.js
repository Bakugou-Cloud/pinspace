require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const path = require("path");
const cors = require("cors");

const authRoutes = require("./routes/auth");
const pinRoutes = require("./routes/pins");
const adminRoutes = require("./routes/admin");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// ── MIDDLEWARE ────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

app.set("io", io);

// ── ROUTES ────────────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/pins", pinRoutes);
app.use("/api/admin", adminRoutes);

// Serve pages
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));
app.get("/pin/:id", (req, res) => res.sendFile(path.join(__dirname, "public", "pin.html")));
app.get("/profile/:username", (req, res) => res.sendFile(path.join(__dirname, "public", "profile.html")));
app.get("/admin", (req, res) => res.sendFile(path.join(__dirname, "public", "admin.html")));

// ── SOCKET.IO ─────────────────────────────────────────────────────────────────
io.on("connection", (socket) => {
  console.log(`🔌 Connected: ${socket.id}`);

  // Join personal room for notifications
  socket.on("join", (userId) => {
    if (userId) socket.join(userId);
  });

  socket.on("disconnect", () => console.log(`❌ Disconnected: ${socket.id}`));
});

// ── MONGODB ───────────────────────────────────────────────────────────────────
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/pinspace";

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log("✅ MongoDB connected");
    const PORT = process.env.PORT || 3000;
    server.listen(PORT, () => console.log(`🚀 PinSpace running at http://localhost:${PORT}`));
  })
  .catch(err => { console.error("❌ MongoDB failed:", err.message); process.exit(1); });

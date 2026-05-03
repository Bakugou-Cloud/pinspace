const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Pin = require("../models/Pin");
const { cloudinary } = require("../config/cloudinary");

// Admin login (separate from user login)
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

    if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
      return res.status(401).json({ success: false, message: "Wrong admin credentials" });
    }

    // Find or create admin user
    let adminUser = await User.findOne({ username: ADMIN_USERNAME });
    if (!adminUser) {
      adminUser = await User.create({
        username: ADMIN_USERNAME, email: `${ADMIN_USERNAME}@pinspace.admin`,
        password: ADMIN_PASSWORD, displayName: "Admin", isAdmin: true
      });
    } else if (!adminUser.isAdmin) {
      adminUser.isAdmin = true;
      await adminUser.save();
    }

    const token = jwt.sign({ id: adminUser._id }, process.env.JWT_SECRET || "secret", { expiresIn: "1d" });
    res.json({ success: true, token });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Middleware: verify admin token
const adminAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ success: false, message: "Unauthorized" });
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret");
    const user = await User.findById(decoded.id);
    if (!user?.isAdmin) return res.status(403).json({ success: false, message: "Admin only" });
    req.user = user;
    next();
  } catch {
    res.status(401).json({ success: false, message: "Invalid token" });
  }
};

// DASHBOARD STATS
router.get("/stats", adminAuth, async (req, res) => {
  try {
    const [totalUsers, totalPins, reportedPins, bannedUsers] = await Promise.all([
      User.countDocuments({ isAdmin: false }),
      Pin.countDocuments({ isDeleted: false }),
      Pin.countDocuments({ isReported: true, isDeleted: false }),
      User.countDocuments({ isBanned: true }),
    ]);
    const recentUsers = await User.find({ isAdmin: false }).sort({ createdAt: -1 }).limit(5).select("username displayName avatar createdAt");
    const recentPins = await Pin.find({ isDeleted: false }).sort({ createdAt: -1 }).limit(5).populate("author", "username");
    res.json({ success: true, stats: { totalUsers, totalPins, reportedPins, bannedUsers }, recentUsers, recentPins });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET ALL USERS
router.get("/users", adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const filter = { isAdmin: false };
    if (search) filter.$or = [{ username: new RegExp(search, "i") }, { email: new RegExp(search, "i") }];
    const users = await User.find(filter).select("-password").sort({ createdAt: -1 })
      .skip((page - 1) * limit).limit(Number(limit));
    const total = await User.countDocuments(filter);
    res.json({ success: true, users, total });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// BAN / UNBAN USER
router.post("/users/:id/ban", adminAuth, async (req, res) => {
  try {
    const { reason } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    if (user.isAdmin) return res.status(400).json({ success: false, message: "Cannot ban admin" });
    user.isBanned = !user.isBanned;
    user.banReason = user.isBanned ? (reason || "Violated community guidelines") : "";
    await user.save();
    res.json({ success: true, banned: user.isBanned, message: user.isBanned ? "User banned" : "User unbanned" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE USER
router.delete("/users/:id", adminAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    // Delete all their pins from Cloudinary
    const pins = await Pin.find({ author: req.params.id });
    for (const pin of pins) { try { await cloudinary.uploader.destroy(pin.publicId); } catch {} }
    await Pin.deleteMany({ author: req.params.id });
    await user.deleteOne();
    res.json({ success: true, message: "User and all their pins deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET ALL PINS
router.get("/pins", adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20, reported } = req.query;
    const filter = { isDeleted: false };
    if (reported === "true") filter.isReported = true;
    const pins = await Pin.find(filter).populate("author", "username displayName")
      .sort({ createdAt: -1 }).skip((page - 1) * limit).limit(Number(limit));
    const total = await Pin.countDocuments(filter);
    res.json({ success: true, pins, total });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE PIN (Admin)
router.delete("/pins/:id", adminAuth, async (req, res) => {
  try {
    const pin = await Pin.findById(req.params.id);
    if (!pin) return res.status(404).json({ success: false, message: "Pin not found" });
    await cloudinary.uploader.destroy(pin.publicId);
    pin.isDeleted = true;
    await pin.save();
    req.app.get("io").emit("pinDeleted", req.params.id);
    res.json({ success: true, message: "Pin deleted by admin" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DISMISS REPORT
router.post("/pins/:id/dismiss-report", adminAuth, async (req, res) => {
  try {
    await Pin.findByIdAndUpdate(req.params.id, { isReported: false, reports: [] });
    res.json({ success: true, message: "Report dismissed" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;

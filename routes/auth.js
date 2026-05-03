const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { auth } = require("../middleware/auth");
const { cloudinary, avatarStorage } = require("../config/cloudinary");
const multer = require("multer");

const uploadAvatar = multer({ storage: avatarStorage, limits: { fileSize: 5 * 1024 * 1024 } });

const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET || "secret", { expiresIn: "30d" });

// REGISTER
router.post("/register", async (req, res) => {
  try {
    const { username, email, password, displayName } = req.body;
    if (!username || !email || !password) return res.status(400).json({ success: false, message: "All fields are required." });

    const exists = await User.findOne({ $or: [{ email }, { username }] });
    if (exists) return res.status(400).json({ success: false, message: exists.email === email ? "Email already registered." : "Username already taken." });

    const user = await User.create({ username, email, password, displayName: displayName || username });
    const token = signToken(user._id);

    res.status(201).json({ success: true, token, user: { _id: user._id, username: user.username, displayName: user.displayName, avatar: user.avatar, isAdmin: user.isAdmin } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// LOGIN
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: "Email and password required." });

    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) return res.status(401).json({ success: false, message: "Wrong email or password." });
    if (user.isBanned) return res.status(403).json({ success: false, message: `Account banned. Reason: ${user.banReason}` });

    const token = signToken(user._id);
    res.json({ success: true, token, user: { _id: user._id, username: user.username, displayName: user.displayName, avatar: user.avatar, isAdmin: user.isAdmin } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET MY PROFILE
router.get("/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password").populate("savedPins", "imageUrl title");
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// UPDATE PROFILE
router.put("/profile", auth, async (req, res) => {
  try {
    const { displayName, bio } = req.body;
    const user = await User.findByIdAndUpdate(req.user._id, { displayName, bio }, { new: true }).select("-password");
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// UPLOAD AVATAR
router.post("/avatar", auth, uploadAvatar.single("avatar"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: "No file uploaded" });
    const user = await User.findById(req.user._id);
    if (user.avatarPublicId) await cloudinary.uploader.destroy(user.avatarPublicId);
    user.avatar = req.file.path;
    user.avatarPublicId = req.file.filename;
    await user.save();
    res.json({ success: true, avatar: user.avatar });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET ANY USER PROFILE
router.get("/user/:username", async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username }).select("-password -email");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// FOLLOW / UNFOLLOW
router.post("/follow/:id", auth, async (req, res) => {
  try {
    if (req.params.id === req.user._id.toString()) return res.status(400).json({ success: false, message: "Cannot follow yourself" });
    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ success: false, message: "User not found" });

    const isFollowing = target.followers.includes(req.user._id);
    if (isFollowing) {
      target.followers.pull(req.user._id);
      await User.findByIdAndUpdate(req.user._id, { $pull: { following: req.params.id } });
    } else {
      target.followers.push(req.user._id);
      await User.findByIdAndUpdate(req.user._id, { $addToSet: { following: req.params.id } });
    }
    await target.save();

    // Emit real-time notification
    req.app.get("io").to(req.params.id).emit("notification", {
      type: "follow", message: `${req.user.username} started following you!`, from: req.user.username
    });

    res.json({ success: true, following: !isFollowing, followerCount: target.followers.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;

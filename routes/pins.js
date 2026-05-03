const express = require("express");
const router = express.Router();
const multer = require("multer");
const { cloudinary, storage } = require("../config/cloudinary");
const Pin = require("../models/Pin");
const User = require("../models/User");
const { auth, optionalAuth } = require("../middleware/auth");

const upload = multer({ storage, limits: { fileSize: 15 * 1024 * 1024 }, fileFilter: (req, file, cb) => {
  file.mimetype.startsWith("image/") ? cb(null, true) : cb(new Error("Images only!"), false);
}});

// GET ALL PINS (Feed)
router.get("/", optionalAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20, category, search } = req.query;
    const filter = { isDeleted: false };
    if (category && category !== "All") filter.category = category;
    if (search) {
      const regex = new RegExp(search, "i");
      filter.$or = [{ title: regex }, { description: regex }, { tags: regex }];
    }
    const pins = await Pin.find(filter)
      .populate("author", "username displayName avatar")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Pin.countDocuments(filter);
    res.json({ success: true, pins, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET SINGLE PIN
router.get("/:id", optionalAuth, async (req, res) => {
  try {
    const pin = await Pin.findById(req.params.id)
      .populate("author", "username displayName avatar bio followers")
      .populate("comments.author", "username displayName avatar");
    if (!pin || pin.isDeleted) return res.status(404).json({ success: false, message: "Pin not found" });
    res.json({ success: true, pin });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET PINS BY USER
router.get("/user/:username", async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    const pins = await Pin.find({ author: user._id, isDeleted: false })
      .populate("author", "username displayName avatar")
      .sort({ createdAt: -1 });
    res.json({ success: true, pins });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// CREATE PIN
router.post("/", auth, upload.single("image"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: "Image is required" });
    const { title, description, tags, category } = req.body;
    const tagsArray = tags ? tags.split(",").map(t => t.trim().toLowerCase()).filter(Boolean) : [];

    const pin = await Pin.create({
      title, description, tags: tagsArray, category: category || "Other",
      imageUrl: req.file.path, publicId: req.file.filename, author: req.user._id
    });

    await pin.populate("author", "username displayName avatar");

    req.app.get("io").emit("newPin", pin);
    res.status(201).json({ success: true, pin });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// UPDATE PIN
router.put("/:id", auth, async (req, res) => {
  try {
    const pin = await Pin.findById(req.params.id);
    if (!pin) return res.status(404).json({ success: false, message: "Pin not found" });
    if (pin.author.toString() !== req.user._id.toString() && !req.user.isAdmin)
      return res.status(403).json({ success: false, message: "Not authorized" });

    const { title, description, tags, category } = req.body;
    const tagsArray = tags ? tags.split(",").map(t => t.trim().toLowerCase()).filter(Boolean) : pin.tags;

    const updated = await Pin.findByIdAndUpdate(req.params.id,
      { title: title || pin.title, description, tags: tagsArray, category: category || pin.category },
      { new: true }).populate("author", "username displayName avatar");

    res.json({ success: true, pin: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE PIN
router.delete("/:id", auth, async (req, res) => {
  try {
    const pin = await Pin.findById(req.params.id);
    if (!pin) return res.status(404).json({ success: false, message: "Pin not found" });
    if (pin.author.toString() !== req.user._id.toString() && !req.user.isAdmin)
      return res.status(403).json({ success: false, message: "Not authorized" });

    await cloudinary.uploader.destroy(pin.publicId);
    pin.isDeleted = true;
    await pin.save();

    req.app.get("io").emit("pinDeleted", req.params.id);
    res.json({ success: true, message: "Pin deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// LIKE / UNLIKE
router.post("/:id/like", auth, async (req, res) => {
  try {
    const pin = await Pin.findById(req.params.id);
    if (!pin || pin.isDeleted) return res.status(404).json({ success: false, message: "Pin not found" });

    const liked = pin.likes.includes(req.user._id);
    liked ? pin.likes.pull(req.user._id) : pin.likes.push(req.user._id);
    await pin.save();

    if (!liked && pin.author.toString() !== req.user._id.toString()) {
      req.app.get("io").to(pin.author.toString()).emit("notification", {
        type: "like", message: `${req.user.username} liked your pin "${pin.title}"`, pinId: pin._id
      });
    }

    res.json({ success: true, liked: !liked, likeCount: pin.likes.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// SAVE / UNSAVE PIN
router.post("/:id/save", auth, async (req, res) => {
  try {
    const pin = await Pin.findById(req.params.id);
    if (!pin) return res.status(404).json({ success: false, message: "Pin not found" });

    const user = await User.findById(req.user._id);
    const saved = user.savedPins.includes(req.params.id);
    saved ? user.savedPins.pull(req.params.id) : user.savedPins.push(req.params.id);

    const pinSaved = pin.saves.includes(req.user._id);
    pinSaved ? pin.saves.pull(req.user._id) : pin.saves.push(req.user._id);

    await user.save(); await pin.save();
    res.json({ success: true, saved: !saved });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ADD COMMENT
router.post("/:id/comment", auth, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text?.trim()) return res.status(400).json({ success: false, message: "Comment cannot be empty" });

    const pin = await Pin.findById(req.params.id);
    if (!pin || pin.isDeleted) return res.status(404).json({ success: false, message: "Pin not found" });

    pin.comments.push({ author: req.user._id, text: text.trim() });
    await pin.save();
    await pin.populate("comments.author", "username displayName avatar");

    const newComment = pin.comments[pin.comments.length - 1];

    if (pin.author.toString() !== req.user._id.toString()) {
      req.app.get("io").to(pin.author.toString()).emit("notification", {
        type: "comment", message: `${req.user.username} commented on your pin`, pinId: pin._id
      });
    }

    req.app.get("io").emit("newComment", { pinId: req.params.id, comment: newComment });
    res.status(201).json({ success: true, comment: newComment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE COMMENT
router.delete("/:id/comment/:commentId", auth, async (req, res) => {
  try {
    const pin = await Pin.findById(req.params.id);
    if (!pin) return res.status(404).json({ success: false, message: "Pin not found" });

    const comment = pin.comments.id(req.params.commentId);
    if (!comment) return res.status(404).json({ success: false, message: "Comment not found" });

    if (comment.author.toString() !== req.user._id.toString() && !req.user.isAdmin)
      return res.status(403).json({ success: false, message: "Not authorized" });

    comment.deleteOne();
    await pin.save();
    res.json({ success: true, message: "Comment deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// REPORT PIN
router.post("/:id/report", auth, async (req, res) => {
  try {
    const { reason } = req.body;
    const pin = await Pin.findById(req.params.id);
    if (!pin) return res.status(404).json({ success: false, message: "Pin not found" });

    const alreadyReported = pin.reports.some(r => r.user.toString() === req.user._id.toString());
    if (alreadyReported) return res.status(400).json({ success: false, message: "Already reported" });

    pin.reports.push({ user: req.user._id, reason: reason || "Inappropriate content" });
    pin.isReported = true;
    await pin.save();
    res.json({ success: true, message: "Pin reported. Admin will review it." });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;

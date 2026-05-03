const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  text: { type: String, required: true, trim: true, maxlength: 500 },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
}, { timestamps: true });

const pinSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 100 },
  description: { type: String, trim: true, maxlength: 500, default: "" },
  imageUrl: { type: String, required: true },
  publicId: { type: String, required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  tags: {
    type: [String], default: [],
    set: tags => tags.map(t => t.trim().toLowerCase()).filter(t => t.length > 0)
  },
  category: {
    type: String, default: "Other",
    enum: ["Art", "Photography", "Travel", "Food", "Fashion", "Technology", "Nature", "Architecture", "DIY", "Fitness", "Music", "Other"]
  },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  comments: [commentSchema],
  saves: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  isReported: { type: Boolean, default: false },
  reports: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    reason: String,
    createdAt: { type: Date, default: Date.now }
  }],
  isDeleted: { type: Boolean, default: false },
}, { timestamps: true });

pinSchema.index({ tags: 1 });
pinSchema.index({ category: 1 });
pinSchema.index({ title: "text", description: "text", tags: "text" });

module.exports = mongoose.model("Pin", pinSchema);

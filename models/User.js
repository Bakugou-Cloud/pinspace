const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  username: {
    type: String, required: true, unique: true, trim: true,
    minlength: 3, maxlength: 30,
    match: [/^[a-zA-Z0-9_]+$/, "Username can only have letters, numbers and underscores"]
  },
  email: { type: String, required: true, unique: true, trim: true, lowercase: true },
  password: { type: String, required: true, minlength: 6 },
  displayName: { type: String, trim: true, maxlength: 50 },
  bio: { type: String, trim: true, maxlength: 200, default: "" },
  avatar: { type: String, default: "" },
  avatarPublicId: { type: String, default: "" },
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  savedPins: [{ type: mongoose.Schema.Types.ObjectId, ref: "Pin" }],
  isAdmin: { type: Boolean, default: false },
  isBanned: { type: Boolean, default: false },
  banReason: { type: String, default: "" },
}, { timestamps: true });

// Hash password before save
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Virtual: pin count
userSchema.virtual("pinCount", {
  ref: "Pin", localField: "_id", foreignField: "author", count: true
});

module.exports = mongoose.model("User", userSchema);

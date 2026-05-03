const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Required auth
const auth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1] || req.cookies?.token;
    if (!token) return res.status(401).json({ success: false, message: "Not logged in. Please login first." });

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret");
    const user = await User.findById(decoded.id).select("-password");
    if (!user) return res.status(401).json({ success: false, message: "User not found." });
    if (user.isBanned) return res.status(403).json({ success: false, message: `Account banned. Reason: ${user.banReason}` });

    req.user = user;
    next();
  } catch {
    res.status(401).json({ success: false, message: "Invalid or expired session. Please login again." });
  }
};

// Optional auth (doesn't fail if not logged in)
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret");
      const user = await User.findById(decoded.id).select("-password");
      if (user && !user.isBanned) req.user = user;
    }
  } catch {}
  next();
};

// Admin only
const adminAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ success: false, message: "Unauthorized" });
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret");
    const user = await User.findById(decoded.id).select("-password");
    if (!user || !user.isAdmin) return res.status(403).json({ success: false, message: "Admin access required." });
    req.user = user;
    next();
  } catch {
    res.status(401).json({ success: false, message: "Invalid session." });
  }
};

module.exports = { auth, optionalAuth, adminAuth };

// ── API HELPER ────────────────────────────────────────────────────────────────
const API = {
  async request(method, url, body = null, isFormData = false) {
    const token = localStorage.getItem("token");
    const headers = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;
    if (!isFormData && body) headers["Content-Type"] = "application/json";

    const res = await fetch(url, {
      method,
      headers,
      body: isFormData ? body : (body ? JSON.stringify(body) : null),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Request failed");
    return data;
  },
  get: (url) => API.request("GET", url),
  post: (url, body) => API.request("POST", url, body),
  put: (url, body) => API.request("PUT", url, body),
  delete: (url) => API.request("DELETE", url),
  upload: (url, formData) => API.request("POST", url, formData, true),
};

// ── AUTH HELPERS ──────────────────────────────────────────────────────────────
const Auth = {
  getUser: () => JSON.parse(localStorage.getItem("user") || "null"),
  getToken: () => localStorage.getItem("token"),
  isLoggedIn: () => !!localStorage.getItem("token"),
  save: (token, user) => { localStorage.setItem("token", token); localStorage.setItem("user", JSON.stringify(user)); },
  logout: () => { localStorage.removeItem("token"); localStorage.removeItem("user"); window.location.href = "/"; },
};

// ── TOAST ─────────────────────────────────────────────────────────────────────
function showToast(msg, type = "info") {
  let container = document.getElementById("toastContainer");
  if (!container) {
    container = document.createElement("div");
    container.id = "toastContainer";
    container.style.cssText = "position:fixed;bottom:1.5rem;right:1.5rem;z-index:9999;display:flex;flex-direction:column;gap:.5rem;";
    document.body.appendChild(container);
  }
  const colors = { success: "#4ecdc4", error: "#ff4757", info: "#7c6aff", warning: "#ffa502" };
  const icons = { success: "✅", error: "❌", info: "💫", warning: "⚠️" };
  const toast = document.createElement("div");
  toast.style.cssText = `background:#16161f;border:1px solid #1e1e2e;border-left:3px solid ${colors[type]};border-radius:10px;padding:.75rem 1.25rem;font-size:.875rem;display:flex;align-items:center;gap:.5rem;min-width:250px;color:#e8e8f0;font-family:'DM Sans',sans-serif;animation:toastIn .3s ease;box-shadow:0 8px 32px rgba(0,0,0,.4);`;
  toast.innerHTML = `<span>${icons[type]}</span><span>${msg}</span>`;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}

// ── TIME AGO ──────────────────────────────────────────────────────────────────
function timeAgo(date) {
  const seconds = Math.floor((Date.now() - new Date(date)) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ── FORMAT NUMBER ─────────────────────────────────────────────────────────────
function formatNum(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
  if (n >= 1000) return (n / 1000).toFixed(1) + "K";
  return n;
}

// ── AVATAR ────────────────────────────────────────────────────────────────────
function avatarHtml(user, size = 36) {
  if (user?.avatar) return `<img src="${user.avatar}" alt="${user.username}" style="width:${size}px;height:${size}px;border-radius:50%;object-fit:cover;">`;
  const initials = (user?.displayName || user?.username || "?")[0].toUpperCase();
  const colors = ["#7c6aff","#ff6b9d","#4ecdc4","#ffa502","#ff4757"];
  const color = colors[(user?.username?.charCodeAt(0) || 0) % colors.length];
  return `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};display:flex;align-items:center;justify-content:center;font-weight:700;font-size:${size * 0.4}px;color:white;flex-shrink:0;">${initials}</div>`;
}

// ── COPY TO CLIPBOARD ─────────────────────────────────────────────────────────
function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => showToast("Link copied to clipboard!", "success"));
}

// Inject global CSS for toast animation
const style = document.createElement("style");
style.textContent = `@keyframes toastIn{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)}}`;
document.head.appendChild(style);

// Minimal console logger used by lib/sessionLoader.js
const stamp = () => new Date().toISOString().slice(11, 19);
module.exports = {
  info: (...a) => console.log(`[${stamp()}]`, ...a),
  warn: (...a) => console.warn(`[${stamp()}]`, ...a),
  error: (...a) => console.error(`[${stamp()}]`, ...a),
};

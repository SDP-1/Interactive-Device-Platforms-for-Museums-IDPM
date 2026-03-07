import UserSession from "../models/UserSession.js";

let _interval = null;

export function startSessionMonitor(intervalMs = 60 * 1000) {
  if (_interval) return; // already running

  _interval = setInterval(async () => {
    try {
      const now = new Date();
      // Deactivate sessions that have ended
      await UserSession.updateMany(
        { is_active: true, end_time: { $lte: now } },
        { $set: { is_active: false } },
      );

      // Reactivate sessions if end_time moved into the future (e.g., after extension)
      await UserSession.updateMany(
        { is_active: false, end_time: { $gt: now } },
        { $set: { is_active: true } },
      );
    } catch (err) {
      console.error("Session monitor error:", err.message);
    }
  }, intervalMs);
}

export function stopSessionMonitor() {
  if (_interval) {
    clearInterval(_interval);
    _interval = null;
  }
}

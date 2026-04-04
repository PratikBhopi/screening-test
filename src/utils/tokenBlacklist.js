const jwt = require('jsonwebtoken');

// In-memory store of invalidated JWT IDs. Keyed by jwt_id, value is the exp timestamp.
// Not shared across processes — Redis would be the production swap here.
const blacklist = new Map();

function addToBlacklist(jwt_id, token) {
  try {
    const decoded = jwt.decode(token);
    const exp = decoded?.exp ?? Math.floor(Date.now() / 1000) + 86400;
    blacklist.set(jwt_id, exp);
  } catch (err) {
    console.error('Failed to decode token for blacklist:', err);
  }
}

function isBlacklisted(jwt_id) {
  return blacklist.has(jwt_id);
}

// Runs every hour to remove entries that have already expired naturally
function startCleanupJob() {
  setInterval(() => {
    const now = Math.floor(Date.now() / 1000);
    for (const [id, exp] of blacklist.entries()) {
      if (exp < now) blacklist.delete(id);
    }
  }, 60 * 60 * 1000);
}

module.exports = { addToBlacklist, isBlacklisted, startCleanupJob };

const crypto = require('crypto');

function generateTempPassword() {
  const upper   = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lower   = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  const all     = upper + lower + numbers + symbols;

  const pick = (pool) => pool[crypto.randomInt(0, pool.length)];

  // Guarantee at least one from each character class
  const chars = [pick(upper), pick(lower), pick(numbers), pick(symbols)];
  for (let i = 4; i < 10; i++) chars.push(pick(all));

  // Shuffle so the guaranteed chars don't always appear at the start
  for (let i = chars.length - 1; i > 0; i--) {
    const j = crypto.randomInt(0, i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }

  return chars.join('');
}

module.exports = { generateTempPassword };

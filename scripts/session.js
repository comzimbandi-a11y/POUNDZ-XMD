// Usage: npm run session   (after you've paired once and sessions/creds.json exists)
const fs = require('fs');
const path = require('path');
const { encodeSessionId } = require('../lib/sessionLoader');

const credsFile = path.join(__dirname, '..', 'sessions', 'creds.json');
if (!fs.existsSync(credsFile)) {
  console.error('No sessions/creds.json found. Run `npm start` and pair first.');
  process.exit(1);
}
console.log('\nYour SESSION_ID (keep it secret, it is a full login):\n');
console.log(encodeSessionId(fs.readFileSync(credsFile)));
console.log('\nPaste it into the SESSION_ID env var on your host.\n');

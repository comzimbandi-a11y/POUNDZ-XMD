require('dotenv').config();

// accepts owner/repo or a full GitHub URL (with or without .git) and returns owner/repo
const repoName = (v) => (v || '').trim().replace(/\/+$/, '').replace(/\.git$/i, '').replace(/^(https?:\/\/)?(www\.)?github\.com\//i, '');

const list = (v) => (v || '').split(',').map((s) => s.replace(/\D/g, '')).filter(Boolean);

module.exports = {
  BOT_NAME: process.env.BOT_NAME || 'POUNDZ MD',
  OWNER_NAME: process.env.OWNER_NAME || 'Poundz',
  OWNER_NUMBERS: list(process.env.OWNER_NUMBER),
  PAIR_NUMBER: (process.env.PAIR_NUMBER || '').replace(/\D/g, ''),
  TIME_ZONE: process.env.TIME_ZONE || 'Africa/Nairobi',
  // Self-update from YOUR repo (see .update command)
  UPDATE_REPO: repoName(process.env.UPDATE_REPO || 'comzimbandi-a11y/POUNDZ-XMD'), // owner/repo
  UPDATE_BRANCH: (process.env.UPDATE_BRANCH || 'main').trim(),
  GITHUB_TOKEN: (process.env.GITHUB_TOKEN || '').trim(),      // only for private repos
  AUTO_UPDATE: (process.env.AUTO_UPDATE || 'off').toLowerCase(), // on = pull latest at every boot
  STICKER_PACK: process.env.STICKER_PACK || 'POUNDZ MD',
  STICKER_AUTHOR: process.env.STICKER_AUTHOR || 'Poundz',

  // Defaults for runtime settings (can be changed in chat with the .set command,
  // changes are saved to data/settings.json)
  DEFAULTS: {
    prefix: process.env.PREFIX || '.',
    mode: process.env.MODE || 'public', // public | private
    antilink: 'off',                    // off | delete | kick
    antidelete: 'off',                  // off | chat | dm
    welcome: 'off',                     // on | off
    autoreadstatus: 'off',              // on | off
    anticall: 'off',                    // on | off
  },
};

const fs = require('fs');
const path = require('path');
const config = require('../config');

const file = path.join(__dirname, '..', 'data', 'settings.json');
let data = { ...config.DEFAULTS };

try {
  if (fs.existsSync(file)) data = { ...data, ...JSON.parse(fs.readFileSync(file, 'utf8')) };
} catch (e) {
  console.error('Could not read settings.json, using defaults:', e.message);
}

function save() {
  try {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error('Could not save settings:', e.message);
  }
}

module.exports = {
  get: (k) => data[k],
  all: () => ({ ...data }),
  set(k, v) { data[k] = v; save(); },
  has: (k) => Object.prototype.hasOwnProperty.call(config.DEFAULTS, k),
};

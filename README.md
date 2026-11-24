# POUNDZ MD

A modular WhatsApp bot built on the official `@whiskeysockets/baileys`.

## Setup
```bash
npm install
cp .env.example .env     # set OWNER_NUMBER (and PAIR_NUMBER if you want a pairing code)
npm start
```
- **QR:** leave `PAIR_NUMBER` empty and scan the QR in the terminal.
- **Pairing code:** set `PAIR_NUMBER` to the bot's number; a code prints in the terminal. Enter it under *Linked devices → Link with phone number*.
- The login is stored in `sessions/`. Keep it private and persistent (a volume on Docker/hosts). Delete it to re-pair.

## Commands
`.menu` lists everything. Categories: main, group, tools, owner.
Owner can change behaviour live with `.set` (mode, antilink, antidelete, welcome, autoreadstatus, anticall) and `.setprefix`.

## Adding a command
Create `plugins/hello.js`:
```js
const { cmd } = require('../lib/registry');
cmd({ pattern: 'hello', desc: 'Say hi', category: 'tools' }, async ({ reply, pushName }) => {
  reply(`Hi ${pushName}!`);
});
```
Options: `owner`, `group`, `admin`, `botAdmin`, `alias: []`. Restart the bot to load it.
Use `onMessage(fn)` for passive features and `onGroupUpdate(fn)` for join/leave events.

## Deliberately left out
No remote `eval`, no auto-update from a repo, no third-party session/pairing servers, no hardcoded session or owner.

## Session ID (for hosts without a persistent disk)
1. Pair once locally (`npm start`), then run `npm run session` (or send `.session` to the bot) to get an ID starting with `POUNDZ~`.
2. Set it as the `SESSION_ID` env var on your host. The loader (`lib/sessionLoader.js`) also accepts `POPKID~`, `F~`, `SILA-MD~` and `NEXUS___` strings, zip or gzip payloads, and URL-safe base64. On boot, if `sessions/creds.json` doesn't exist, the bot rebuilds it from the ID.
3. A session ID is a full login to the WhatsApp account. Never post it publicly. If it leaks, unlink the device in WhatsApp → Linked devices.

Note: only the login credentials travel in the ID. If the host has no persistent disk, encryption keys reset on restart, so occasionally an old message may fail to decrypt. A persistent volume is still the more reliable option.

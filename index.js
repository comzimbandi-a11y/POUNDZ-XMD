/**
 * POUNDZ MD - modular WhatsApp bot (Baileys)
 */
const fs = require('fs');
const path = require('path');
const P = require('pino');
const qrcode = require('qrcode-terminal');
const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  Browsers,
  makeCacheableSignalKeyStore,
} = require('@whiskeysockets/baileys');

const config = require('./config');
const settings = require('./lib/settings');
const registry = require('./lib/registry');
const { num, unwrap, getBody, getQuoted } = require('./lib/utils');
const { loadSession } = require('./lib/sessionLoader');

process.on('uncaughtException', (e) => console.error('Uncaught exception:', e));
process.on('unhandledRejection', (e) => console.error('Unhandled rejection:', e));

// ---- load plugins once ----
const pluginDir = path.join(__dirname, 'plugins');
for (const file of fs.readdirSync(pluginDir)) {
  if (!file.endsWith('.js')) continue;
  try {
    require(path.join(pluginDir, file));
  } catch (e) {
    console.error(`Failed to load plugin ${file}:`, e.message);
  }
}
console.log(`Loaded ${registry.commands.length} commands`);

// ---- small group metadata cache (avoids rate limits) ----
const metaCache = new Map();
async function getGroupMeta(conn, jid) {
  const hit = metaCache.get(jid);
  if (hit && Date.now() - hit.t < 60_000) return hit.data;
  const data = await conn.groupMetadata(jid).catch(() => null);
  if (data) metaCache.set(jid, { t: Date.now(), data });
  return data;
}

/** True if `jid` (any form: pn, lid, with device suffix) matches participant p. */
function sameUser(p, jid) {
  const n = num(jid);
  return [p.id, p.lid, p.phoneNumber].some((x) => x && num(x) === n);
}

async function handleMessage(conn, mek) {
  if (!mek.message) return;
  const from = mek.key.remoteJid;
  if (!from) return;

  if (from === 'status@broadcast') {
    if (settings.get('autoreadstatus') === 'on') {
      await conn.readMessages([mek.key]).catch(() => {});
    }
    return;
  }

  const message = unwrap(mek.message);
  const body = getBody(message);
  const isGroup = from.endsWith('@g.us');
  const senderJid = mek.key.fromMe
    ? conn.user.id
    : (isGroup ? (mek.key.participant || mek.key.participantAlt) : (mek.key.remoteJidAlt || from));
  const senderNum = num(senderJid);
  const isOwner = mek.key.fromMe || config.OWNER_NUMBERS.includes(senderNum);

  const reply = (text, extra = {}) =>
    conn.sendMessage(from, { text, ...extra }, { quoted: mek });

  let participants = [];
  let isAdmin = false;
  let isBotAdmin = false;
  if (isGroup) {
    const meta = await getGroupMeta(conn, from);
    participants = meta?.participants || [];
    const admins = participants.filter((p) => p.admin);
    isAdmin = admins.some((p) => sameUser(p, senderJid));
    isBotAdmin = admins.some((p) => sameUser(p, conn.user.id) || sameUser(p, conn.user.lid));
  }

  const prefix = settings.get('prefix');
  const isCmd = body.startsWith(prefix);
  const [rawName, ...args] = isCmd ? body.slice(prefix.length).trim().split(/\s+/) : [''];
  const name = (rawName || '').toLowerCase();
  const text = args.join(' ');

  const ctx = {
    conn, mek, message, from, body, args, text, name, prefix,
    isGroup, isOwner, isAdmin, isBotAdmin, participants,
    sender: senderJid, senderNum, pushName: mek.pushName || 'User',
    reply, quoted: getQuoted(mek, message),
    getGroupMeta: () => getGroupMeta(conn, from),
  };

  // passive hooks (antilink, antidelete, ...) run on every message
  for (const hook of registry.messageHooks) {
    try { await hook(ctx); } catch (e) { console.error('Hook error:', e.message); }
  }

  if (!isCmd || !name) return;
  if (settings.get('mode') === 'private' && !isOwner) return;

  const command = registry.find(name);
  if (!command) return;

  if (command.owner && !isOwner) return reply('⛔ Owner only command.');
  if (command.group && !isGroup) return reply('⛔ This command only works in groups.');
  if (command.admin && !(isAdmin || isOwner)) return reply('⛔ Group admins only.');
  if (command.botAdmin && !isBotAdmin) return reply('⚠️ Make me a group admin first.');

  try {
    await command.run(ctx);
  } catch (e) {
    console.error(`Command ${name} failed:`, e);
    reply('❌ Something went wrong running that command.').catch(() => {});
  }
}

async function start() {
  const { state, saveCreds } = await useMultiFileAuthState(path.join(__dirname, 'sessions'));
  const { version } = await fetchLatestBaileysVersion();
  const logger = P({ level: 'silent' });

  const conn = makeWASocket({
    version,
    logger,
    browser: Browsers.ubuntu('Chrome'),
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, logger),
    },
    markOnlineOnConnect: false,
  });

  // Pair with a code if a number is set, otherwise show a QR
  if (!state.creds.registered && config.PAIR_NUMBER) {
    setTimeout(async () => {
      try {
        const code = await conn.requestPairingCode(config.PAIR_NUMBER);
        console.log(`\n🔗 Pairing code: ${code}\nWhatsApp > Linked devices > Link with phone number\n`);
      } catch (e) {
        console.error('Could not request pairing code:', e.message);
      }
    }, 3000);
  }

  conn.ev.on('creds.update', saveCreds);

  conn.ev.on('connection.update', ({ connection, lastDisconnect, qr }) => {
    if (qr && !config.PAIR_NUMBER) qrcode.generate(qr, { small: true });

    if (connection === 'open') {
      console.log(`✅ ${config.BOT_NAME} connected as ${num(conn.user.id)}`);
      conn.sendMessage(num(conn.user.id) + '@s.whatsapp.net', {
        text: `✅ *${config.BOT_NAME}* is online\nPrefix: ${settings.get('prefix')}\nMode: ${settings.get('mode')}\nType ${settings.get('prefix')}menu to begin.`,
      }).catch(() => {});
    }

    if (connection === 'close') {
      const code = lastDisconnect?.error?.output?.statusCode;
      if (code === DisconnectReason.loggedOut) {
        console.log('❌ Logged out. Delete the sessions/ folder and pair again.');
        return;
      }
      console.log(`Connection closed (${code}), reconnecting...`);
      setTimeout(start, 3000);
    }
  });

  conn.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;
    for (const mek of messages) {
      try { await handleMessage(conn, mek); } catch (e) { console.error('Message error:', e); }
    }
  });

  conn.ev.on('group-participants.update', async (update) => {
    metaCache.delete(update.id);
    for (const h of registry.groupHandlers) {
      try { await h(conn, update); } catch (e) { console.error('Group handler error:', e.message); }
    }
  });

  conn.ev.on('call', async (calls) => {
    if (settings.get('anticall') !== 'on') return;
    for (const call of calls) {
      if (call.status !== 'offer') continue;
      await conn.rejectCall(call.id, call.from).catch(() => {});
      await conn.sendMessage(call.from, { text: `📵 ${config.BOT_NAME} can't take calls. Please send a text.` }).catch(() => {});
    }
  });
}

(async () => {
  // Restore login from SESSION_ID (only if one is set and no saved session exists)
  if (process.env.SESSION_ID) {
    await loadSession(process.env.SESSION_ID, path.join(__dirname, 'sessions'));
  }
  start();
})();

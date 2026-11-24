const { cmd } = require('../lib/registry');
const settings = require('../lib/settings');

const VALUES = {
  mode: ['public', 'private'],
  antilink: ['off', 'delete', 'kick'],
  antidelete: ['off', 'chat', 'dm'],
  welcome: ['on', 'off'],
  autoreadstatus: ['on', 'off'],
  anticall: ['on', 'off'],
};

cmd({ pattern: 'set', desc: 'Change a setting: .set <name> <value>', category: 'owner', owner: true },
  async ({ args, reply, prefix }) => {
    const [key, value] = [args[0]?.toLowerCase(), args[1]?.toLowerCase()];
    if (!key) {
      const s = settings.all();
      return reply(
        '*Settings*\n' +
        Object.entries(VALUES).map(([k, v]) => `• ${k}: *${s[k]}*  (${v.join(' | ')})`).join('\n') +
        `\n\nUsage: ${prefix}set <name> <value>`
      );
    }
    if (!VALUES[key]) return reply(`Unknown setting. Options: ${Object.keys(VALUES).join(', ')}`);
    if (!VALUES[key].includes(value)) return reply(`Value must be one of: ${VALUES[key].join(', ')}`);
    settings.set(key, value);
    reply(`✅ ${key} → *${value}*`);
  });

cmd({ pattern: 'setprefix', desc: 'Change the command prefix', category: 'owner', owner: true },
  async ({ args, reply }) => {
    const p = args[0];
    if (!p || p.length > 3) return reply('Give a prefix of 1–3 characters, e.g. .setprefix !');
    settings.set('prefix', p);
    reply(`✅ Prefix is now *${p}*`);
  });

cmd({ pattern: 'broadcast', desc: 'Send a message to all groups', category: 'owner', owner: true },
  async ({ conn, text, reply }) => {
    if (!text) return reply('Give a message to broadcast.');
    const groups = Object.keys(await conn.groupFetchAllParticipating());
    let sent = 0;
    for (const id of groups) {
      await conn.sendMessage(id, { text: `📢 *Broadcast*\n\n${text}` }).then(() => sent++).catch(() => {});
      await new Promise((r) => setTimeout(r, 1500)); // go gently, avoid rate limits
    }
    reply(`📢 Sent to ${sent}/${groups.length} groups.`);
  });

cmd({ pattern: 'shutdown', desc: 'Stop the bot', category: 'owner', owner: true },
  async ({ reply }) => { await reply('🛑 Shutting down...'); process.exit(0); });

cmd({ pattern: 'session', desc: 'Send your SESSION_ID to the bot chat (keep it secret)', category: 'owner', owner: true },
  async ({ conn, reply }) => {
    const fs = require('fs');
    const path = require('path');
    const { encodeSessionId } = require('../lib/sessionLoader');
    const creds = path.join(__dirname, '..', 'sessions', 'creds.json');
    if (!fs.existsSync(creds)) return reply('No saved session found.');
    const me = `${conn.user.id.split(':')[0].split('@')[0]}@s.whatsapp.net`;
    await conn.sendMessage(me, { text: encodeSessionId(fs.readFileSync(creds)) });
    reply('🔐 Sent to your own chat. It is a full login: never share it, and delete the message after saving it.');
  });

cmd({ pattern: 'update', alias: ['upgrade'], desc: 'Install the latest version (.update check = look only)', category: 'owner', owner: true },
  async ({ args, reply }) => {
    const updater = require('../lib/updater');
    const short = (s) => (s || 'unknown').slice(0, 7);
    const v = (x) => (x ? `v${x}` : 'unknown');
    try {
      const info = await updater.checkUpdate();
      if (!info.hasUpdate) {
        return reply(`✅ Already on the latest version\n📦 ${v(info.currentVersion)} (${short(info.current)})`);
      }
      const change = `📦 ${v(info.currentVersion)} → ${v(info.latestVersion)}\n🔖 ${short(info.current)} → ${short(info.latest.sha)}\n📝 ${info.latest.message}`;
      if (args[0]?.toLowerCase() === 'check') {
        return reply(`🆕 Update available\n\n${change}\n\nSend .update to install.`);
      }
      await reply(`⬇️ Updating...\n\n${change}`);
      const r = await updater.applyUpdate(info.latest);
      await reply(`✅ Updated to ${v(r.newVersion)}${r.depsInstalled ? ' (dependencies reinstalled)' : ''}\nRestarting...`);
      setTimeout(() => process.exit(0), 1500); // the host / process manager brings it back up
    } catch (e) {
      reply(`❌ Update failed: ${e.message}`);
    }
  });

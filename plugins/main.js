const { cmd, commands } = require('../lib/registry');
const config = require('../config');
const settings = require('../lib/settings');
const { runtime } = require('../lib/utils');

cmd({ pattern: 'ping', alias: ['speed'], desc: 'Check bot response time', category: 'main' },
  async ({ conn, from, mek }) => {
    const t = Date.now();
    const sent = await conn.sendMessage(from, { text: '🏓 Pinging...' }, { quoted: mek });
    await conn.sendMessage(from, { text: `🏓 *Pong!* ${Date.now() - t}ms`, edit: sent.key });
  });

cmd({ pattern: 'alive', desc: 'Check the bot is online', category: 'main' },
  async ({ reply }) => {
    reply(`✅ *${config.BOT_NAME}* is alive\n⏱ Uptime: ${runtime(process.uptime())}\n⚙️ Mode: ${settings.get('mode')}`);
  });

cmd({ pattern: 'uptime', desc: 'How long the bot has been running', category: 'main' },
  async ({ reply }) => reply(`⏱ ${runtime(process.uptime())}`));

cmd({ pattern: 'owner', desc: 'Show the bot owner', category: 'main' },
  async ({ conn, from, mek }) => {
    const n = config.OWNER_NUMBERS[0];
    if (!n) return conn.sendMessage(from, { text: 'No owner number configured.' }, { quoted: mek });
    const vcard = `BEGIN:VCARD\nVERSION:3.0\nFN:${config.OWNER_NAME}\nTEL;type=CELL;waid=${n}:+${n}\nEND:VCARD`;
    await conn.sendMessage(from, { contacts: { displayName: config.OWNER_NAME, contacts: [{ vcard }] } }, { quoted: mek });
  });

cmd({ pattern: 'menu', alias: ['help', 'commands'], desc: 'Show all commands', category: 'main' },
  async ({ reply, prefix }) => {
    const groups = {};
    for (const c of commands) (groups[c.category] ||= []).push(c);
    const order = ['main', 'group', 'tools', 'owner'];
    const cats = Object.keys(groups).sort((a, b) => {
      const ia = order.indexOf(a), ib = order.indexOf(b);
      return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
    });

    let out = `╭━━〔 *${config.BOT_NAME}* 〕━━╮\n│ Prefix: ${prefix}\n│ Mode: ${settings.get('mode')}\n│ Commands: ${commands.length}\n╰━━━━━━━━━━━━━━╯\n`;
    for (const cat of cats) {
      out += `\n*${cat.toUpperCase()}*\n`;
      out += groups[cat].map((c) => `› ${prefix}${c.pattern}${c.desc ? ` — ${c.desc}` : ''}`).join('\n') + '\n';
    }
    out += `\n_Powered by ${config.BOT_NAME}_`;
    reply(out);
  });

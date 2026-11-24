
const { cmd, commands } = require('../lib/registry');
const config = require('../config');
const settings = require('../lib/settings');
const { runtime } = require('../lib/utils');
const updater = require('../lib/updater');
const ver = () => `v${updater.localVersion() || '?'}`;

cmd({ pattern: 'ping', alias: ['speed'], desc: 'Check bot response time', category: 'main' },
  async ({ conn, from, mek }) => {
    const t = Date.now();
    const sent = await conn.sendMessage(from, { text: '🏓 Pinging...' }, { quoted: mek });
    await conn.sendMessage(from, { text: `🏓 *Pong!* ${Date.now() - t}ms`, edit: sent.key });
  });

cmd({ pattern: 'alive', desc: 'Check the bot is online', category: 'main' },
  async ({ reply }) => {
    reply(`✅ *${config.BOT_NAME}* ${ver()} is alive\n⏱ Uptime: ${runtime(process.uptime())}\n⚙️ Mode: ${settings.get('mode')}`);
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
    for (const c of commands) (groups[c.category || 'other'] ||= []).push(c);

    const order = [
      'main',
      'download',
      'search',
      'ai',
      'anime',
      'fun',
      'games',
      'group',
      'admin',
      'tools',
      'media',
      'sticker',
      'convert',
      'utility',
      'misc',
      'owner'
    ];

    const cats = Object.keys(groups).sort((a, b) => {
      const ia = order.indexOf(a.toLowerCase());
      const ib = order.indexOf(b.toLowerCase());
      return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
    });

    let out = `╭━━━〔 *${config.BOT_NAME}* 〕━━━┈⊷
┃ ✦ *Owner:* ${config.OWNER_NAME}
┃ ✦ *Prefix:* ${prefix}
┃ ✦ *Version:* ${ver()}
┃ ✦ *Mode:* ${settings.get('mode')}
┃ ✦ *Commands:* ${commands.length}
╰━━━━━━━━━━━━━━━━━━━┈⊷
`;

    for (const cat of cats) {
      const titles = {
        main: 'MAIN MENU',
        download: 'DOWNLOAD MENU',
        search: 'SEARCH MENU',
        ai: 'AI MENU',
        anime: 'ANIME MENU',
        fun: 'FUN MENU',
        games: 'GAMES MENU',
        group: 'GROUP MENU',
        admin: 'ADMIN MENU',
        tools: 'TOOLS MENU',
        media: 'MEDIA MENU',
        sticker: 'STICKER MENU',
        convert: 'CONVERT MENU',
        utility: 'UTILITY MENU',
        misc: 'MISC MENU',
        owner: 'OWNER MENU'
      };

      const title = titles[cat.toLowerCase()] || `${cat.toUpperCase()} MENU`;

      out += `\n╭━━━〔 *${title}* 〕━━━┈⊷\n`;

      out += groups[cat].map((c) =>
        `┃ ⌜ ${prefix}${c.pattern}${c.desc ? ` — ${c.desc}` : ''}`
      ).join('\n');

      out += '\n╰━━━━━━━━━━━━━━━━━━━┈⊷\n';
    }

    out += `
╭━━━〔 *SUPPORT* 〕━━━┈⊷
┃ ✦ *Bot:* ${config.BOT_NAME}
┃ ✦ *Status:* Online
╰━━━━━━━━━━━━━━━━━━━┈⊷`;

    reply(out);
  });

cmd({ pattern: 'version', alias: ['ver'], desc: 'Show the bot version', category: 'main' },
  async ({ reply }) => {
    const sha = updater.currentSha();
    reply(`📦 *${config.BOT_NAME}* ${ver()}${sha ? `\n🔖 ${sha.slice(0, 7)}` : ''}${config.UPDATE_REPO ? `\n🌐 ${config.UPDATE_REPO}` : ''}`);
  });

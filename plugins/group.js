const { cmd, onGroupUpdate } = require('../lib/registry');
const settings = require('../lib/settings');
const { num } = require('../lib/utils');

/** Targets: @mentions, else the replied-to user. */
function targets({ message, quoted }) {
  const ctx = message?.extendedTextMessage?.contextInfo;
  const mentioned = ctx?.mentionedJid || [];
  if (mentioned.length) return mentioned;
  return quoted?.sender ? [quoted.sender] : [];
}

cmd({ pattern: 'tagall', desc: 'Mention everyone', category: 'group', group: true, admin: true },
  async ({ conn, from, mek, participants, text }) => {
    const ids = participants.map((p) => p.id);
    const lines = ids.map((id) => `› @${num(id)}`).join('\n');
    await conn.sendMessage(from, { text: `📣 *${text || 'Attention everyone'}*\n\n${lines}`, mentions: ids }, { quoted: mek });
  });

cmd({ pattern: 'hidetag', desc: 'Send a message that silently tags all', category: 'group', group: true, admin: true },
  async ({ conn, from, mek, participants, text }) => {
    if (!text) return;
    await conn.sendMessage(from, { text, mentions: participants.map((p) => p.id) }, { quoted: mek });
  });

cmd({ pattern: 'tagadmins', desc: 'Mention the group admins', category: 'group', group: true },
  async ({ conn, from, mek, participants, text }) => {
    const admins = participants.filter((p) => p.admin).map((p) => p.id);
    const lines = admins.map((id) => `› @${num(id)}`).join('\n');
    await conn.sendMessage(from, { text: `🛡 *${text || 'Admins'}*\n\n${lines}`, mentions: admins }, { quoted: mek });
  });

for (const [pattern, action, verb] of [
  ['kick', 'remove', 'removed'],
  ['promote', 'promote', 'promoted'],
  ['demote', 'demote', 'demoted'],
]) {
  cmd({ pattern, desc: `${pattern} a member (@mention or reply)`, category: 'group', group: true, admin: true, botAdmin: true },
    async (ctx) => {
      const list = targets(ctx);
      if (!list.length) return ctx.reply(`Mention or reply to someone to ${pattern}.`);
      await ctx.conn.groupParticipantsUpdate(ctx.from, list, action);
      ctx.reply(`✅ ${list.length} member(s) ${verb}.`);
    });
}

cmd({ pattern: 'link', desc: 'Get the group invite link', category: 'group', group: true, admin: true, botAdmin: true },
  async ({ conn, from, reply }) => {
    const code = await conn.groupInviteCode(from);
    reply(`🔗 https://chat.whatsapp.com/${code}`);
  });

cmd({ pattern: 'mute', desc: 'Only admins can send messages', category: 'group', group: true, admin: true, botAdmin: true },
  async ({ conn, from, reply }) => {
    await conn.groupSettingUpdate(from, 'announcement');
    reply('🔇 Group muted. Only admins can send messages.');
  });

cmd({ pattern: 'unmute', desc: 'Let everyone send messages', category: 'group', group: true, admin: true, botAdmin: true },
  async ({ conn, from, reply }) => {
    await conn.groupSettingUpdate(from, 'not_announcement');
    reply('🔊 Group unmuted.');
  });

// Welcome / goodbye messages
onGroupUpdate(async (conn, { id, participants, action }) => {
  if (settings.get('welcome') !== 'on') return;
  if (action !== 'add' && action !== 'remove') return;
  const meta = await conn.groupMetadata(id).catch(() => null);
  const name = meta?.subject || 'the group';
  for (const p of participants) {
    const jid = typeof p === 'string' ? p : p.id;
    const text = action === 'add'
      ? `👋 Welcome @${num(jid)} to *${name}*!`
      : `👋 @${num(jid)} left *${name}*.`;
    await conn.sendMessage(id, { text, mentions: [jid] }).catch(() => {});
  }
});

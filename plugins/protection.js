// Passive features: anti-link and anti-delete
const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const { onMessage } = require('../lib/registry');
const settings = require('../lib/settings');
const config = require('../config');
const { num, LINK_RE } = require('../lib/utils');

// ---------- anti-link ----------
onMessage(async ({ conn, mek, from, body, isGroup, isAdmin, isOwner, isBotAdmin, sender }) => {
  const mode = settings.get('antilink');
  if (mode === 'off' || !isGroup || mek.key.fromMe) return;
  if (isAdmin || isOwner || !isBotAdmin) return;
  if (!LINK_RE.test(body)) return;

  await conn.sendMessage(from, { delete: mek.key }).catch(() => {});
  if (mode === 'kick') {
    await conn.groupParticipantsUpdate(from, [sender], 'remove').catch(() => {});
    await conn.sendMessage(from, { text: `🚫 @${num(sender)} was removed for sending a link.`, mentions: [sender] });
  } else {
    await conn.sendMessage(from, { text: `⚠️ @${num(sender)}, links are not allowed here.`, mentions: [sender] });
  }
});

// ---------- anti-delete ----------
const cache = new Map(); // message id → { mek, from, sender, t }
const MAX_CACHE = 500;

onMessage(async ({ conn, mek, message, from, sender, isGroup }) => {
  const mode = settings.get('antidelete');
  if (mode === 'off') return;

  // someone deleted a message
  const proto = message.protocolMessage;
  if (proto && proto.type === 0) {
    const old = cache.get(proto.key?.id);
    if (!old) return;
    cache.delete(proto.key.id);

    const target = mode === 'dm' ? `${num(conn.user.id)}@s.whatsapp.net` : from;
    const header = `🛡 *Deleted message*\n👤 @${num(old.sender)}\n💬 ${isGroup ? 'Group' : 'Private chat'}\n\n`;
    const m = old.message;
    const mentions = [old.sender];

    try {
      const text = m.conversation || m.extendedTextMessage?.text;
      if (text) return void (await conn.sendMessage(target, { text: header + text, mentions }));

      const kind = ['imageMessage', 'videoMessage', 'audioMessage', 'stickerMessage', 'documentMessage'].find((k) => m[k]);
      if (!kind) return;
      const buffer = await downloadMediaMessage({ key: old.key, message: m }, 'buffer', {});
      const field = kind.replace('Message', '');
      const payload = { [field]: buffer, mentions };
      if (['image', 'video', 'document'].includes(field)) payload.caption = header + (m[kind].caption || '');
      if (field === 'document') { payload.mimetype = m[kind].mimetype; payload.fileName = m[kind].fileName; }
      if (field === 'audio') payload.mimetype = m[kind].mimetype || 'audio/mp4';
      await conn.sendMessage(target, payload);
      if (field === 'audio' || field === 'sticker') await conn.sendMessage(target, { text: header, mentions });
    } catch (e) {
      console.error(`[${config.BOT_NAME}] antidelete recovery failed:`, e.message);
    }
    return;
  }

  // otherwise remember the message
  if (mek.key.fromMe) return;
  cache.set(mek.key.id, { key: mek.key, message, from, sender });
  if (cache.size > MAX_CACHE) cache.delete(cache.keys().next().value);
});

const { getContentType } = require('@whiskeysockets/baileys');

const num = (jid) => (jid || '').split('@')[0].split(':')[0];

/** Strip wrappers (ephemeral, view-once, document-with-caption) to get the real message. */
function unwrap(message) {
  let m = message;
  for (let i = 0; i < 4 && m; i++) {
    const inner =
      m.ephemeralMessage?.message ||
      m.viewOnceMessage?.message ||
      m.viewOnceMessageV2?.message ||
      m.documentWithCaptionMessage?.message;
    if (!inner) break;
    m = inner;
  }
  return m;
}

function getBody(message) {
  if (!message) return '';
  return (
    message.conversation ||
    message.extendedTextMessage?.text ||
    message.imageMessage?.caption ||
    message.videoMessage?.caption ||
    message.documentMessage?.caption ||
    message.buttonsResponseMessage?.selectedButtonId ||
    message.listResponseMessage?.singleSelectReply?.selectedRowId ||
    ''
  );
}

/** The message the user replied to, shaped so downloadMediaMessage can use it. */
function getQuoted(mek, message) {
  const type = getContentType(message);
  const ctx = message?.[type]?.contextInfo;
  if (!ctx?.quotedMessage) return null;
  return {
    key: {
      remoteJid: mek.key.remoteJid,
      id: ctx.stanzaId,
      participant: ctx.participant,
      fromMe: false,
    },
    message: unwrap(ctx.quotedMessage),
    sender: ctx.participant,
  };
}

function runtime(seconds) {
  seconds = Math.floor(seconds);
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [d && `${d}d`, h && `${h}h`, m && `${m}m`, `${s}s`].filter(Boolean).join(' ');
}

const LINK_RE = /(https?:\/\/|www\.|chat\.whatsapp\.com\/)\S+/i;

module.exports = { num, unwrap, getBody, getQuoted, runtime, LINK_RE };

const axios = require('axios');
const crypto = require('crypto');
const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const { Sticker, StickerTypes } = require('wa-sticker-formatter');
const { cmd } = require('../lib/registry');
const config = require('../config');

cmd({ pattern: 'sticker', alias: ['s'], desc: 'Image/video → sticker (reply or send with caption)', category: 'tools' },
  async ({ conn, mek, message, quoted, reply }) => {
    const source = quoted?.message?.imageMessage || quoted?.message?.videoMessage
      ? quoted
      : (message.imageMessage || message.videoMessage ? { key: mek.key, message } : null);
    if (!source) return reply('Reply to an image or short video with .sticker');

    const buffer = await downloadMediaMessage(source, 'buffer', {});
    const sticker = new Sticker(buffer, {
      pack: config.STICKER_PACK,
      author: config.STICKER_AUTHOR,
      type: StickerTypes.FULL,
      quality: 60,
    });
    await conn.sendMessage(mek.key.remoteJid, { sticker: await sticker.toBuffer() }, { quoted: mek });
  });

cmd({ pattern: 'weather', desc: 'Weather for a place: .weather Nairobi', category: 'tools' },
  async ({ text, reply }) => {
    if (!text) return reply('Usage: .weather <city>');
    const { data } = await axios.get(`https://wttr.in/${encodeURIComponent(text)}?format=j1`, { timeout: 15000 });
    const c = data.current_condition?.[0];
    if (!c) return reply('Could not find that place.');
    reply(
      `🌤 *Weather in ${text}*\n` +
      `• ${c.weatherDesc?.[0]?.value}\n` +
      `• Temp: ${c.temp_C}°C (feels ${c.FeelsLikeC}°C)\n` +
      `• Humidity: ${c.humidity}%\n` +
      `• Wind: ${c.windspeedKmph} km/h`
    );
  });

cmd({ pattern: 'define', alias: ['dict'], desc: 'Dictionary: .define word', category: 'tools' },
  async ({ text, reply }) => {
    if (!text) return reply('Usage: .define <word>');
    try {
      const { data } = await axios.get(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(text)}`, { timeout: 15000 });
      const m = data[0].meanings[0];
      reply(`📖 *${data[0].word}* (${m.partOfSpeech})\n${m.definitions[0].definition}`);
    } catch {
      reply('No definition found.');
    }
  });

cmd({ pattern: 'password', alias: ['genpass'], desc: 'Generate a strong password: .password 16', category: 'tools' },
  async ({ args, reply }) => {
    const len = Math.min(Math.max(parseInt(args[0]) || 16, 8), 64);
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*?';
    let out = '';
    for (let i = 0; i < len; i++) out += chars[crypto.randomInt(chars.length)];
    reply(`🔐 \`${out}\``);
  });

cmd({ pattern: 'time', desc: 'Current time in the bot timezone', category: 'tools' },
  async ({ reply }) => {
    reply(`🕒 ${new Date().toLocaleString('en-GB', { timeZone: config.TIME_ZONE })} (${config.TIME_ZONE})`);
  });

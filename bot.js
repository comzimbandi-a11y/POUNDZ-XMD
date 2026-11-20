// POUNDZ-XMD BOT - Main Bot File
const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, DisconnectReason } = require('@whiskeysockets/baileys');
const pino = require('pino');
const fs = require('fs');

const OWNER = '263776196948';
const PREFIX = '.';
const BOT_NAME = 'POUNDZ-XMD';

// Attaches the command handler to ONE socket. Called once per session.
function attach(sock){
  sock.ev.on('messages.upsert', async ({messages})=>{
    const m = messages[0];
    if(!m.message || m.key.fromMe) return;
    const from = m.key.remoteJid;
    const body = m.message.conversation || m.message.extendedTextMessage?.text || m.message.imageMessage?.caption || '';
    if(!body.startsWith(PREFIX)) return;
    const cmd = body.slice(1).trim().split(' ')[0].toLowerCase();
    const args = body.slice(1).trim().split(' ').slice(1).join(' ');
    const reply = (text)=> sock.sendMessage(from, {text}, {quoted: m});

    // ===== COMMANDS =====
    if(cmd === 'menu' || cmd === 'help'){
      return reply(`╭─── *${BOT_NAME}* ───╮\n│ 👑 Owner: POUNDZ\n│ ⚡ Prefix: ${PREFIX}\n╰──────────────╯\n\n*GENERAL*\n${PREFIX}menu - Show menu\n${PREFIX}ping - Speed test\n${PREFIX}alive - Bot alive\n${PREFIX}owner - Owner contact\n${PREFIX}repo - Bot repo\n\n*FUN*\n${PREFIX}joke - Random joke\n${PREFIX}quote - Quote\n\n*DOWNLOADER*\n${PREFIX}play <song> - Play song\n${PREFIX}ytmp3 <link>\n${PREFIX}ytmp4 <link>\n\n> POWERED BY POUNDZ-XMD`);
    }
    if(cmd === 'ping'){
      const start = Date.now();
      await reply('Pong! 🏓');
      return reply(`⚡ Speed: ${Date.now()-start}ms\n> ${BOT_NAME}`);
    }
    if(cmd === 'alive'){
      return reply(`✅ *${BOT_NAME} IS ALIVE!*\n\n👑 Owner: POUNDZ\n📱 wa.me/${OWNER}\n⚡ Uptime: ${Math.floor(process.uptime()/60)} mins\n\n> POWERED BY POUNDZ-XMD`);
    }
    if(cmd === 'owner'){
      const vcard = 'BEGIN:VCARD\nVERSION:3.0\nFN:POUNDZ - POUNDZ-XMD Owner\nTEL;type=CELL;type=VOICE;waid='+OWNER+':+'+OWNER+'\nEND:VCARD';
      return sock.sendMessage(from, {contacts:{displayName:'POUNDZ', contacts:[{vcard}]}}, {quoted:m});
    }
    if(cmd === 'repo'){
      return reply(`🌐 *POUNDZ-XMD REPO*\nhttps://github.com/comzimbandi-a11y/POUNDZ-XMD\n\n📢 Channel: https://whatsapp.com/channel/0029Vb6poundz\n👑 Owner: https://wa.me/${OWNER}`);
    }
    if(cmd === 'joke'){
      const jokes = ['Why did the chicken cross the road? To get to POUNDZ-XMD 😂','What do you call a fake noodle? An Impasta!','Why did the scarecrow win an award? He was outstanding!'];
      return reply('😂 '+jokes[Math.floor(Math.random()*jokes.length)]);
    }
    if(cmd === 'quote'){
      return reply('💜 *"Success is not final, failure is not fatal: it is the courage to continue that counts."*\n\n> POUNDZ-XMD');
    }
  });
}

// SESSION_ID env: one or many session ids separated by commas.
// First -> ./auth-bot (same as before), others -> ./auth-bot2, ./auth-bot3 ...
function loadEnvSession(){
  const list = (process.env.SESSION_ID || '').split(',').map(s=>s.trim()).filter(Boolean);
  list.forEach((session, i)=>{
    try{
      const dir = './auth-bot' + (i ? i+1 : '');
      // Only write if missing, otherwise we'd overwrite refreshed creds on every restart
      if(fs.existsSync(dir + '/creds.json')) return;
      const b64 = session.split('~')[1] || session;
      const creds = Buffer.from(b64, 'base64').toString();
      JSON.parse(creds); // validate
      fs.mkdirSync(dir, {recursive:true});
      fs.writeFileSync(dir + '/creds.json', creds);
      console.log('✅ SESSION_ID loaded ->', dir);
    }catch(e){ console.log('Session decode error', e.message); }
  });
}

// Single-session mode (node bot.js). For multi-session run: npm start
async function startBot(){
  loadEnvSession();
  const { state, saveCreds } = await useMultiFileAuthState('./auth-bot');
  const { version } = await fetchLatestBaileysVersion();
  const sock = makeWASocket({
    version,
    logger: pino({level:'silent'}),
    auth: state,
    printQRInTerminal: false,
    browser: [BOT_NAME, 'Chrome', '1.0']
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', (u)=>{
    const { connection, lastDisconnect } = u;
    if(connection === 'open') console.log('✅ POUNDZ-XMD CONNECTED!');
    if(connection === 'close'){
      const reason = lastDisconnect?.error?.output?.statusCode;
      console.log('Disconnected', reason);
      if(reason !== DisconnectReason.loggedOut) startBot();
    }
  });

  attach(sock);
}

module.exports = { attach, loadEnvSession, startBot, BOT_NAME };
if(require.main === module) startBot();

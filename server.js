const express = require('express');
const fs = require('fs');
const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, DisconnectReason } = require('@whiskeysockets/baileys');
const pino = require('pino');
const QRCode = require('qrcode');
const bot = require('./bot');
const app = express();
const OWNER_NUMBER = '263776196948';
const OWNER_NAME = 'POUNDZ';
const BOT_REPO = 'https://github.com/comzimbandi-a11y/POUNDZ-XMD';
const CHANNEL_LINK = 'https://whatsapp.com/channel/0029Vb6poundz';
const HTML = `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>POUNDZ-XMD PAIR</title><style>
*{box-sizing:border-box}body{margin:0;font-family:system-ui;color:#fff;min-height:100vh;background:radial-gradient(circle at 50% 0%,#4a0e6e 0%,#1a0533 35%,#050008 100%)}
.home{position:fixed;top:15px;right:15px;background:rgba(255,255,255,.15);border:1px solid rgba(255,255,255,.3);padding:9px 16px;border-radius:30px;font-size:14px}
.wrap{max-width:420px;margin:0 auto;padding:90px 18px 30px}.card{background:linear-gradient(160deg,rgba(255,255,255,.14),rgba(255,255,255,.04));border:1px solid rgba(255,255,255,.25);border-radius:28px;padding:28px 22px;backdrop-filter:blur(20px)}
.avatar{width:110px;height:110px;border-radius:50%;object-fit:cover;border:3px solid #a855f7;box-shadow:0 0 30px #a855f7;margin:-5px auto 10px;display:block}
h1{font-size:26px;margin:8px 0;color:#e9d5ff;text-align:center}.sub{color:#d8b4fe;font-size:14px;margin-bottom:20px;text-align:center}
.label{text-align:left;font-weight:700;margin:0 0 8px 4px}.inputBox{display:flex;align-items:center;background:rgba(0,0,0,.35);border:1px solid rgba(255,255,255,.2);border-radius:16px;padding:0 14px}.inputBox input{flex:1;background:transparent;border:none;outline:none;color:#fff;padding:16px 10px;font-size:18px}
.tabs{display:flex;gap:8px;margin:16px 0}.tab{flex:1;padding:11px;border-radius:12px;background:rgba(0,0,0,.3);border:1px solid rgba(255,255,255,.2);color:#ddd;cursor:pointer;font-weight:700;text-align:center}.tab.active{background:linear-gradient(90deg,#8b5cf6,#ec4899);color:#fff;border:none}
.btn{width:100%;padding:16px;border:none;border-radius:16px;background:linear-gradient(90deg,#8b5cf6,#ec4899);color:#fff;font-weight:800;font-size:16px;cursor:pointer;margin-top:16px}
#code{font-size:34px;letter-spacing:8px;font-weight:900;margin:16px 0 0;min-height:40px;text-align:center}#timer{text-align:center;color:#f0abfc;font-weight:700;margin-top:6px}
#sessionBox{display:none;background:#000;border:1px solid #a855f7;border-radius:14px;padding:12px;margin-top:16px;text-align:left;word-break:break-all;font-size:11px;max-height:150px;overflow:auto}
#qrImg{width:220px;height:220px;background:#fff;border-radius:14px;display:none;margin:14px auto}
.steps{background:rgba(0,0,0,.3);border-radius:14px;padding:12px;text-align:left;font-size:13px;line-height:1.7;color:#ddd;margin-top:16px}
.copy{width:100%;padding:12px;background:#fff;color:#000;border:none;border-radius:12px;font-weight:800;margin-top:10px;cursor:pointer}
.ownerBox{background:rgba(139,92,246,.2);border:1px solid #8b5cf6;border-radius:14px;padding:12px;margin-top:14px;font-size:13px;text-align:center}
.foot{text-align:center;color:#aaa;font-size:12px;margin-top:18px}
</style></head><body><div class="home">🏠 Home</div><div class="wrap"><div class="card">
<img class="avatar" src="https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=400&q=80">
<h1>POUNDZ-XMD PAIR CODE</h1><div class="sub">Enter your WhatsApp number without the + sign</div>
<div class="tabs"><div class="tab active" id="t1" onclick="show(1)">🔢 PAIR CODE</div><div class="tab" id="t2" onclick="show(2)">📷 QR CODE</div></div>
<div id="pairBox"><div class="label">Phone Number</div><div class="inputBox"><span>📱</span><input id="n" placeholder="263776196948"></div><button class="btn" id="getBtn" onclick="getCode()">🔗 GET CODE</button><div id="code"></div><div id="timer"></div><div id="status" style="font-size:13px;color:#d8b4fe;margin-top:8px;text-align:center"></div><div id="sessionBox"></div><button class="copy" id="copySess" style="display:none" onclick="copySess()">📋 Copy Session ID</button><button class="copy" id="copyBtn" style="display:none" onclick="copyCode()">📋 Copy Pair Code</button><div class="ownerBox">👑 Owner: POUNDZ<br>💬 <a href="https://wa.me/263776196948" style="color:#fff;font-weight:800">Chat Owner - wa.me/263776196948</a></div></div>
<div id="qrBox" style="display:none"><button class="btn" onclick="getQR()">📷 GENERATE QR</button><img id="qrImg"><div id="qrMsg" style="font-size:13px;margin-top:8px;text-align:center"></div></div>
<div class="steps">1. Open WhatsApp > Linked Devices<br>2. Tap Link a Device > Link with phone number<br>3. Enter code above / Scan QR<br>4. Keep page open - TRUE SESSION sent to your WhatsApp</div>
</div><div class="foot">Made with 💜 by POUNDZ-XMD</div></div>
<script>
let cur='',sess='',timerInt=null,secLeft=0;
function show(m){document.getElementById('t1').classList.toggle('active',m==1);document.getElementById('t2').classList.toggle('active',m==2);document.getElementById('pairBox').style.display=m==1?'block':'none';document.getElementById('qrBox').style.display=m==2?'block':'none'}
function doCopy(t){let ta=document.createElement('textarea');ta.value=t;document.body.appendChild(ta);ta.select();try{document.execCommand('copy')}catch(e){}document.body.removeChild(ta);if(navigator.clipboard)navigator.clipboard.writeText(t);alert('✅ Copied!')}
function startTimer(){clearInterval(timerInt);secLeft=120;timerInt=setInterval(()=>{secLeft--;let m=Math.floor(secLeft/60),s=secLeft%60;document.getElementById('timer').innerText='⏳ Valid: '+m+':'+(s<10?'0':'')+s+' - Auto-refreshing...';if(secLeft<=0){clearInterval(timerInt);getCode(true)}},1000)}
async function getCode(r){let n=document.getElementById('n').value;if(!n) return alert('Enter number first');if(!r){document.getElementById('code').innerText='⚡ Connecting...';document.getElementById('status').innerText='Do NOT close page...';document.getElementById('getBtn').innerText='⏳ GENERATING...'}let res=await fetch('/pair?number='+n+'&t='+Date.now());let d=await res.json();if(d.error){document.getElementById('code').innerText='';document.getElementById('status').innerText='❌ '+d.error;document.getElementById('getBtn').innerText='🔗 GET CODE';return}cur=d.code||'';document.getElementById('code').innerText=cur;document.getElementById('getBtn').innerText='🔗 GET CODE';document.getElementById('copyBtn').style.display=cur&&cur.length<10?'block':'none';if(!r){startTimer();checkSession(n)}}
async function checkSession(n){for(let i=0;i<30;i++){await new Promise(r=>setTimeout(r,4000));let r=await fetch('/session?number='+n);let d=await r.json();if(d.session){sess=d.session;clearInterval(timerInt);document.getElementById('timer').innerText='✅ PAIRED!';document.getElementById('status').innerText='✅ TRUE SESSION sent to your WhatsApp';document.getElementById('sessionBox').style.display='block';document.getElementById('sessionBox').innerText=sess;document.getElementById('copySess').style.display='block';break}}}
async function getQR(){document.getElementById('qrMsg').innerText='⏳ Generating...';let r=await fetch('/qr');let d=await r.json();if(d.qr){document.getElementById('qrImg').src=d.qr;document.getElementById('qrImg').style.display='block';document.getElementById('qrMsg').innerText='Scan now - expires in 20s'}else{document.getElementById('qrMsg').innerText=d.error||'Try again'}}
function copyCode(){doCopy(cur)} function copySess(){doCopy(sess)}
</script></body></html>`;
app.get('/',(req,res)=>res.send(HTML));

const PORT = process.env.PORT || 3000;
const MAX_PENDING = 20;
const sessions = {}, socks = {}, pending = new Set();
const authDir = id => './auth-' + id;
const sleep = ms => new Promise(r=>setTimeout(r,ms));

function isLinked(id){
  try{ return !!JSON.parse(fs.readFileSync(authDir(id)+'/creds.json','utf8')).me; }catch(e){ return false; }
}
function buildSession(id){
  return 'POUNDZ-XMD~' + Buffer.from(fs.readFileSync(authDir(id)+'/creds.json','utf8')).toString('base64');
}
function cleanupIfUnpaired(id, sock){
  if(sock.authState.creds.me) return;
  if(socks[id] && socks[id] !== sock) return;
  try{ sock.end(undefined); }catch(e){}
  if(socks[id] === sock) delete socks[id];
  pending.delete(id);
  fs.rmSync(authDir(id), {recursive:true, force:true});
}

// One socket per session id. Every linked session runs its own copy of the bot commands.
async function createSock(id, opts={}){
  if(socks[id]) return socks[id];
  const {state,saveCreds}=await useMultiFileAuthState(authDir(id));
  const {version}=await fetchLatestBaileysVersion();
  const sock=makeWASocket({version,logger:pino({level:'silent'}),auth:state,printQRInTerminal:false,browser:['POUNDZ-XMD','Chrome','1.0'],connectTimeoutMs:10000,keepAliveIntervalMs:10000});
  socks[id]=sock; sock.ev.on('creds.update',saveCreds);
  bot.attach(sock);
  sock.ev.on('connection.update',async(u)=>{
    if(u.qr && opts.onQR) opts.onQR(u.qr);
    if(u.connection==='close'){
      if(socks[id] && socks[id]!==sock) return; // a newer socket already replaced this one
      delete socks[id];
      const reason=u.lastDisconnect?.error?.output?.statusCode;
      if(reason===DisconnectReason.loggedOut){
        console.log('Logged out:',id);
        pending.delete(id); delete sessions[id];
        fs.rmSync(authDir(id),{recursive:true,force:true});
      }else if(state.creds.me && reason!==DisconnectReason.connectionReplaced){
        // includes the restart WhatsApp forces right after pairing (515)
        setTimeout(()=>createSock(id).catch(e=>console.log('reconnect error',id,e.message)),3000);
      }
    }
    if(u.connection==='open'){
      console.log('✅ Session connected:',id);
      if(!pending.has(id)) return;
      pending.delete(id);
      try{
        await sleep(1500);
        const session=buildSession(id);
        const num=sock.user.id.split(':')[0].split('@')[0];
        sessions[num]=session;
        setTimeout(()=>{ delete sessions[num]; },5*60*1000);
        await sock.sendMessage(num+'@s.whatsapp.net',{text:'✅ *POUNDZ-XMD CONNECTED*\n\nYour SESSION ID is below. Keep it private!\n\n> POWERED BY POUNDZ-XMD'});
        await sock.sendMessage(num+'@s.whatsapp.net',{text:session});
      }catch(e){ console.log('session send error',e.message); }
    }
  });
  return sock;
}

app.get('/pair',async(req,res)=>{
  const num=String(req.query.number||'').replace(/\D/g,'');
  if(num.length<8||num.length>15) return res.json({error:'Invalid number. Use country code, no + sign'});
  try{
    if(isLinked(num)) return res.json({error:'This number is already linked'});
    if(pending.size>=MAX_PENDING && !pending.has(num)) return res.json({error:'Server busy, try again in a minute'});
    if(socks[num]){ try{socks[num].end(undefined);}catch(e){} delete socks[num]; }
    fs.rmSync(authDir(num),{recursive:true,force:true});
    pending.add(num);
    const sock=await createSock(num);
    setTimeout(()=>cleanupIfUnpaired(num,sock),3*60*1000);
    await sleep(2000);
    const code=await sock.requestPairingCode(num);
    res.json({code:(code.match(/.{1,4}/g)||[code]).join('-')});
  }catch(e){
    console.log('pair error',e.message);
    pending.delete(num);
    res.json({error:'Could not get code, try again'});
  }
});

app.get('/session',(req,res)=>{
  const num=String(req.query.number||'').replace(/\D/g,'');
  const s=sessions[num];
  if(s) delete sessions[num]; // one-time delivery
  res.json({session:s||null});
});

app.get('/qr',async(req,res)=>{
  const id='qr-'+Date.now().toString(36);
  try{
    if(pending.size>=MAX_PENDING) return res.json({error:'Server busy, try again in a minute'});
    pending.add(id);
    let gotQR; const qrP=new Promise(r=>{gotQR=r});
    const sock=await createSock(id,{onQR:gotQR});
    setTimeout(()=>cleanupIfUnpaired(id,sock),2*60*1000);
    const qr=await Promise.race([qrP,sleep(20000).then(()=>null)]);
    if(!qr){ cleanupIfUnpaired(id,sock); return res.json({error:'Could not generate QR, try again'}); }
    res.json({qr:await QRCode.toDataURL(qr)});
  }catch(e){
    console.log('qr error',e.message);
    pending.delete(id);
    res.json({error:'Could not generate QR, try again'});
  }
});

// On startup, bring back every saved session
async function bootAll(){
  bot.loadEnvSession();
  for(const d of fs.readdirSync('.')){
    if(!d.startsWith('auth-')) continue;
    const id=d.slice(5);
    if(!isLinked(id)){ fs.rmSync(d,{recursive:true,force:true}); continue; } // leftover from an unfinished pairing
    createSock(id).catch(e=>console.log('boot error',id,e.message));
    await sleep(1500);
  }
  console.log('Active sessions:',Object.keys(socks).length);
}

process.on('unhandledRejection',e=>console.log('unhandledRejection',e&&e.message||e));
process.on('uncaughtException',e=>console.log('uncaughtException',e&&e.message||e));

app.listen(PORT,()=>{ console.log('POUNDZ-XMD multi-session server on port',PORT); bootAll(); });

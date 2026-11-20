const express = require('express');
const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const pino = require('pino');
const QRCode = require('qrcode');
const app = express();

const HTML = `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>POUNDZ-XMD PAIR</title><style>
*{box-sizing:border-box}body{margin:0;font-family:system-ui;color:#fff;min-height:100vh;background:radial-gradient(circle at 50% 0%,#4a0e6e 0%,#1a0533 35%,#050008 100%);overflow-x:hidden}
body:before{content:'';position:fixed;inset:0;background-image:radial-gradient(2px 2px at 20% 80%,#fff 50%,transparent),radial-gradient(2px 2px at 80% 20%,#fff 50%,transparent),radial-gradient(1px 1px at 40% 40%,#fff 50%,transparent);opacity:.4}
.home{position:fixed;top:15px;right:15px;background:rgba(255,255,255,.15);border:1px solid rgba(255,255,255,.3);backdrop-filter:blur(10px);padding:9px 16px;border-radius:30px;font-size:14px;z-index:10}
.wrap{max-width:420px;margin:0 auto;padding:90px 18px 30px;position:relative;z-index:1}
.card{background:linear-gradient(160deg,rgba(255,255,255,.14),rgba(255,255,255,.04));border:1px solid rgba(255,255,255,.25);border-radius:28px;padding:28px 22px;backdrop-filter:blur(20px);box-shadow:0 30px 80px rgba(0,0,0,.6)}
.avatar{width:110px;height:110px;border-radius:50%;object-fit:cover;border:3px solid #a855f7;box-shadow:0 0 0 5px rgba(168,85,247,.2),0 0 30px #a855f7;margin:-5px auto 10px;display:block}
h1{font-size:27px;letter-spacing:1px;margin:8px 0;color:#e9d5ff;text-shadow:0 0 20px #a855f7}
.sub{color:#d8b4fe;font-size:15px;margin-bottom:22px}
.label{text-align:left;font-weight:700;margin:0 0 8px 4px;font-size:15px}
.inputBox{display:flex;align-items:center;background:rgba(0,0,0,.35);border:1px solid rgba(255,255,255,.2);border-radius:16px;padding:0 14px}
.inputBox span{font-size:20px}.inputBox input{flex:1;background:transparent;border:none;outline:none;color:#fff;padding:16px 10px;font-size:18px;text-align:left}
.tabs{display:flex;gap:8px;margin:16px 0}.tab{flex:1;padding:11px;border-radius:12px;background:rgba(0,0,0,.3);border:1px solid rgba(255,255,255,.2);color:#ddd;cursor:pointer;font-weight:700}.tab.active{background:linear-gradient(90deg,#8b5cf6,#ec4899);color:#fff;border:none}
.btn{width:100%;padding:16px;border:none;border-radius:16px;background:linear-gradient(90deg,#8b5cf6,#ec4899);color:#fff;font-weight:800;font-size:16px;cursor:pointer;margin-top:16px;box-shadow:0 10px 30px rgba(236,72,153,.4)}
#code{font-size:34px;letter-spacing:10px;font-weight:900;color:#fff;margin:18px 0 0;min-height:40px;text-shadow:0 0 20px #ec4899}
#qrImg{width:220px;height:220px;background:#fff;border-radius:14px;display:none;margin:14px auto}
.steps{background:rgba(0,0,0,.3);border-radius:14px;padding:12px;text-align:left;font-size:13px;line-height:1.7;color:#ddd;margin-top:16px}
.copy{padding:9px 18px;background:#fff;color:#000;border:none;border-radius:10px;font-weight:700;margin-top:10px}
.foot{text-align:center;color:#aaa;font-size:12px;margin-top:18px}
</style></head><body>
<div class="home">🏠 Home</div>
<div class="wrap"><div class="card">
<img class="avatar" src="https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=400&q=80">
<h1>POUNDZ-XMD PAIR CODE</h1><div class="sub">Enter your WhatsApp number without the + sign</div>
<div class="tabs"><div class="tab active" id="t1" onclick="show(1)">🔢 PAIR CODE</div><div class="tab" id="t2" onclick="show(2)">📷 QR CODE</div></div>
<div id="pairBox"><div class="label">Phone Number</div><div class="inputBox"><span>📱</span><input id="n" placeholder="263717773056" value="263717773056"></div><button class="btn" onclick="getCode()">🔗 GET CODE</button><div id="code"></div><button class="copy" id="copyBtn" style="display:none" onclick="copy()">📋 Copy Code</button></div>
<div id="qrBox" style="display:none"><button class="btn" onclick="getQR()">📷 GENERATE QR</button><img id="qrImg"><div id="qrMsg" style="font-size:13px;color:#ddd;margin-top:8px"></div></div>
<div class="steps">1. Open WhatsApp > Linked Devices<br>2. Tap Link a Device > Link with phone number<br>3. Enter code above / Scan QR</div>
</div><div class="foot">Made with 💜 by POUNDZ-XMD</div></div>
<script>
let cur='';
function show(m){document.getElementById('t1').classList.toggle('active',m==1);document.getElementById('t2').classList.toggle('active',m==2);document.getElementById('pairBox').style.display=m==1?'block':'none';document.getElementById('qrBox').style.display=m==2?'block':'none'}
async function getCode(){let n=document.getElementById('n').value;document.getElementById('code').innerText='⏳ Connecting...';let r=await fetch('/pair?number='+n);let d=await r.json();cur=d.code||'';document.getElementById('code').innerText=cur;document.getElementById('copyBtn').style.display=cur&&cur.length<10?'inline-block':'none'}
async function getQR(){document.getElementById('qrMsg').innerText='⏳ Generating...';let r=await fetch('/qr');let d=await r.json();if(d.qr){document.getElementById('qrImg').src=d.qr;document.getElementById('qrImg').style.display='block';document.getElementById('qrMsg').innerText='Scan now - expires in 20s'}else{document.getElementById('qrMsg').innerText=d.error||'Try again'}}
function copy(){navigator.clipboard.writeText(cur);alert('Copied: '+cur)}
</script></body></html>`;

app.get('/', (req,res)=> res.send(HTML));
async function createSock(id){
  const {state, saveCreds} = await useMultiFileAuthState('./auth-'+id);
  const {version} = await fetchLatestBaileysVersion();
  const sock = makeWASocket({version, logger: pino({level:'silent'}), auth: state, printQRInTerminal:false, browser:['POUNDZ-XMD','Chrome','1.0']});
  sock.ev.on('creds.update', saveCreds);
  return sock;
}
app.get('/pair', async (req,res)=>{
  let num = (req.query.number||'').replace(/[^0-9]/g,'');
  if(!num) return res.json({code:'Enter number'});
  try{
    const sock = await createSock(num);
    await new Promise(r=>setTimeout(r,5000));
    const code = await sock.requestPairingCode(num);
    res.json({code});
    setTimeout(()=>{try{sock.end()}catch(e){}},15000);
  }catch(e){ res.json({code:'Error - Retry'}); }
});
app.get('/qr', async (req,res)=>{
  try{
    const id = 'qr-'+Date.now();
    const sock = await createSock(id);
    sock.ev.on('connection.update', async (u)=>{
      if(u.qr){ const img = await QRCode.toDataURL(u.qr); res.json({qr:img}); setTimeout(()=>{try{sock.end()}catch(e){}},25000); }
    });
    setTimeout(()=>{ if(!res.headersSent) res.json({error:'Timeout - Tap again'}); },20000);
  }catch(e){ res.json({error:e.message}); }
});
const PORT = process.env.PORT || 3000;
app.listen(PORT,'0.0.0.0',()=>console.log('ready '+PORT));

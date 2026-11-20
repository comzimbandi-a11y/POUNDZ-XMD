const express = require('express');
const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const pino = require('pino');
const QRCode = require('qrcode');
const app = express();

const HTML = `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>POUNDZ-XMD</title><style>
*{box-sizing:border-box}body{margin:0;background:#050505;color:#fff;font-family:system-ui;text-align:center;min-height:100vh;background:radial-gradient(circle at 50% 0%,#1a3a25 0%,#050505 60%)}
.logo{font-size:42px;margin:35px 0 0}h1{color:#25D366;font-size:30px;letter-spacing:2px;margin:5px 0}p{color:#aaa;font-size:14px}
.card{background:#111;border:1px solid #222;border-radius:20px;max-width:380px;margin:20px auto;padding:22px;box-shadow:0 20px 60px rgba(0,0,0,.6)}
.tabs{display:flex;gap:8px;margin-bottom:18px}.tab{flex:1;padding:12px;border-radius:12px;border:1px solid #222;background:#1a1a1a;color:#aaa;cursor:pointer;font-weight:700}.tab.active{background:#25D366;color:#000;border-color:#25D366}
input{width:100%;padding:15px;border-radius:12px;border:1px solid #333;background:#000;color:#fff;text-align:center;font-size:17px;outline:none}
button.main{width:100%;padding:15px;border:none;border-radius:12px;background:#25D366;color:#000;font-weight:800;font-size:16px;margin-top:12px;cursor:pointer}
#code{font-size:32px;letter-spacing:8px;font-weight:900;color:#25D366;margin:15px 0;min-height:40px}
#qrImg{width:230px;height:230px;background:#fff;border-radius:12px;display:none;margin:10px auto}
.small{font-size:12px;color:#888;line-height:1.6}.step{background:#1a1a1a;border-radius:12px;padding:10px;text-align:left;font-size:13px;margin-top:12px;color:#ccc}
.copy{padding:8px 15px;background:#222;color:#fff;border:1px solid #333;border-radius:8px;margin-top:5px}
</style></head><body>
<div class="logo">💚</div><h1>POUNDZ-XMD</h1><p>Fast & Secure WhatsApp Pairing</p>
<div class="card">
<div class="tabs"><div class="tab active" id="t1" onclick="show(1)">🔢 PAIR CODE</div><div class="tab" id="t2" onclick="show(2)">📷 QR CODE</div></div>
<div id="pairBox"><input id="n" placeholder="263717773056" value="263717773056"><button class="main" onclick="getCode()">GET PAIR CODE →</button><div id="code"></div><button class="copy" id="copyBtn" style="display:none" onclick="copy()">📋 Copy Code</button><div class="step">1. Open WhatsApp > Linked Devices<br>2. Tap Link a Device > Link with phone number<br>3. Enter code above</div></div>
<div id="qrBox" style="display:none"><button class="main" onclick="getQR()">GENERATE QR →</button><img id="qrImg"><div class="small" id="qrMsg"></div><div class="step">1. Open WhatsApp > Linked Devices<br>2. Tap Link a Device<br>3. Scan QR above</div></div>
</div><p class="small">Made with 💚 by POUNDZ-XMD • v2.0</p>
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
  }catch(e){ res.json({code:'Error: '+e.message+' - Retry'}); }
});

app.get('/qr', async (req,res)=>{
  try{
    const id = 'qr-'+Date.now();
    const sock = await createSock(id);
    sock.ev.on('connection.update', async (u)=>{
      if(u.qr){
        const img = await QRCode.toDataURL(u.qr);
        res.json({qr:img});
        setTimeout(()=>{try{sock.end()}catch(e){}},25000);
      }
    });
    setTimeout(()=>{ if(!res.headersSent) res.json({error:'Timeout - Tap again'}); },20000);
  }catch(e){ res.json({error:e.message}); }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT,'0.0.0.0',()=>console.log('ready '+PORT));

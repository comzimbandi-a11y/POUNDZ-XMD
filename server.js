const express = require('express');
const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const pino = require('pino');
const app = express();
app.get('/', (req,res)=>{
res.send(`<body style="background:#111;color:white;text-align:center;font-family:sans-serif;padding-top:40px"><h1 style="color:#25D366">POUNDZ-XMD PAIR</h1><input id="n" placeholder="263717773056" style="padding:12px;width:260px;border-radius:10px;border:none;text-align:center"><br><br><button onclick="p()" style="padding:12px 25px;background:#25D366;border:none;border-radius:10px;font-weight:bold">GET CODE</button><h2 id="c"></h2><script>async function p(){let n=document.getElementById('n').value;document.getElementById('c').innerText='Wait...';let r=await fetch('/pair?number='+n);let d=await r.json();document.getElementById('c').innerText='CODE: '+d.code}</script>`);
});
app.get('/pair', async (req,res)=>{
let num=req.query.number.replace(/[^0-9]/g,'');
const {state,saveCreds}=await useMultiFileAuthState('./auth-'+num);
const {version}=await fetchLatestBaileysVersion();
const sock=makeWASocket({version,logger:pino({level:'silent'}),auth:state,printQRInTerminal:false,browser:['POUNDZ-XMD','Chrome','1.0']});
sock.ev.on('creds.update',saveCreds);
setTimeout(async()=>{try{let code=await sock.requestPairingCode(num);res.json({code})}catch(e){res.json({code:e.message})}},4000);
});
const PORT = process.env.PORT || 3000;
app.listen(PORT,'0.0.0.0',()=>console.log('ready on '+PORT));

#!/usr/bin/env node

const http = require('http');
const { spawn, execSync } = require('child_process');

const PORT = 18789;

console.log('╔══════════════════════════════════════════╗');
console.log('║    OpenClaw + LINE 全自動化システム    ║');
console.log('╚══════════════════════════════════════════╝\n');

// Kill existing processes
console.log('🔄 既存プロセスを停止中...');
try { execSync('taskkill /F /IM node.exe', { stdio: 'ignore' }); } catch {}
try { execSync('taskkill /F /IM ssh.exe', { stdio: 'ignore' }); } catch {}
setTimeout(() => {}, 2000);

console.log('🚀 Gatewayを起動中...\n');

// Create proxy server
const server = http.createServer((req, res) => {
  const start = Date.now();
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);

  const options = {
    hostname: '127.0.0.1',
    port: PORT,
    path: req.url,
    method: req.method,
    headers: req.headers
  };

  const proxy = http.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res, { end: true });
    console.log(`  → ${proxyRes.statusCode} (${Date.now() - start}ms)`);
  });

  proxy.on('error', (err) => {
    console.error(`  → Error: ${err.message}`);
    res.writeHead(502);
    res.end('Bad Gateway');
  });

  req.pipe(proxy, { end: true });
});

server.listen(PORT, '127.0.0.1', async () => {
  console.log(`✅ Gateway準備完了: http://127.0.0.1:${PORT}\n`);
  
  // Start tunnel
  console.log('🔗 トンネルを起動中...\n');
  
  const tunnel = spawn('ssh', ['-o', 'StrictHostKeyChecking=no', '-R', `80:127.0.0.1:${PORT}`, 'serveo.net'], {
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: true
  });

  let urlPublished = false;

  tunnel.stdout.on('data', (data) => {
    const output = data.toString();
    showUrl(output);
  });

  tunnel.stderr.on('data', (data) => {
    const output = data.toString();
    showUrl(output);
  });

  function showUrl(output) {
    if (urlPublished) { return; }
    
    const match = output.match(/Forwarding.*https?:\/\/([^\s]+)/);
    if (match) {
      urlPublished = true;
      const url = match[1];
      
      console.log('\n╔══════════════════════════════════════════╗');
      console.log('║         PUBLIC WEBHOOK URL             ║');
      console.log('╚══════════════════════════════════════════╝');
      console.log(`\n   ${url}/line/webhook\n`);
      console.log('📱 LINE Developer Console:\n');
      console.log('   1. https://developers.line.biz/console/');
      console.log(`   2. Webhook URL: ${url}/line/webhook`);
      console.log('   3. Use webhook: ON');
      console.log('   4. Verifyをクリック\n');
      console.log('💬 テスト: LINEでボットにメッセージを送信\n');
      console.log('⌛ まっています...\n');
    }
  }
});

// Check every 10 seconds
setInterval(async () => {
  try {
    await fetch(`http://127.0.0.1:${PORT}/line/webhook`, {
      method: 'OPTIONS',
      headers: { 'Content-Type': 'application/json' }
    });
  } catch {}
}, 10000);

process.on('SIGTERM', () => {
  server.close();
  process.exit(0);
});

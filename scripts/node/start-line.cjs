#!/usr/bin/env node

const http = require('http');
const { spawn } = require('child_process');

const GATEWAY_PORT = 18789;

console.log('========================================');
console.log('  OpenClaw + LINE 全自動化システム');
console.log('========================================\n');

// Kill existing processes
spawn('taskkill', ['/F', '/IM', 'node.exe'], { stdio: 'ignore' });
spawn('taskkill', ['/F', '/IM', 'ssh.exe'], { stdio: 'ignore' });
setTimeout(() => {}, 3000);

console.log('🚀 Gatewayを起動中...');

// Direct gateway with proper headers
const server = http.createServer((req, res) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);

  const options = {
    hostname: '127.0.0.1',
    port: GATEWAY_PORT,
    path: req.url,
    method: req.method,
    headers: {
      ...req.headers,
      'Host': '127.0.0.1',
      'X-Forwarded-For': req.socket.remoteAddress
    }
  };

  const proxy = http.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res, { end: true });
  });

  proxy.on('error', (err) => {
    console.error('Proxy Error:', err.message);
    res.writeHead(502);
    res.end('Bad Gateway: ' + err.message);
  });

  req.pipe(proxy, { end: true });
});

server.listen(GATEWAY_PORT, '127.0.0.1', () => {
  console.log(`✅ Gateway起動完了`);
  console.log(`📡 http://127.0.0.1:${GATEWAY_PORT}\n`);
});

// Simple SSH tunnel
console.log('🔗 トンネルを起動中...\n');

const tunnel = spawn('ssh', ['-o', 'StrictHostKeyChecking=no', '-R', `80:127.0.0.1:${GATEWAY_PORT}`, 'serveo.net'], {
  stdio: ['ignore', 'pipe', 'pipe'],
  detached: true
});

let tunnelReady = false;

tunnel.stdout.on('data', (data) => {
  const output = data.toString();
  console.log(output.trim());
  showUrl(output);
});

tunnel.stderr.on('data', (data) => {
  const output = data.toString();
  console.log(output.trim());
  showUrl(output);
});

function showUrl(output) {
  if (tunnelReady) { return; }
  
  const match = output.match(/Forwarding.*https?:\/\/([^\s\n]+)/);
  if (match) {
    tunnelReady = true;
    const url = match[1];
    
    console.log('\n╔══════════════════════════════════════════╗');
    console.log('║         PUBLIC WEBHOOK URL              ║');
    console.log('╚══════════════════════════════════════════╝');
    console.log(`\n   ${url}/line/webhook\n`);
    console.log('📱 LINE Developer Console設定:');
    console.log('   1. https://developers.line.biz/console/');
    console.log('   2. Webhook URL: ' + url + '/line/webhook');
    console.log('   3. Use webhook: ON');
    console.log('   4. Verifyをクリック\n');
    console.log('💬 テスト: LINEでボットにメッセージを送信\n');
  }
}

// Keep alive
setInterval(() => {}, 10000);

process.on('SIGTERM', () => {
  process.kill(-tunnel.pid);
  server.close();
  process.exit(0);
});

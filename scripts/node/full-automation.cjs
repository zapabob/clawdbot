#!/usr/bin/env node

const http = require('http');
const { spawn } = require('child_process');

const GATEWAY_PORT = 18789;
const TUNNEL_PORT = 18791;

console.log('🚀 Starting Gateway...');

const gateway = spawn('node', ['openclaw.mjs', 'gateway', '--port', GATEWAY_PORT.toString(), '--tailscale', 'serve'], {
  stdio: 'pipe',
  detached: true
});

gateway.stdout.on('data', (d) => { if (d.toString().trim()) console.log(d.toString().trim()); });
gateway.stderr.on('data', (d) => { if (d.toString().trim()) console.log(d.toString().trim()); });

setTimeout(() => {
  console.log('✅ Gateway started\n');
  startProxy();
}, 5000);

function startProxy() {
  const server = http.createServer((req, res) => {
    const options = {
      hostname: '127.0.0.1',
      port: GATEWAY_PORT,
      path: req.url,
      method: req.method,
      headers: req.headers
    };

    const proxy = http.request(options, (proxyRes) => {
      res.writeHead(proxyRes.statusCode, proxyRes.headers);
      proxyRes.pipe(res, { end: true });
    });

    proxy.on('error', (err) => {
      res.writeHead(502);
      res.end('Bad Gateway');
    });

    req.pipe(proxy, { end: true });
  });

  server.listen(TUNNEL_PORT, '0.0.0.0', () => {
    console.log(`╔══════════════════════════════════════════╗`);
    console.log(`║     OpenClaw LINE Automation Ready       ║`);
    console.log(`╚══════════════════════════════════════════╝`);
    console.log('');
    console.log(`🔗 Starting tunnel...\n`);

    const tunnel = spawn('ssh', ['-o', 'StrictHostKeyChecking=no', `-R80:127.0.0.1:${TUNNEL_PORT}`, 'serveo.net'], {
      stdio: ['pipe', 'pipe', 'pipe'],
      detached: true
    });

    tunnel.stdout.on('data', (d) => { handleTunnelOutput(d.toString()); });
    tunnel.stderr.on('data', (d) => { handleTunnelOutput(d.toString()); });
  });
}

function handleTunnelOutput(output) {
  console.log(output.trim());
  
  const match = output.match(/Forwarding.*https?:\/\/([^\s]+)/);
  if (match) {
    const url = match[1];
    console.log('');
    console.log(`╔══════════════════════════════════════════╗`);
    console.log(`║         PUBLIC WEBHOOK URL               ║`);
    console.log(`╚══════════════════════════════════════════╝`);
    console.log(`   https://${url}/line/webhook`);
    console.log('');
    console.log(`📱 LINE Developer Console:`);
    console.log(`   1. https://developers.line.biz/console/`);
    console.log(`   2. Webhook URL: https://${url}/line/webhook`);
    console.log(`   3. Use webhook: ON -> Verify`);
    console.log('');
  }
}

process.on('SIGTERM', () => {
  process.kill(-gateway.pid);
  process.exit(0);
});

#!/usr/bin/env node
import http from 'http';
import net from 'net';

// Configuration
const GATEWAY_PORT = 18789;
const TUNNEL_PORT = 18791;

// Start Gateway
console.log('🚀 Starting Gateway...');
const gateway = spawn('node', ['openclaw.mjs', 'gateway', '--port', GATEWAY_PORT.toString(), '--tailscale', 'serve'], {
  stdio: 'pipe',
  detached: true
});

gateway.stdout.on('data', (d) => {
  const msg = d.toString().trim();
  if (msg) console.log(msg);
});

gateway.stderr.on('data', (d) => {
  const msg = d.toString().trim();
  if (msg) console.log(msg);
});

// Wait for gateway
await new Promise(r => setTimeout(r, 5000));

// Check gateway
try {
  await fetch(`http://127.0.0.1:${GATEWAY_PORT}`);
  console.log('✅ Gateway ready\n');
} catch (e) {
  console.log('⚠️ Gateway check failed, continuing...\n');
}

// Create simple HTTP proxy
const server = http.createServer((req, res) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  
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
    console.error('Proxy error:', err.message);
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
  console.log(`📡 Local proxy: http://127.0.0.1:${TUNNEL_PORT}`);
  console.log(`🔗 Test URL:     http://127.0.0.1:${TUNNEL_PORT}/line/webhook`);
  console.log('');
  console.log(`💡 Use with tunnel:`);
  console.log(`   ssh -R 80:127.0.0.1:${TUNNEL_PORT} serveo.net`);
  console.log('');
  console.log(`Press Ctrl+C to stop\n`);
});

// Start tunnel
console.log('🔗 Starting tunnel (Serveo)...');
const tunnel = spawn('ssh', ['-o', 'StrictHostKeyChecking=no', '-R', `80:127.0.0.1:${TUNNEL_PORT}`, 'serveo.net'], {
  stdio: ['pipe', 'pipe', 'pipe'],
  detached: true
});

tunnel.stdout.on('data', (d) => {
  const output = d.toString();
  console.log(output.trim());
});

tunnel.stderr.on('data', (d) => {
  const output = d.toString();
  console.log(output.trim());
  
  // Extract URL
  const match = output.match(/Forwarding.*https?:\/\/([^\s]+)/);
  if (match) {
    const url = match[1];
    console.log('');
    console.log(`╔══════════════════════════════════════════╗`);
    console.log(`║         PUBLIC WEBHOOK URL               ║`);
    console.log(`╚══════════════════════════════════════════╝`);
    console.log('');
    console.log(`   https://${url}/line/webhook`);
    console.log('');
    console.log(`📱 LINE Developer Console:`);
    console.log(`   1. https://developers.line.biz/console/`);
    console.log(`   2. Webhook URL: https://${url}/line/webhook`);
    console.log(`   3. Use webhook: ON`);
    console.log('');
  }
});

// Keep alive
process.on('SIGTERM', () => {
  process.kill(-gateway.pid);
  process.kill(-tunnel.pid);
  server.close();
  process.exit(0);
});

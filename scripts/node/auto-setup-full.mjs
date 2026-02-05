#!/usr/bin/env node

import { spawn } from 'child_process';
import https from 'https';
import http from 'http';
import fs from 'fs';

const TUNNEL_SCRIPT = `
// Simple localhost tunnel using remote.moe
const net = require('net');
const http = require('http');

const HOST = '0.0.0.0';
const PORT = 18789;
const TUNNEL_HOST = 'remote.moe';
const TUNNEL_PORT = 443;

console.log('Starting tunnel to remote.moe...');

const socket = net.connect(TUNNEL_PORT, TUNNEL_HOST, () => {
  console.log('Connected to tunnel server');
  
  // Register as HTTP tunnel
  const req = Buffer.from('CONNECT localhost:18789 HTTP/1.1\\r\\nHost: localhost:18789\\r\\n\\r\\n');
  socket.write(req);
  
  // Read response
  socket.once('data', (data) => {
    if (data.toString().includes('200')) {
      setupTunnel();
    }
  });
});

function setupTunnel() {
  const server = http.createServer((req, res) => {
    // Forward to local Gateway
    const options = {
      hostname: 'localhost',
      port: 18789,
      path: req.url,
      method: req.method,
      headers: req.headers
    };
    
    const proxy = http.request(options, (proxyRes) => {
      res.writeHead(proxyRes.statusCode, proxyRes.headers);
      proxyRes.pipe(res);
    });
    
    req.pipe(proxy);
  });
  
  server.listen(18790, HOST, () => {
    console.log('Tunnel ready on port 18790');
  });
}

socket.on('error', (err) => {
  console.error('Tunnel error:', err.message);
});
`;

async function startGateway() {
  console.log('🚀 Starting Gateway...');
  
  const gateway = spawn('node', ['openclaw.mjs', 'gateway', '--port', '18789', '--tailscale', 'serve'], {
    stdio: 'pipe'
  });
  
  gateway.stdout.on('data', (d) => console.log(d.toString().trim()));
  gateway.stderr.on('data', (d) => console.log(d.toString().trim()));
  
  await new Promise(r => setTimeout(r, 5000));
  
  // Check if running
  try {
    await fetch('http://127.0.0.1:18789');
    console.log('✅ Gateway running');
    return true;
  } catch {
    console.log('⚠️ Gateway not responding');
    return false;
  }
}

async function getTunnelUrl() {
  return new Promise((resolve) => {
    console.log('🔗 Getting public URL via Serveo...');
    
    const proc = spawn('ssh', ['-o', 'StrictHostKeyChecking=no', '-R', '80:localhost:18789', 'serveo.net'], {
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    let url = null;
    let resolved = false;
    
    const timeout = setTimeout(() => {
      if (!resolved) {
        console.log('⚠️ Tunnel timeout, trying alternate method...');
        resolve({ url: null, proc: null });
      }
    }, 30000);
    
    proc.stdout.on('data', (data) => {
      const output = data.toString();
      console.log(output.trim());
      
      const match = output.match(/Forwarding HTTP traffic from https?:\/\/([^\s]+)/);
      if (match) {
        url = match[1];
        resolved = true;
        clearTimeout(timeout);
        console.log(`\n✅ Public URL: https://${url}`);
        resolve({ url: `https://${url}`, proc });
      }
    });
    
    proc.stderr.on('data', (data) => {
      const output = data.toString();
      console.log(output.trim());
      
      const match = output.match(/Forwarding HTTP traffic from https?:\/\/([^\s]+)/);
      if (match && !resolved) {
        url = match[1];
        resolved = true;
        clearTimeout(timeout);
        console.log(`\n✅ Public URL: https://${url}`);
        resolve({ url: `https://${url}`, proc });
      }
    });
  });
}

async function main() {
  console.log('========================================');
  console.log('  OpenClaw + LINE 全自動化システム');
  console.log('========================================\n');
  
  // 1. Start Gateway
  await startGateway();
  
  // 2. Get public URL
  const { url: publicUrl, proc: tunnelProc } = await getTunnelUrl();
  
  console.log('\n========================================');
  console.log('  自動化完了！');
  console.log('========================================\n');
  
  if (publicUrl) {
    console.log(`📡 Webhook URL:`);
    console.log(`   ${publicUrl}/line/webhook\n`);
    
    console.log('📱 LINE Developer Console設定:');
    console.log('   1. https://developers.line.biz/console/ にアクセス');
    console.log('   2. Messaging API設定 → Webhook URL');
    console.log(`   3. ${publicUrl}/line/webhook を設定`);
    console.log('   4. Use webhook: ON');
    console.log('   5. Verifyをクリック\n');
    
    console.log('💬 テスト:');
    console.log('   LINEでボットにメッセージを送信');
    console.log('   ペアリングコードを承認\n');
  } else {
    console.log('⚠️ 公開URL取得失敗');
    console.log('   次のいずれかを実行してください:');
    console.log('   - npx localtunnel --port 18789');
    console.log('   - .tunnel\\cloudflared.exe tunnel --url http://localhost:18789\n');
  }
  
  console.log('========================================');
  console.log('Press Ctrl+C to stop\n');
}

main().catch(console.error);

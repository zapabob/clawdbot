#!/usr/bin/env node

import { spawn } from 'child_process';
import http from 'http';

const GATEWAY_PORT = 18789;
const TUNNEL_PORT = 18790;

// Create proxy server
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

  req.pipe(proxy, { end: true });
});

server.listen(TUNNEL_PORT, '127.0.0.1', () => {
  console.log(`✅ Proxy server ready on port ${TUNNEL_PORT}`);
  console.log(`📡 Forwarding to localhost:${GATEWAY_PORT}`);
});

// Keep process alive
process.on('SIGTERM', () => {
  server.close();
  process.exit(0);
});

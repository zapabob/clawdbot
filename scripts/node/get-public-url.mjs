import https from 'https';

const tunnel = {
  host: 'localtunnel.me',
  port: 443,
  path: '/subdomain/clawdbot-' + Date.now()
};

const req = https.request({
  hostname: tunnel.host,
  port: tunnel.port,
  path: tunnel.path,
  method: 'GET'
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('\n========================================');
    console.log('✅ 公開URL:');
    console.log('========================================');
    console.log(data + '/line/webhook');
    console.log('========================================\n');
    console.log('このURLをLINE Developer Consoleに設定してください\n');
  });
});

req.on('error', (e) => {
  console.log('エラー:', e.message);
  console.log('\n代替方法:');
  console.log('npx localtunnel --port 18789');
});

req.end();

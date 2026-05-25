const http = require('http');
const data = JSON.stringify({ title: 'Como cuidar do seu spitz', excerpt: 'Dicas práticas para filhotes.' });

const opts = { hostname: 'localhost', port: 3000, path: '/api/admin/blog/seo-suggestions', method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': data.length } };

const req = http.request(opts, (res) => {
  let body = '';
  res.on('data', (c) => body += c.toString());
  res.on('end', () => { console.log('status', res.statusCode); console.log(body); });
});
req.on('error', (e) => console.error('error', e));
req.write(data); req.end();

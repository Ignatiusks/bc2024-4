const http = require('http');
const fs = require('fs').promises;
const { Command } = require('commander');
const path = require('path');
const program = new Command();

program
.requiredOption('-h, --host <host>', 'адреса сервера')
.requiredOption('-p, --port <port>', 'порт сервера')
.requiredOption('-c, --cache <cache>', 'шлях до директорії з кешем');

program.parse(process.argv);

const options = program.opts();
const cacheDir = options.cache;

const server = http.createServer(async (req, res) => {
const urlParts = req.url.split('/');
const httpCode = urlParts[1];

if (!httpCode) {
res.writeHead(400, { 'Content-Type': 'text/plain' });
res.end('Bad Request');
return;
}
const filePath = path.join(cacheDir, `${httpCode}.jpg`);
switch (req.method) {
case 'GET':
try {
const data = await f.readFile(filePath);
res.writeHead(200, { 'Content-Type': 'image/jpeg' });
res.end(data);}
catch (err) {
res.writeHead(404, { 'Content-Type': 'text/plain' });
res.end('Not Found');
}
break;

case 'PUT':
let body = [];
req.on('data', chunk => {
body.push(chunk);
}).on('end', async () => {
body = Buffer.concat(body);
try {
await fs.writeFile(filePath, body);
res.writeHead(201, { 'Content-Type': 'text/plain' });
res.end('Created');
} catch (err) {
res.writeHead(500, { 'Content-Type': 'text/plain' });
res.end('Internal Server Error');
}
});
break;

case 'DELETE':
try {
await fs.unlink(filePath);
res.writeHead(200, { 'Content-Type': 'text/plain' });
res.end('OK');
} catch (err) {
res.writeHead(404, { 'Content-Type': 'text/plain' });
res.end('Not Found');
}
break;
default:
res.writeHead(405, { 'Content-Type': 'text/plain' });
res.end('Method Not Allowed');
break;
  }
});

server.listen(options.port, options.host, () => {
  console.log(`Сервер запущено на http://${options.host}:${options.port}`);
});

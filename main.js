const http = require('http');
const fs = require('fs').promises;
const { Command } = require('commander');
const path = require('path');
const superagent = require('superagent'); 
const program = new Command();

program
  .requiredOption('-h, --host <host>', 'адрес сервера')
  .requiredOption('-p, --port <port>', 'порт сервера')
  .requiredOption('-c, --cache <cache>', 'путь к директории с кешем');

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
      console.log(`GET запит на httpCode: ${httpCode}`);
      try {
        const data = await fs.readFile(filePath);
        console.log('Файл знайдено в кеші');
        res.writeHead(200, { 'Content-Type': 'image/jpeg' });
        res.end(data);
      } catch (err) {
        console.log('Файл не знайдено в кеші, виконується запит до http.cat');
        try {
          const response = await superagent.get(`https://http.cat/${httpCode}`);
          const image = response.body;
          await fs.writeFile(filePath, image);
          console.log('Файл успішно завантажено та збережено в кеші');
          res.writeHead(200, { 'Content-Type': 'image/jpeg' });
          res.end(image);
        } catch (error) {
          console.error('Помилка запиту до http.cat', error.message);
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('Not Found');
        }
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


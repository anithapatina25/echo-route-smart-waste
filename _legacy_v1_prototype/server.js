// server.js - Central HTTP server and static file provider for ECHO ROUTE SMART WASTE
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { initSchema, UPLOADS_DIR } = require('./db.js');
const { handleApiRequest } = require('./api.js');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');

// MIME types dictionary
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2'
};

// Initialize SQLite Schema & Seed demo data
initSchema();

const server = http.createServer(async (req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;

  // 1. API Routes
  if (pathname.startsWith('/api/')) {
    return handleApiRequest(req, res, pathname);
  }

  // 2. Uploaded Files (/uploads/...)
  if (pathname.startsWith('/uploads/')) {
    const filename = path.basename(pathname);
    const filePath = path.join(UPLOADS_DIR, filename);
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': contentType, 'Cache-Control': 'public, max-age=86400' });
      return fs.createReadStream(filePath).pipe(res);
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      return res.end('File not found');
    }
  }

  // 3. Static Assets from public/
  let requestedFile = path.normalize(path.join(PUBLIC_DIR, pathname));

  // Security: prevent path traversal out of PUBLIC_DIR
  if (!requestedFile.startsWith(PUBLIC_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    return res.end('Forbidden');
  }

  if (fs.existsSync(requestedFile) && fs.statSync(requestedFile).isFile()) {
    const ext = path.extname(requestedFile).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    return fs.createReadStream(requestedFile).pipe(res);
  }

  // 4. SPA Fallback: Serve public/index.html for any frontend route
  const indexPath = path.join(PUBLIC_DIR, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    return fs.createReadStream(indexPath).pipe(res);
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found');
});

server.listen(PORT, () => {
  console.log(`\n=============================================================`);
  console.log(`  ECHO ROUTE SMART WASTE - Gram Panchayat Waste Portal`);
  console.log(`  Server running at: http://localhost:${PORT}`);
  console.log(`  Database: SQLite (native node:sqlite)`);
  console.log(`=============================================================\n`);
});

module.exports = server;

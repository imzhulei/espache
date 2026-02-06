const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data', 'content.json');
const PUBLIC_DIR = path.join(__dirname, 'public');
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'espache-admin-2026';

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg'
};

function readData() {
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
}

function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

function sendJson(res, status, payload) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload));
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
      if (raw.length > 1e6) {
        reject(new Error('请求体过大'));
      }
    });
    req.on('end', () => {
      if (!raw) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(raw));
      } catch (error) {
        reject(new Error('无效的 JSON'));
      }
    });
  });
}

function authorize(req) {
  const token = req.headers.authorization || '';
  return token === `Bearer ${ADMIN_TOKEN}`;
}

function serveFile(res, pathname) {
  const normalizedPath = pathname === '/' ? '/index.html' : pathname;
  const filePath = path.join(PUBLIC_DIR, normalizedPath);

  if (!filePath.startsWith(PUBLIC_DIR)) {
    sendJson(res, 403, { message: '禁止访问' });
    return;
  }

  fs.readFile(filePath, (error, content) => {
    if (error) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('页面不存在');
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
    res.end(content);
  });
}

async function handleApi(req, res, pathname) {
  const method = req.method || 'GET';
  const data = readData();

  if (pathname === '/api/public/content' && method === 'GET') {
    const { messages, ...publicData } = data;
    sendJson(res, 200, publicData);
    return;
  }

  if (pathname === '/api/public/message' && method === 'POST') {
    try {
      const body = await parseBody(req);
      if (!body.name || !body.phone || !body.company || !body.requirement) {
        sendJson(res, 400, { message: '请完整填写咨询信息' });
        return;
      }
      const id = Date.now();
      data.messages.unshift({ id, ...body, createdAt: new Date().toISOString() });
      writeData(data);
      sendJson(res, 201, { message: '提交成功，我们将尽快联系您。' });
    } catch (error) {
      sendJson(res, 400, { message: error.message });
    }
    return;
  }

  if (!authorize(req)) {
    sendJson(res, 401, { message: '未授权，请先登录后台' });
    return;
  }

  if (pathname === '/api/admin/login' && method === 'POST') {
    sendJson(res, 200, { token: ADMIN_TOKEN });
    return;
  }

  if (pathname === '/api/admin/content' && method === 'GET') {
    sendJson(res, 200, data);
    return;
  }

  if (pathname === '/api/admin/site' && method === 'PUT') {
    try {
      const body = await parseBody(req);
      data.site = {
        ...data.site,
        ...body
      };
      writeData(data);
      sendJson(res, 200, { message: '站点信息已更新', site: data.site });
    } catch (error) {
      sendJson(res, 400, { message: error.message });
    }
    return;
  }

  if (pathname === '/api/admin/news' && method === 'POST') {
    try {
      const body = await parseBody(req);
      if (!body.title || !body.summary || !body.date) {
        sendJson(res, 400, { message: '请填写完整的新闻信息' });
        return;
      }
      const id = Date.now();
      data.news.unshift({ id, title: body.title, summary: body.summary, date: body.date });
      writeData(data);
      sendJson(res, 201, { message: '新闻已新增', item: data.news[0] });
    } catch (error) {
      sendJson(res, 400, { message: error.message });
    }
    return;
  }

  if (pathname.startsWith('/api/admin/news/') && method === 'DELETE') {
    const id = Number(pathname.split('/').pop());
    const nextNews = data.news.filter((item) => item.id !== id);
    if (nextNews.length === data.news.length) {
      sendJson(res, 404, { message: '未找到对应新闻' });
      return;
    }
    data.news = nextNews;
    writeData(data);
    sendJson(res, 200, { message: '新闻已删除' });
    return;
  }

  sendJson(res, 404, { message: '接口不存在' });
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
  const pathname = decodeURIComponent(parsedUrl.pathname);

  if (pathname.startsWith('/api/')) {
    await handleApi(req, res, pathname);
    return;
  }

  if (pathname === '/admin') {
    serveFile(res, '/admin/index.html');
    return;
  }

  serveFile(res, pathname);
});

server.listen(PORT, () => {
  console.log(`服务已启动：http://localhost:${PORT}`);
  console.log(`后台登录 token：${ADMIN_TOKEN}`);
});

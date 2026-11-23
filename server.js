const http = require('node:http');

const PORT = 3000;
const STATUS_VALIDOS = ['pendente', 'pronto', 'cancelado'];
const MAX_BODY = 1024 * 1024; // 1 MB

// "Banco de dados" em memória
let orders = [];
let nextId = 1;

// Envia resposta JSON com os headers corretos
function sendJson(res, statusCode, data, extraHeaders = {}) {
  const body = JSON.stringify(data);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    ...extraHeaders,
  });
  res.end(body);
}

// Resposta padrão para qualquer rota/verbo não previsto
function notFound(res, message = 'Rota não encontrada') {
  sendJson(res, 404, { error: message });
}

// Lê o body via eventos de stream (data / end)
function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    let tooBig = false;

    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY) { tooBig = true; return; }
      chunks.push(chunk);
    });

    req.on('end', () => {
      if (tooBig) return reject({ status: 413, message: 'Body grande demais' });
      const raw = Buffer.concat(chunks).toString('utf8');
      if (!raw) return reject({ status: 400, message: 'Body vazio' });
      try {
        resolve(JSON.parse(raw));
      } catch {
        reject({ status: 400, message: 'JSON inválido' });
      }
    });

    req.on('error', () => {
      reject({ status: 400, message: 'Erro ao ler a requisição' });
    });
  });
}

// Garante que o body é um objeto JSON (não array, null, string...)
function isPlainObject(data) {
  return typeof data === 'object' && data !== null && !Array.isArray(data);
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim() !== '';
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const parts = url.pathname.split('/').filter(Boolean);
    const method = req.method;

    if (parts[0] !== 'orders') return notFound(res);

    // ---------- /orders ----------
    if (parts.length === 1) {
      if (method === 'GET') {
        const status = url.searchParams.get('status');
        const result = status ? orders.filter((o) => o.status === status) : orders;
        return sendJson(res, 200, result);
      }

      if (method === 'POST') {
        const data = await readBody(req);
        if (!isPlainObject(data)) {
          return sendJson(res, 400, { error: 'O body deve ser um objeto JSON' });
        }
        const errors = [];
        if (!isNonEmptyString(data.client)) errors.push('"client" é obrigatório e deve ser texto');
        if (!isNonEmptyString(data.item)) errors.push('"item" é obrigatório e deve ser texto');
        if (errors.length) return sendJson(res, 400, { errors });

        const order = {
          id: nextId++,
          client: data.client.trim(),
          item: data.item.trim(),
          status: 'pendente', // sempre começa pendente
        };
        orders.push(order);
        return sendJson(res, 201, order, { Location: `/orders/${order.id}` });
      }

      return notFound(res);
    }

    // ---------- /orders/:id ----------
    if (parts.length === 2) {
      const id = Number(parts[1]);
      const index = orders.findIndex((o) => o.id === id);

      if (method === 'GET') {
        if (index === -1) return notFound(res, `Pedido ${parts[1]} não encontrado`);
        return sendJson(res, 200, orders[index]);
      }

      if (method === 'DELETE') {
        if (index === -1) return notFound(res, `Pedido ${parts[1]} não encontrado`);
        orders.splice(index, 1);
        res.writeHead(204); // sem body e sem Content-Type
        return res.end();
      }

      return notFound(res);
    }

    // ---------- /orders/:id/status ----------
    if (parts.length === 3 && parts[2] === 'status' && method === 'PATCH') {
      const id = Number(parts[1]);
      const index = orders.findIndex((o) => o.id === id);
      if (index === -1) return notFound(res, `Pedido ${parts[1]} não encontrado`);

      const data = await readBody(req);
      if (!isPlainObject(data) || !STATUS_VALIDOS.includes(data.status)) {
        return sendJson(res, 400, {
          error: `"status" deve ser um de: ${STATUS_VALIDOS.join(', ')}`,
        });
      }

      orders[index].status = data.status;
      return sendJson(res, 200, orders[index]);
    }

    // Qualquer outra coisa
    return notFound(res);

  } catch (err) {
    if (err && err.status) {
      return sendJson(res, err.status, { error: err.message });
    }
    console.error(err);
    return sendJson(res, 500, { error: 'Erro interno do servidor' });
  }
});

server.listen(PORT, () => console.log(`Dev Coffee API em http://localhost:${PORT}`));
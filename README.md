# Dev Coffee API

API REST de pedidos da cafeteria Dev Coffee, feita apenas com o módulo nativo `http` do Node.js, sem dependências externas. Os dados ficam em memória.

**Autor:** Arthur Marcante

## Como executar

Requer Node.js 18 ou superior.

```bash
npm start
```

O servidor sobe em `http://localhost:3000`.

## Modelo do pedido

```json
{ "id": 1, "client": "Nome do Cliente", "item": "Nome do Café", "status": "pendente" }
```

Status válidos: `pendente`, `pronto`, `cancelado`.

## Endpoints e exemplos (cURL)

### POST /orders: cria pedido (201 / 400)
```bash
curl -i -X POST http://localhost:3000/orders -H "Content-Type: application/json" -d '{"client":"Arthur","item":"Espresso"}'
```

### GET /orders: lista pedidos (200)
```bash
curl -i http://localhost:3000/orders
```

### GET /orders?status=pendente: filtra por status (200)
```bash
curl -i "http://localhost:3000/orders?status=pendente"
```

### GET /orders/:id: busca um pedido (200 / 404)
```bash
curl -i http://localhost:3000/orders/1
```

### PATCH /orders/:id/status: atualiza status (200 / 400 / 404)
```bash
curl -i -X PATCH http://localhost:3000/orders/1/status -H "Content-Type: application/json" -d '{"status":"pronto"}'
```

### DELETE /orders/:id: remove pedido (204 / 404)
```bash
curl -i -X DELETE http://localhost:3000/orders/1
```

### Qualquer outra rota ou verbo: 404
```bash
curl -i http://localhost:3000/qualquercoisa
```

Nos exemplos acima, no Windows PowerShell use `curl.exe` e escape as aspas do JSON (`{\"client\":\"Arthur\"}`).
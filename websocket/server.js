const express = require('express')
const http = require('http')
const { WebSocketServer } = require('ws')
const { parse } = require('url')

const HTTP_PORT = process.env.HTTP_PORT || 3001
const WS_PORT   = process.env.WS_PORT   || 3002

const rooms = new Map()

function joinRoom(pollId, ws) {
  if (!rooms.has(pollId)) {
    rooms.set(pollId, new Set())
  }
  rooms.get(pollId).add(ws)
  console.log(`[WS] Cliente entrou na sala poll=${pollId} | total=${rooms.get(pollId).size}`)
}

function leaveRoom(pollId, ws) {
  if (!rooms.has(pollId)) return
  rooms.get(pollId).delete(ws)
  if (rooms.get(pollId).size === 0) {
    rooms.delete(pollId)
  }
  console.log(`[WS] Cliente saiu da sala poll=${pollId}`)
}

function broadcastToPoll(pollId, payload) {
  const room = rooms.get(String(pollId))
  if (!room || room.size === 0) {
    console.log(`[WS] Broadcast para poll=${pollId}: nenhum cliente conectado`)
    return
  }

  const message = JSON.stringify(payload)
  let sent = 0

  for (const client of room) {
    if (client.readyState === 1) {
      client.send(message)
      sent++
    }
  }

  console.log(`[WS] Broadcast para poll=${pollId}: ${sent} cliente(s) notificado(s)`)
}

const wss = new WebSocketServer({ port: WS_PORT })

wss.on('connection', (ws, req) => {
  const { query } = parse(req.url, true)
  const pollId = query.pollId

  if (!pollId) {
    console.warn('[WS] Conexão sem pollId — fechando')
    ws.close(1008, 'pollId é obrigatório')
    return
  }

  joinRoom(pollId, ws)

  ws.isAlive = true
  ws.on('pong', () => { ws.isAlive = true })

  ws.on('close', () => leaveRoom(pollId, ws))

  ws.on('error', (err) => {
    console.error(`[WS] Erro no socket poll=${pollId}:`, err.message)
    leaveRoom(pollId, ws)
  })
})

const heartbeatInterval = setInterval(() => {
  wss.clients.forEach((ws) => {
    if (!ws.isAlive) {
      ws.terminate()
      return
    }
    ws.isAlive = false
    ws.ping()
  })
}, 30_000)

wss.on('close', () => clearInterval(heartbeatInterval))

console.log(`[WS] WebSocket server rodando em ws://localhost:${WS_PORT}`)

const app = express()
app.use(express.json())

app.post('/broadcast', (req, res) => {
  const { poll_id, options } = req.body

  if (!poll_id || !Array.isArray(options)) {
    console.warn('[HTTP] Payload inválido em /broadcast:', req.body)
    return res.status(400).json({ error: 'poll_id e options são obrigatórios' })
  }

  broadcastToPoll(poll_id, {
    type:    'vote_update',
    poll_id: poll_id,
    options: options,
  })

  res.status(200).json({ ok: true })
})

app.get('/health', (_req, res) => {
  const stats = {}
  for (const [pollId, sockets] of rooms.entries()) {
    stats[pollId] = sockets.size
  }
  res.json({
    status:      'ok',
    ws_port:     WS_PORT,
    http_port:   HTTP_PORT,
    active_rooms: stats,
  })
})

app.listen(HTTP_PORT, () => {
  console.log(`[HTTP] Broadcast server rodando em http://localhost:${HTTP_PORT}`)
  console.log(`[HTTP] Health check: http://localhost:${HTTP_PORT}/health`)
})

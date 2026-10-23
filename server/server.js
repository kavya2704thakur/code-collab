import express from 'express';
import http from 'http';
import cors from 'cors';
import { WebSocketServer, WebSocket } from 'ws';
import * as Y from 'yjs';
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// Map to hold document state per room
const rooms = new Map();

function getDoc(roomId) {
  if (!rooms.has(roomId)) {
    const ydoc = new Y.Doc();
    rooms.set(roomId, { doc: ydoc, clients: new Set() });
  }
  return rooms.get(roomId);
}

wss.on('connection', (ws, req) => {
  const urlParts = req.url.split('/');
  const roomId = urlParts[urlParts.length - 1] || 'shared-room-101';
  const { doc, clients } = getDoc(roomId);

  clients.add(ws);

  // Send initial document state to the new client
  const state = Y.encodeStateAsUpdate(doc);
  if (state.byteLength > 0 && ws.readyState === WebSocket.OPEN) {
    ws.send(state);
  }

  ws.on('message', (message) => {
    try {
      const update = new Uint8Array(message);
      Y.applyUpdate(doc, update);

      // Broadcast update to all other connected clients in the room
      for (const client of clients) {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(update);
        }
      }
    } catch (e) {
      console.error('Sync parsing error:', e);
    }
  });

  ws.on('close', () => {
    clients.delete(ws);
    if (clients.size === 0) {
      // Optional: keep room alive or clean up
    }
  });
});

app.post('/api/execute', (req, res) => {
  const { code, language } = req.body;
  if (!code) return res.status(400).json({ error: 'Code cannot be empty' });

  const tempDir = path.resolve('temp');
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

  let filename = '';
  let command = '';

  if (language === 'javascript') {
    filename = path.join(tempDir, `run_${Date.now()}.js`);
    fs.writeFileSync(filename, code);
    command = `node "${filename}"`;
  } else if (language === 'python') {
    filename = path.join(tempDir, `run_${Date.now()}.py`);
    fs.writeFileSync(filename, code);
    command = `python "${filename}"`;
  } else {
    return res.status(400).json({ error: 'Unsupported language' });
  }

  exec(command, { timeout: 10000 }, (error, stdout, stderr) => {
    try { if (fs.existsSync(filename)) fs.unlinkSync(filename); } catch (e) {}
    if (error) {
      return res.json({ output: stderr || error.message });
    }
    res.json({ output: stdout || 'Program finished with no output.' });
  });
});

const PORT = 4000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});

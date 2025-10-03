const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// In-memory store for viewer counts (use Redis or a database for production)
const viewerCounts = {};

// WebSocket connection handling
wss.on('connection', (ws, req) => {
  const urlParams = new URLSearchParams(req.url.split('?')[1]);
  const eventId = urlParams.get('eventId');

  if (!eventId) {
    ws.close();
    return;
  }

  // Increment viewer count
  viewerCounts[eventId] = (viewerCounts[eventId] || 0) + 1;
  broadcastViewerCount(eventId);

  // Send initial viewer count to the client
  ws.send(JSON.stringify({ eventId, viewers: viewerCounts[eventId] }));

  // Handle disconnection
  ws.on('close', () => {
    viewerCounts[eventId] = Math.max((viewerCounts[eventId] || 0) - 1, 0);
    broadcastViewerCount(eventId);
  });
});

// Broadcast viewer count to all connected clients for a specific event
function broadcastViewerCount(eventId) {
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ eventId, viewers: viewerCounts[eventId] || 0 }));
    }
  });
}

// Vercel serverless function handler
module.exports = (req, res) => {
  // Handle WebSocket upgrade
  if (req.headers['upgrade'] === 'websocket') {
    wss.handleUpgrade(req, req.socket, Buffer.alloc(0), (ws) => {
      wss.emit('connection', ws, req);
    });
  } else {
    res.status(400).send('This endpoint only supports WebSocket connections');
  }
};

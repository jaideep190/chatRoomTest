const WebSocket = require('ws');
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const HISTORY_FILE = path.join(__dirname, 'chat_history.txt');

let messageHistory = [];

// Load existing chat history from file
if (fs.existsSync(HISTORY_FILE)) {
  try {
    const data = fs.readFileSync(HISTORY_FILE, 'utf8');
    if (data) {
      messageHistory = data.split('\n').filter(line => line.trim() !== '');
    }
  } catch (err) {
    console.error('Error reading chat history:', err);
  }
}

const server = http.createServer((req, res) => {
  // Serve index.html
  fs.readFile('index.html', (err, data) => {
    if (err) {
      res.writeHead(500);
      return res.end('Error loading index.html');
    }
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(data);
  });
});

const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
  // Send chat history
  messageHistory.forEach(msg => ws.send(msg));

  ws.on('message', (message) => {
    const msgStr = message.toString();
    messageHistory.push(msgStr);

    fs.appendFile(HISTORY_FILE, msgStr + '\n', (err) => {
      if (err) console.error('Failed to save message:', err);
    });

    // Broadcast to all connected clients
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(msgStr);
      }
    });
  });
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

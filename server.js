const WebSocket = require('ws');
const http = require('http');
const fs = require('fs');
const path = require('path');

const HISTORY_FILE = path.join(__dirname, 'chat_history.txt');

let messageHistory = [];

// Load chat history from file at startup
try {
  if (fs.existsSync(HISTORY_FILE)) {
    const data = fs.readFileSync(HISTORY_FILE, 'utf8');
    if (data) {
      // Each line is one message
      messageHistory = data.split('\n').filter(line => line.trim() !== '');
    }
  }
} catch (err) {
  console.error('Error loading chat history:', err);
}

const server = http.createServer((req, res) => {
  fs.readFile('index.html', (err, data) => {
    if (err) {
      res.writeHead(500);
      return res.end('Error loading index.html');
    }
    res.writeHead(200);
    res.end(data);
  });
});

const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
  // Send chat history to new client
  messageHistory.forEach(msg => ws.send(msg));

  ws.on('message', (message) => {
    const msgStr = message.toString();
    messageHistory.push(msgStr);

    // Append message to file asynchronously
    fs.appendFile(HISTORY_FILE, msgStr + '\n', (err) => {
      if (err) console.error('Error saving message:', err);
    });

    // Broadcast message to all clients
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(msgStr);
      }
    });
  });
});

server.listen(3000, () => {
  console.log('Server running at http://localhost:3000');
});

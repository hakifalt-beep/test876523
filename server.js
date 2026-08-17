#!/usr/bin/env node

import dotenv from 'dotenv';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PORT = process.env.SERVER_PORT || 3000;
const HOST = process.env.SERVER_HOST || 'localhost';

// Store active connections
const activeConnections = new Map();
let connectionIdCounter = 1;

// VPN Server class
class VPNServer {
  constructor() {
    this.server = null;
    this.clients = new Map();
    this.tunnels = new Map();
  }

  start() {
    this.server = http.createServer((req, res) => {
      this.handleRequest(req, res);
    });

    this.server.listen(PORT, HOST, () => {
      console.log(`\n🚀 VPN SERVER STARTED`);
      console.log(`═══════════════════════════════════════`);
      console.log(`📍 Server: ${HOST}:${PORT}`);
      console.log(`✅ Status: Running`);
      console.log(`🔗 Connect clients to: http://${HOST}:${PORT}`);
      console.log(`═══════════════════════════════════════\n`);
    });

    // Handle server errors
    this.server.on('error', (err) => {
      console.error('❌ Server error:', err);
    });
  }

  handleRequest(req, res) {
    const url = req.url;
    const method = req.method;

    console.log(`📨 ${method} ${url} from ${req.socket.remoteAddress}`);

    // CORS headers
    res.setHeader('Access-Control-Allow-*', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }

    // Routes
    if (url === '/' && method === 'GET') {
      this.handleHome(res);
    } else if (url === '/api/status' && method === 'GET') {
      this.handleStatus(res);
    } else if (url === '/api/connect' && method === 'POST') {
      this.handleConnect(req, res);
    } else if (url === '/api/disconnect' && method === 'POST') {
      this.handleDisconnect(req, res);
    } else if (url === '/api/clients' && method === 'GET') {
      this.handleListClients(res);
    } else if (url === '/api/tunnel' && method === 'POST') {
      this.handleCreateTunnel(req, res);
    } else {
      this.handleNotFound(res);
    }
  }

  handleHome(res) {
    const html = `
<!DOCTYPE html>
<html>
<head>
  <title>VPN Server Dashboard</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; background: #1e1e1e; color: #fff; }
    .container { max-width: 1000px; margin: 0 auto; }
    h1 { color: #4CAF50; }
    .status-box { background: #2d2d2d; padding: 15px; border-left: 4px solid #4CAF50; margin: 10px 0; }
    .info { color: #888; font-size: 12px; }
    button { background: #4CAF50; color: white; padding: 10px 20px; border: none; cursor: pointer; margin: 5px; }
    button:hover { background: #45a049; }
    .client-list { background: #2d2d2d; padding: 15px; margin: 10px 0; }
    .client { background: #1a1a1a; padding: 10px; margin: 5px 0; border-left: 3px solid #2196F3; }
    code { background: #0a0a0a; padding: 2px 6px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🔐 VPN Server Dashboard</h1>
    
    <div class="status-box">
      <h3>Server Status</h3>
      <p>Status: <strong style="color: #4CAF50;">✅ Running</strong></p>
      <p>Host: <code>${HOST}</code></p>
      <p>Port: <code>${PORT}</code></p>
      <p class="info">Uptime: Started at ${new Date().toLocaleTimeString()}</p>
    </div>

    <div class="status-box">
      <h3>API Endpoints</h3>
      <ul>
        <li><code>GET /api/status</code> - Server status</li>
        <li><code>GET /api/clients</code> - List connected clients</li>
        <li><code>POST /api/connect</code> - Connect new client</li>
        <li><code>POST /api/disconnect</code> - Disconnect client</li>
        <li><code>POST /api/tunnel</code> - Create VPN tunnel</li>
      </ul>
    </div>

    <div class="status-box">
      <h3>Connected Clients</h3>
      <div class="client-list" id="clients">
        <p class="info">Loading...</p>
      </div>
      <button onclick="refreshClients()">🔄 Refresh</button>
    </div>

    <div class="status-box">
      <h3>Quick Actions</h3>
      <button onclick="testConnect()">📱 Test Client Connect</button>
      <button onclick="testStatus()">📊 Check Server Status</button>
      <button onclick="listClients()">👥 List All Clients</button>
    </div>
  </div>

  <script>
    async function testConnect() {
      const response = await fetch('/api/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'testuser',
          password: 'testpass123',
          deviceName: 'Test Device'
        })
      });
      const data = await response.json();
      alert('Connected: ' + JSON.stringify(data, null, 2));
      refreshClients();
    }

    async function testStatus() {
      const response = await fetch('/api/status');
      const data = await response.json();
      alert('Status: ' + JSON.stringify(data, null, 2));
    }

    async function listClients() {
      await refreshClients();
    }

    async function refreshClients() {
      const response = await fetch('/api/clients');
      const data = await response.json();
      const container = document.getElementById('clients');
      
      if (data.clients.length === 0) {
        container.innerHTML = '<p class="info">No clients connected</p>';
      } else {
        container.innerHTML = data.clients.map(c => \`
          <div class="client">
            <strong>\${c.username}</strong> - \${c.deviceName}<br>
            <small>IP: \${c.ip} | Connected: \${c.connected}</small>
          </div>
        \`).join('');
      }
    }

    refreshClients();
    setInterval(refreshClients, 5000);
  </script>
</body>
</html>
    `;
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(html);
  }

  handleStatus(res) {
    const data = {
      status: 'running',
      timestamp: new Date().toISOString(),
      host: HOST,
      port: PORT,
      connectedClients: this.clients.size,
      activeTunnels: this.tunnels.size,
      version: '1.0.0',
    };
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data, null, 2));
  }

  handleConnect(req, res) {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        const clientId = `client_${connectionIdCounter++}`;
        const vpnIp = `10.0.0.${connectionIdCounter}`;

        this.clients.set(clientId, {
          id: clientId,
          username: data.username || 'anonymous',
          password: data.password || '',
          deviceName: data.deviceName || 'Unknown',
          ip: vpnIp,
          connected: new Date().toISOString(),
          bytesReceived: 0,
          bytesSent: 0,
        });

        console.log(`✅ Client connected: ${clientId} (${data.username})`);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          clientId,
          vpnIp,
          message: 'Connected successfully',
          config: {
            server: HOST,
            port: PORT,
            protocol: 'wireguard',
            dns: ['8.8.8.8', '8.8.4.4'],
          },
        }, null, 2));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid request', message: e.message }, null, 2));
      }
    });
  }

  handleDisconnect(req, res) {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        const clientId = data.clientId;

        if (this.clients.has(clientId)) {
          this.clients.delete(clientId);
          console.log(`❌ Client disconnected: ${clientId}`);
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          message: 'Disconnected successfully',
        }, null, 2));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid request', message: e.message }, null, 2));
      }
    });
  }

  handleListClients(res) {
    const clients = Array.from(this.clients.values());
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ clients, count: clients.length }, null, 2));
  }

  handleCreateTunnel(req, res) {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        const tunnelId = `tunnel_${Date.now()}`;

        this.tunnels.set(tunnelId, {
          id: tunnelId,
          clientId: data.clientId,
          protocol: data.protocol || 'wireguard',
          encryptionKey: Buffer.from(Math.random().toString()).toString('base64'),
          created: new Date().toISOString(),
          status: 'active',
        });

        console.log(`🔗 Tunnel created: ${tunnelId}`);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          tunnelId,
          encryption: 'AES-256',
          protocol: data.protocol || 'wireguard',
        }, null, 2));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid request', message: e.message }, null, 2));
      }
    });
  }

  handleNotFound(res) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not Found' }, null, 2));
  }
}

// Start the server
const vpnServer = new VPNServer();
vpnServer.start();

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n🛑 Shutting down VPN server...');
  if (vpnServer.server) {
    vpnServer.server.close(() => {
      console.log('✅ Server stopped');
      process.exit(0);
    });
  }
});

#!/usr/bin/env node

import dotenv from 'dotenv';
import blessed from 'blessed';

// Load environment variables
dotenv.config();

const config = {
  vpnServer: process.env.VPN_SERVER || 'localhost',
  vpnPort: process.env.VPN_PORT || 1194,
  vpnProtocol: process.env.VPN_PROTOCOL || 'wireguard',
  username: process.env.VPN_USERNAME || 'test',
  password: process.env.VPN_PASSWORD || 'test123',
  autoConnect: process.env.AUTO_CONNECT === 'true',
  autoReconnect: process.env.AUTO_RECONNECT === 'true',
};

// Simulate VPN connection state
let isConnected = false;
let connectionStatus = 'Disconnected';

// Create the blessed screen
const screen = blessed.screen({
  mouse: true,
  title: 'VPN Client',
});

// Title
const title = blessed.box({
  parent: screen,
  top: 0,
  left: 'center',
  width: '100%',
  height: 3,
  content: '{center}VPN CLIENT - Lightweight VPN Connection Manager{/center}',
  style: {
    fg: 'white',
    bg: 'blue',
  },
});

// Server info box
const infoBox = blessed.box({
  parent: screen,
  top: 3,
  left: 0,
  width: '50%',
  height: 8,
  border: 'line',
  label: ' Server Info ',
  content: `
  Server: ${config.vpnServer}
  Port: ${config.vpnPort}
  Protocol: ${config.vpnProtocol}
  Username: ${config.username}
  `,
  style: {
    fg: 'green',
    border: { fg: 'cyan' },
  },
});

// Status box
const statusBox = blessed.box({
  parent: screen,
  top: 3,
  right: 0,
  width: '50%',
  height: 8,
  border: 'line',
  label: ' Status ',
  content: `
  Connection: {red-fg}${connectionStatus}{/red-fg}
  IP Address: Not connected
  Data Usage: 0 B
  `,
  style: {
    border: { fg: 'cyan' },
  },
});

// Log output box
const logBox = blessed.log({
  parent: screen,
  top: 11,
  left: 0,
  right: 0,
  height: 10,
  border: 'line',
  label: ' Activity Log ',
  style: {
    border: { fg: 'cyan' },
  },
  scrollable: true,
  mouse: true,
  keys: true,
});

// Button container
const buttonBox = blessed.box({
  parent: screen,
  bottom: 0,
  left: 0,
  right: 0,
  height: 3,
  style: {
    bg: 'blue',
  },
});

// Connect button
const connectBtn = blessed.button({
  parent: buttonBox,
  mouse: true,
  keys: true,
  shrink: true,
  padding: 1,
  left: 2,
  bottom: 0,
  name: 'connect',
  content: 'CONNECT',
  style: {
    bg: 'green',
    fg: 'white',
    focus: { bg: 'white', fg: 'green' },
    hover: { bg: 'lightgreen', fg: 'black' },
  },
});

// Disconnect button
const disconnectBtn = blessed.button({
  parent: buttonBox,
  mouse: true,
  keys: true,
  shrink: true,
  padding: 1,
  left: 15,
  bottom: 0,
  name: 'disconnect',
  content: 'DISCONNECT',
  style: {
    bg: 'red',
    fg: 'white',
    focus: { bg: 'white', fg: 'red' },
    hover: { bg: 'lightred', fg: 'black' },
  },
});

// Quit button
const quitBtn = blessed.button({
  parent: buttonBox,
  mouse: true,
  keys: true,
  shrink: true,
  padding: 1,
  right: 2,
  bottom: 0,
  name: 'quit',
  content: 'QUIT',
  style: {
    bg: 'yellow',
    fg: 'black',
    focus: { bg: 'white', fg: 'yellow' },
    hover: { bg: 'lightyellow', fg: 'black' },
  },
});

// Helper function to update status
function updateStatus() {
  statusBox.setContent(`
  Connection: {${isConnected ? 'green' : 'red'}-fg}${connectionStatus}{/}
  IP Address: ${isConnected ? '192.168.1.100' : 'Not connected'}
  Data Usage: ${isConnected ? '1.2 MB' : '0 B'}
  `);
  screen.render();
}

// Connect button handler
connectBtn.on('press', () => {
  if (!isConnected) {
    logBox.log(`[${new Date().toLocaleTimeString()}] Connecting to ${config.vpnServer}:${config.vpnPort}...`);
    setTimeout(() => {
      isConnected = true;
      connectionStatus = 'Connected';
      logBox.log(`[${new Date().toLocaleTimeString()}] ✓ Connected successfully`);
      updateStatus();
    }, 2000);
  }
});

// Disconnect button handler
disconnectBtn.on('press', () => {
  if (isConnected) {
    logBox.log(`[${new Date().toLocaleTimeString()}] Disconnecting...`);
    setTimeout(() => {
      isConnected = false;
      connectionStatus = 'Disconnected';
      logBox.log(`[${new Date().toLocaleTimeString()}] ✓ Disconnected`);
      updateStatus();
    }, 1000);
  }
});

// Quit button handler
quitBtn.on('press', () => {
  return process.exit(0);
});

// Keyboard shortcuts
screen.key(['escape', 'q', 'C-c'], () => {
  return process.exit(0);
});

// Initial log
logBox.log(`[${new Date().toLocaleTimeString()}] VPN Client initialized`);
logBox.log(`[${new Date().toLocaleTimeString()}] Server: ${config.vpnServer}:${config.vpnPort} (${config.vpnProtocol})`);
logBox.log(`[${new Date().toLocaleTimeString()}] Click CONNECT to establish connection or press Q to quit`);

if (config.autoConnect) {
  logBox.log(`[${new Date().toLocaleTimeString()}] Auto-connect enabled, connecting...`);
  connectBtn.press();
}

// Focus connect button by default
connectBtn.focus();

// Render the screen
screen.render();

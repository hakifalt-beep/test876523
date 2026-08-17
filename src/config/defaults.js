import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // VPN Server
  vpnServer: process.env.VPN_SERVER || 'localhost',
  vpnPort: parseInt(process.env.VPN_PORT || '1194'),
  vpnProtocol: process.env.VPN_PROTOCOL || 'wireguard',

  // Authentication
  username: process.env.VPN_USERNAME || '',
  password: process.env.VPN_PASSWORD || '',

  // Auto-Connect & Reconnect
  autoConnect: process.env.AUTO_CONNECT === 'true',
  autoReconnect: process.env.AUTO_RECONNECT === 'true',
  reconnectInterval: parseInt(process.env.RECONNECT_INTERVAL || '5000'),

  // Logging
  logLevel: process.env.LOG_LEVEL || 'info',
  logFile: process.env.LOG_FILE || './logs/vpn-client.log',

  // Connection Timeout
  connectionTimeout: 30000,
  handshakeTimeout: 10000,
};

export default config;

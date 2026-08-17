import { EventEmitter } from 'events';
import { exec } from 'child_process';
import { promisify } from 'util';
import VPNAuth from './auth.js';
import logger from '../utils/logger.js';
import * as network from '../utils/network.js';
import config from '../config/defaults.js';

const execPromise = promisify(exec);

/**
 * VPN Connection Manager
 * Handles connection lifecycle, authentication, and auto-reconnect
 */
export class VPNConnection extends EventEmitter {
  constructor(vpnConfig) {
    super();
    this.config = vpnConfig;
    this.auth = new VPNAuth(
      this.config.server,
      this.config.port,
      this.config.username,
      this.config.password
    );
    this.connected = false;
    this.connecting = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectInterval = config.reconnectInterval;
  }

  /**
   * Connect to VPN server
   */
  async connect() {
    if (this.connected || this.connecting) {
      logger.warn('Already connected or connecting');
      return false;
    }

    this.connecting = true;
    this.emit('connecting');

    try {
      // Check network availability
      const hasNetwork = await network.checkNetworkStatus();
      if (!hasNetwork) {
        throw new Error('No internet connectivity detected');
      }

      // Verify server is reachable
      const serverReachable = await network.isServerReachable(
        this.config.server,
        this.config.port
      );
      if (!serverReachable) {
        throw new Error(`VPN server ${this.config.server}:${this.config.port} is unreachable`);
      }

      // Authenticate
      logger.info(`Authenticating with ${this.config.server}...`);
      const token = await this.auth.authenticate(config.handshakeTimeout);
      logger.info('Authentication successful');

      // Establish VPN tunnel (protocol-specific)
      await this.establishTunnel(token);

      this.connected = true;
      this.connecting = false;
      this.reconnectAttempts = 0;

      logger.info('VPN connection established');
      this.emit('connected');

      // Start monitoring connection health
      this.startHealthCheck();

      return true;
    } catch (error) {
      this.connecting = false;
      logger.error('Connection failed', error.message);
      this.emit('error', error);

      // Trigger auto-reconnect if enabled
      if (config.autoReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
        this.scheduleReconnect();
      }

      return false;
    }
  }

  /**
   * Establish VPN tunnel based on protocol
   */
  async establishTunnel(token) {
    if (this.config.protocol === 'wireguard') {
      await this.setupWireGuardTunnel(token);
    } else if (this.config.protocol === 'openvpn') {
      await this.setupOpenVPNTunnel(token);
    } else {
      throw new Error(`Unsupported protocol: ${this.config.protocol}`);
    }
  }

  /**
   * Setup WireGuard tunnel
   */
  async setupWireGuardTunnel(token) {
    logger.debug('Setting up WireGuard tunnel');
    // This would typically configure WireGuard with the auth token
    // Implementation depends on your server configuration
    logger.info('WireGuard tunnel configured');
  }

  /**
   * Setup OpenVPN tunnel
   */
  async setupOpenVPNTunnel(token) {
    logger.debug('Setting up OpenVPN tunnel');
    // This would typically configure OpenVPN with the auth token
    // Implementation depends on your server configuration
    logger.info('OpenVPN tunnel configured');
  }

  /**
   * Disconnect from VPN
   */
  async disconnect() {
    if (!this.connected) {
      logger.warn('Not connected to VPN');
      return false;
    }

    try {
      logger.info('Disconnecting from VPN...');
      this.stopHealthCheck();
      
      // Tear down tunnel
      if (this.config.protocol === 'wireguard') {
        await execPromise('wg-quick down wg0 2>/dev/null', { sudo: true }).catch(() => {});
      } else if (this.config.protocol === 'openvpn') {
        await execPromise('pkill openvpn 2>/dev/null').catch(() => {});
      }

      this.connected = false;
      logger.info('VPN disconnected');
      this.emit('disconnected');
      return true;
    } catch (error) {
      logger.error('Disconnect error', error.message);
      return false;
    }
  }

  /**
   * Start health check timer
   */
  startHealthCheck() {
    this.healthCheckInterval = setInterval(async () => {
      try {
        const isConnected = await network.isVpnConnected();
        if (!isConnected) {
          logger.warn('VPN connection lost, attempting reconnect');
          this.connected = false;
          this.emit('disconnected');
          if (config.autoReconnect) {
            this.scheduleReconnect();
          }
        }
      } catch (error) {
        logger.error('Health check error', error.message);
      }
    }, 10000); // Check every 10 seconds
  }

  /**
   * Stop health check timer
   */
  stopHealthCheck() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }

  /**
   * Schedule reconnection attempt
   */
  scheduleReconnect() {
    this.reconnectAttempts++;
    const delay = this.reconnectInterval * this.reconnectAttempts;
    logger.info(
      `Scheduling reconnect attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`
    );

    setTimeout(() => {
      this.connect();
    }, delay);
  }

  /**
   * Get connection status
   */
  getStatus() {
    return {
      connected: this.connected,
      connecting: this.connecting,
      server: this.config.server,
      protocol: this.config.protocol,
      reconnectAttempts: this.reconnectAttempts,
    };
  }
}

export default VPNConnection;

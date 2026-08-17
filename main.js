#!/usr/bin/env node

import config from './src/config/defaults.js';
import logger from './src/utils/logger.js';
import VPNConnection from './src/client/vpn-connection.js';
import VPNUI from './src/client/ui.js';

/**
 * Main VPN Client Application
 */
class VPNClient {
  constructor() {
    this.vpnConnection = null;
    this.ui = null;
  }

  /**
   * Initialize and start the VPN client
   */
  async start() {
    logger.info('VPN Client starting...');
    logger.info(`Server: ${config.vpnServer}:${config.vpnPort}`);
    logger.info(`Protocol: ${config.vpnProtocol}`);
    logger.info(`Auto-connect: ${config.autoConnect}`);

    // Validate configuration
    if (!config.vpnServer) {
      logger.error('VPN_SERVER not configured');
      process.exit(1);
    }

    if (!config.username || !config.password) {
      logger.error('VPN credentials not configured');
      process.exit(1);
    }

    // Create VPN connection
    this.vpnConnection = new VPNConnection({
      server: config.vpnServer,
      port: config.vpnPort,
      protocol: config.vpnProtocol,
      username: config.username,
      password: config.password,
    });

    // Initialize UI
    this.ui = new VPNUI(this.vpnConnection);
    this.ui.log('VPN Client initialized');
    this.ui.log(`Configured server: ${config.vpnServer}:${config.vpnPort}`);

    // Handle graceful shutdown
    process.on('SIGINT', () => {
      logger.info('Shutting down...');
      this.vpnConnection.disconnect().then(() => {
        logger.info('Goodbye');
        process.exit(0);
      });
    });

    // Auto-connect if enabled
    if (config.autoConnect) {
      this.ui.log('Auto-connect enabled, connecting...');
      await this.vpnConnection.connect();
    } else {
      this.ui.log('Click CONNECT to establish VPN connection');
    }
  }
}

// Start the application
const client = new VPNClient();
client.start().catch((error) => {
  logger.error('Failed to start VPN client', error);
  process.exit(1);
});

import blessed from 'blessed';
import logger from '../utils/logger.js';

/**
 * Terminal UI for VPN Client
 */
export class VPNUI {
  constructor(vpnConnection) {
    this.vpnConnection = vpnConnection;
    this.screen = null;
    this.statusBox = null;
    this.logBox = null;
    this.buttonConnect = null;
    this.setupUI();
  }

  /**
   * Setup the terminal UI
   */
  setupUI() {
    this.screen = blessed.screen({
      mouse: true,
      title: 'VPN Client - test876523',
      smartCSR: true,
    });

    // Main title
    blessed.box({
      parent: this.screen,
      top: 0,
      left: 0,
      width: '100%',
      height: 3,
      content: '{center}{bold}VPN Client - test876523{/bold}{/center}',
      style: {
        fg: 'white',
        bg: 'blue',
      },
    });

    // Status display
    this.statusBox = blessed.box({
      parent: this.screen,
      top: 3,
      left: 0,
      width: '50%',
      height: 10,
      border: 'line',
      label: 'Status',
      content: '{gray}Not connected{/gray}',
      style: {
        border: {
          fg: 'cyan',
        },
      },
    });

    // Connection info
    const infoBox = blessed.box({
      parent: this.screen,
      top: 3,
      right: 0,
      width: '50%',
      height: 10,
      border: 'line',
      label: 'Connection Info',
      content: 'Server: {yellow}—{/yellow}\nProtocol: {yellow}—{/yellow}',
      style: {
        border: {
          fg: 'cyan',
        },
      },
    });

    // Connect/Disconnect button
    this.buttonConnect = blessed.button({
      parent: this.screen,
      mouse: true,
      keys: true,
      shrink: true,
      padding: 2,
      left: 2,
      top: 14,
      name: 'connect',
      content: 'CONNECT',
      style: {
        bg: 'green',
        fg: 'white',
        focus: {
          bg: 'lightgreen',
          fg: 'black',
        },
        hover: {
          bg: 'lightgreen',
          fg: 'black',
        },
      },
    });

    this.buttonConnect.on('press', () => {
      if (this.vpnConnection.connected) {
        this.vpnConnection.disconnect();
      } else {
        this.vpnConnection.connect();
      }
    });

    // Quit button
    const buttonQuit = blessed.button({
      parent: this.screen,
      mouse: true,
      keys: true,
      shrink: true,
      padding: 2,
      left: 20,
      top: 14,
      name: 'quit',
      content: 'QUIT',
      style: {
        bg: 'red',
        fg: 'white',
        focus: {
          bg: 'lightred',
          fg: 'black',
        },
        hover: {
          bg: 'lightred',
          fg: 'black',
        },
      },
    });

    buttonQuit.on('press', () => {
      this.vpnConnection.disconnect().then(() => {
        process.exit(0);
      });
    });

    // Log display
    this.logBox = blessed.log({
      parent: this.screen,
      mouse: true,
      keys: true,
      top: 18,
      left: 0,
      width: '100%',
      height: '100%-18',
      border: 'line',
      label: 'Log',
      style: {
        border: {
          fg: 'cyan',
        },
      },
    });

    // Setup keyboard shortcuts
    this.screen.key(['escape', 'q', 'C-c'], () => {
      this.vpnConnection.disconnect().then(() => {
        process.exit(0);
      });
    });

    // Listen to VPN events
    this.setupEventListeners();

    // Render
    this.screen.render();
  }

  /**
   * Setup event listeners for VPN connection
   */
  setupEventListeners() {
    this.vpnConnection.on('connecting', () => {
      this.updateStatus('Connecting...', 'yellow');
      this.log('Establishing connection...');
    });

    this.vpnConnection.on('connected', () => {
      this.updateStatus('Connected', 'green');
      this.log('✓ VPN connected successfully');
      this.buttonConnect.setContent('DISCONNECT');
      this.buttonConnect.style.bg = 'red';
    });

    this.vpnConnection.on('disconnected', () => {
      this.updateStatus('Disconnected', 'gray');
      this.log('✗ VPN disconnected');
      this.buttonConnect.setContent('CONNECT');
      this.buttonConnect.style.bg = 'green';
    });

    this.vpnConnection.on('error', (error) => {
      this.updateStatus(`Error: ${error.message}`, 'red');
      this.log(`✗ Error: ${error.message}`);
    });
  }

  /**
   * Update status display
   */
  updateStatus(text, color = 'white') {
    const status = this.vpnConnection.getStatus();
    const content = `{${color}}${text}{/${color}}\nServer: {yellow}${status.server}{/yellow}\nProtocol: {yellow}${status.protocol}{/yellow}`;
    this.statusBox.setContent(content);
    this.screen.render();
  }

  /**
   * Add log message
   */
  log(message) {
    const timestamp = new Date().toLocaleTimeString();
    this.logBox.log(`[${timestamp}] ${message}`);
  }

  /**
   * Show error message
   */
  showError(title, message) {
    const box = blessed.box({
      parent: this.screen,
      top: 'center',
      left: 'center',
      width: 60,
      height: 12,
      content: `{red}{bold}${title}{/bold}{/red}\n\n${message}`,
      border: 'line',
      style: {
        border: {
          fg: 'red',
        },
      },
    });

    setTimeout(() => {
      box.destroy();
      this.screen.render();
    }, 3000);
  }
}

export default VPNUI;

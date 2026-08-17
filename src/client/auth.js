import tls from 'tls';
import crypto from 'crypto';
import logger from '../utils/logger.js';

/**
 * Authenticate with VPN server over secure TLS connection
 */
export class VPNAuth {
  constructor(host, port, username, password) {
    this.host = host;
    this.port = port;
    this.username = username;
    this.password = password;
    this.socket = null;
    this.authToken = null;
  }

  /**
   * Hash password with salt for secure transmission
   */
  hashPassword(salt) {
    const saltedPassword = this.password + salt;
    return crypto.createHash('sha256').update(saltedPassword).digest('hex');
  }

  /**
   * Authenticate and get session token
   */
  async authenticate(timeoutMs = 10000) {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.socket?.destroy();
        reject(new Error('Authentication timeout'));
      }, timeoutMs);

      try {
        this.socket = tls.connect(
          {
            host: this.host,
            port: this.port,
            rejectUnauthorized: false, // Allow self-signed certs in dev
          },
          () => {
            logger.debug('TLS connection established to auth server');
            
            // Request authentication
            const authRequest = JSON.stringify({
              type: 'AUTH_REQUEST',
              username: this.username,
              timestamp: Date.now(),
            });
            this.socket.write(authRequest + '\n');
          }
        );

        let buffer = '';
        this.socket.on('data', (data) => {
          buffer += data.toString();
          const lines = buffer.split('\n');
          buffer = lines.pop(); // Keep incomplete line

          for (const line of lines) {
            if (!line) continue;
            try {
              this.handleAuthResponse(line, resolve, reject, timeout);
            } catch (error) {
              reject(error);
            }
          }
        });

        this.socket.on('error', (error) => {
          clearTimeout(timeout);
          logger.error('Auth socket error', error.message);
          reject(error);
        });

        this.socket.on('close', () => {
          clearTimeout(timeout);
        });
      } catch (error) {
        clearTimeout(timeout);
        reject(error);
      }
    });
  }

  /**
   * Handle server response during authentication
   */
  handleAuthResponse(line, resolve, reject, timeout) {
    try {
      const response = JSON.parse(line);

      if (response.type === 'AUTH_CHALLENGE') {
        logger.debug('Received auth challenge from server');
        const passwordHash = this.hashPassword(response.salt);
        const challenge = JSON.stringify({
          type: 'AUTH_RESPONSE',
          username: this.username,
          passwordHash,
          challenge: response.challenge,
        });
        this.socket.write(challenge + '\n');
      } else if (response.type === 'AUTH_SUCCESS') {
        logger.info(`Authentication successful for user ${this.username}`);
        this.authToken = response.token;
        clearTimeout(timeout);
        this.socket.destroy();
        resolve(response.token);
      } else if (response.type === 'AUTH_FAILED') {
        clearTimeout(timeout);
        this.socket.destroy();
        reject(new Error(`Authentication failed: ${response.reason}`));
      }
    } catch (error) {
      reject(new Error(`Failed to parse auth response: ${error.message}`));
    }
  }

  /**
   * Get current auth token
   */
  getToken() {
    return this.authToken;
  }

  /**
   * Check if authenticated
   */
  isAuthenticated() {
    return this.authToken !== null;
  }
}

export default VPNAuth;

import { exec } from 'child_process';
import { promisify } from 'util';
import logger from './logger.js';

const execPromise = promisify(exec);

/**
 * Check if device has internet connectivity
 */
export async function checkNetworkStatus() {
  try {
    await execPromise('ping -c 1 8.8.8.8', { timeout: 5000 });
    return true;
  } catch (error) {
    logger.warn('Network connectivity check failed');
    return false;
  }
}

/**
 * Check if VPN connection is active
 */
export async function isVpnConnected() {
  try {
    const { stdout } = await execPromise('ip route | grep -i tun');
    return stdout.trim().length > 0;
  } catch (error) {
    return false;
  }
}

/**
 * Get current network interface
 */
export async function getActiveInterface() {
  try {
    const { stdout } = await execPromise("ip route | grep '^default' | awk '{print $5}'");
    return stdout.trim();
  } catch (error) {
    logger.error('Failed to get active interface', error);
    return null;
  }
}

/**
 * Verify server is reachable
 */
export async function isServerReachable(host, port) {
  try {
    await execPromise(`timeout 5 bash -c "echo >/dev/tcp/${host}/${port}" 2>/dev/null`);
    return true;
  } catch (error) {
    logger.warn(`Server ${host}:${port} unreachable`);
    return false;
  }
}

export default {
  checkNetworkStatus,
  isVpnConnected,
  getActiveInterface,
  isServerReachable,
};

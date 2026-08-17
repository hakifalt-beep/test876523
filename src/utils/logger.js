import fs from 'fs';
import path from 'path';
import config from '../config/defaults.js';

const logDir = path.dirname(config.logFile);

// Ensure log directory exists
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const logLevels = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const currentLogLevel = logLevels[config.logLevel] || 1;

function formatTimestamp() {
  return new Date().toISOString();
}

function writeLog(level, message, data = null) {
  if (logLevels[level] < currentLogLevel) return;

  const timestamp = formatTimestamp();
  const logEntry = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
  const fullEntry = data ? `${logEntry} ${JSON.stringify(data)}` : logEntry;

  // Console output
  console.log(fullEntry);

  // File output
  fs.appendFileSync(config.logFile, fullEntry + '\n', 'utf8');
}

export const logger = {
  debug: (msg, data) => writeLog('debug', msg, data),
  info: (msg, data) => writeLog('info', msg, data),
  warn: (msg, data) => writeLog('warn', msg, data),
  error: (msg, data) => writeLog('error', msg, data),
};

export default logger;

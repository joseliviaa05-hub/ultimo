import fs from 'fs';
import path from 'path';
import { env } from '../config/env';

class Logger {
  private logsDir: string;

  constructor() {
    this. logsDir = env.LOGS_DIR;
    this.ensureLogDir();
  }

  private ensureLogDir(): void {
    if (!fs.existsSync(this.logsDir)) {
      fs.mkdirSync(this.logsDir, { recursive: true });
    }
  }

  private getTimestamp(): string {
    return new Date().toISOString();
  }

  private writeToFile(level: string, message: string): void {
    const timestamp = this.getTimestamp();
    const logMessage = '[' + timestamp + '] [' + level. toUpperCase() + '] ' + message + '\n';
    
    const today = new Date(). toISOString().split('T')[0];
    const logFile = path.join(this.logsDir, today + '.log');

    fs.appendFileSync(logFile, logMessage, 'utf8');
  }

  info(message: string): void {
    console.log('INFO: ' + message);
    this.writeToFile('INFO', message);
  }

  success(message: string): void {
    console.log('SUCCESS: ' + message);
    this.writeToFile('SUCCESS', message);
  }

  warn(message: string): void {
    console.warn('WARN: ' + message);
    this.writeToFile('WARN', message);
  }

  error(message: string, err?: Error): void {
    console.error('ERROR: ' + message);
    if (err) {
      console.error(err);
      const errorDetails = message + ' - ' + err.message + '\n' + err.stack;
      this.writeToFile('ERROR', errorDetails);
    } else {
      this.writeToFile('ERROR', message);
    }
  }

  debug(message: string): void {
    if (env.NODE_ENV === 'development') {
      console.log('DEBUG: ' + message);
      this.writeToFile('DEBUG', message);
    }
  }
}

export const logger = new Logger();

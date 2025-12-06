"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const env_1 = require("../config/env");
class Logger {
    constructor() {
        this.logsDir = env_1.env.LOGS_DIR;
        this.ensureLogDir();
    }
    ensureLogDir() {
        if (!fs_1.default.existsSync(this.logsDir)) {
            fs_1.default.mkdirSync(this.logsDir, { recursive: true });
        }
    }
    getTimestamp() {
        return new Date().toISOString();
    }
    writeToFile(level, message) {
        const timestamp = this.getTimestamp();
        const logMessage = '[' + timestamp + '] [' + level.toUpperCase() + '] ' + message + '\n';
        const today = new Date().toISOString().split('T')[0];
        const logFile = path_1.default.join(this.logsDir, today + '.log');
        fs_1.default.appendFileSync(logFile, logMessage, 'utf8');
    }
    info(message) {
        console.log('INFO: ' + message);
        this.writeToFile('INFO', message);
    }
    success(message) {
        console.log('SUCCESS: ' + message);
        this.writeToFile('SUCCESS', message);
    }
    warn(message) {
        console.warn('WARN: ' + message);
        this.writeToFile('WARN', message);
    }
    error(message, err) {
        console.error('ERROR: ' + message);
        if (err) {
            console.error(err);
            const errorDetails = message + ' - ' + err.message + '\n' + err.stack;
            this.writeToFile('ERROR', errorDetails);
        }
        else {
            this.writeToFile('ERROR', message);
        }
    }
    debug(message) {
        if (env_1.env.NODE_ENV === 'development') {
            console.log('DEBUG: ' + message);
            this.writeToFile('DEBUG', message);
        }
    }
}
exports.logger = new Logger();
//# sourceMappingURL=logger.js.map
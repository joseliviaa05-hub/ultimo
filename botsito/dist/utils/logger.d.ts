declare class Logger {
    private logsDir;
    constructor();
    private ensureLogDir;
    private getTimestamp;
    private writeToFile;
    info(message: string): void;
    success(message: string): void;
    warn(message: string): void;
    error(message: string, err?: Error): void;
    debug(message: string): void;
}
export declare const logger: Logger;
export {};
//# sourceMappingURL=logger.d.ts.map
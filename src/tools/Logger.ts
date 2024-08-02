import Config from "./Config.ts";

export default class Logger {
    public static get prismaSettings(): object {
        return {
            errorFormat: 'pretty',
            log: Config.logging.level === 'debug'
                ? ['query', 'info', 'warn', 'error']
                : undefined
        }
    }

    public static readonly colors = {
        gray: '\x1b[90m',
        blue: '\x1b[34m',
        orange: '\x1b[33m',
        red: '\x1b[31m',
        reset: '\x1b[0m'
    };

    private static logLevels = ['error', 'warn', 'info', 'debug']
    private static LOG = {
        ERROR: 0,
        WARN: 1,
        INFO: 2,
        DEBUG: 3
    }
    private static logLevel: number = -1;

    static init() {
        console.debug = (...args: string[]) => this.debug(args.join(' '));
        console.info = (...args: string[]) => this.info(args.join(' '));
        console.warn = (...args: string[]) => this.warn(args.join(' '));
        console.error = (...args: string[]) => this.error(args.join(' '));

        this.logLevel = this.logLevels.indexOf(Config.logging.level);
    }

    /**
     * Logs a debug message
     * @param msg message to log as debug
     */
    private static debug(msg: string) {
        if (this.logLevel < Logger.LOG.DEBUG) return;
        this.log(Logger.colors.gray, 'DEBUG', msg);
    }

    /**
     * Logs an info message
     * @param msg message to log as info
     */
    private static info(msg: string) {
        if (this.logLevel < Logger.LOG.INFO) return;
        this.log(Logger.colors.blue, 'INFO', msg);
    }

    /**
     * Logs a warning message
     * @param msg message to log as warn
     */
    private static warn(msg: string) {
        if (this.logLevel < Logger.LOG.WARN) return;
        this.log(Logger.colors.orange, 'WARNING', msg);
    }

    /**
     * Logs an error message
     * @param msg message to log as error
     */
    private static error(msg: string) {
        if (this.logLevel < Logger.LOG.ERROR) return;
        this.log(Logger.colors.red, 'ERROR', msg);
    }

    private static log(color: string, prefix: string, msg: string) {
        // remove useless ExperimentalWarning
        if (typeof msg === 'string' && msg.includes('ExperimentalWarning')) return;

        const date = new Date();
        const time = `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;
        const log = `${Logger.colors.gray}[${time}] [${color}${prefix}${Logger.colors.gray}]${Logger.colors.reset} ${msg}`;

        console.log(log);
        // TODO : write to file if config.logging.file is true
    }
}

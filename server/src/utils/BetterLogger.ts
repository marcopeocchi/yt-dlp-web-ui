const ansi = {
    reset: '\u001b[0m',
    red: '\u001b[31m',
    cyan: '\u001b[36m',
    green: '\u001b[32m',
    yellow: '\u001b[93m',
    bold: '\u001b[1m',
    normal: '\u001b[22m',
}

class Logger {
    private static _instance: Logger;

    constructor() { };

    static get instance() {
        if (this._instance) {
            return this._instance
        }
        this._instance = new Logger()
        return this._instance;
    }
    /**
     * Print a standard info message
     * @param {string} proto the context/protocol/section outputting the message
     * @param {string} args the acutal message
     */
    public info(proto: string, args: string) {
        process.stdout.write(
            this.formatter(proto, args)
        )
    }
    /**
     * Print a warn message
     * @param {string} proto the context/protocol/section outputting the message
     * @param {string} args the acutal message
     */
    public warn(proto: string, args: string) {
        process.stdout.write(
            `${ansi.yellow}${this.formatter(proto, args)}${ansi.reset}`
        )
    }
    /**
     * Print an error message
     * @param {string} proto the context/protocol/section outputting the message
     * @param {string} args the acutal message
     */
    public err(proto: string, args: string) {
        process.stdout.write(
            `${ansi.red}${this.formatter(proto, args)}${ansi.reset}`
        )
    }

    private formatter(proto: any, args: any) {
        return `${ansi.bold}[${proto}]${ansi.normal}\t${args}\n`
    }
}

export default Logger;
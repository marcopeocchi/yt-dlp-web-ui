const ansi = {
    reset: '\u001b[0m',
    red: '\u001b[31m',
    cyan: '\u001b[36m',
    green: '\u001b[32m',
    yellow: '\u001b[93m',
}

class Logger {
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
        return `[${proto}]\t${args}\n`
    }
}

export default Logger;
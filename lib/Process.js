const { spawn } = require('child_process');
const { deleteDownloadByPID, insertDownload } = require('./db');
const { logger } = require('./logger');

/**
 * Represents a download process that spawns yt-dlp.
 * @constructor
 * @param {string} url - The downlaod url.
 * @param {string} params - The cli arguments passed by the frontend.
 * @param {*} settings - The download settings passed by the frontend.
 */

class Process {
    constructor(url, params, settings) {
        this.url = url;
        this.params = params || ' ';
        this.settings = settings
        this.stdout = undefined;
        this.pid = undefined;
        this.info = null;
    }

    /**
     * function that launch the download process, sets the stdout property and the pid
     * @param {Function} callback not yet implemented
     * @returns {Promise<this>} the process instance
     */
    async start(callback) {
        await this.#__internalGetInfo();

        const ytldp = spawn('./lib/yt-dlp',
            [
                '-o', `${this.settings?.download_path || 'downloads/'}%(title)s.%(ext)s`,
                this.params,
                this.url
            ]
        );

        this.pid = ytldp.pid;
        this.stdout = ytldp.stdout;

        logger('proc', `Spawned a new process, pid: ${this.pid}`)

        await insertDownload(this.url, null, null, null, this.pid);

        return this;
    }

    /**
     * @private
     * function used internally by the download process to fetch information, usually thumbnail and title
     * @returns Promise to the lock
     */
    async #__internalGetInfo() {
        let lock = true;
        let stdoutChunks = [];
        const ytdlpInfo = spawn('./lib/yt-dlp', ['-s', '-j', this.url]);

        ytdlpInfo.stdout.on('data', (data) => {
            stdoutChunks.push(data);
        });

        ytdlpInfo.on('exit', () => {
            try {
                const buffer = Buffer.concat(stdoutChunks);
                const json = JSON.parse(buffer.toString());
                this.info = json;
                this.lock = false;

            } catch (e) {
                this.info = {
                    title: "",
                    thumbnail: "",
                };
            }
        });

        if (!lock) {
            return true;
        }
    }

    /**
     * function that kills the current process
     */
    async kill() {
        spawn('kill', [this.pid]).on('exit', () => {
            deleteDownloadByPID(this.pid).then(() => {
                logger('db', `Deleted ${this.pid} because SIGKILL`)
            })
        });
    }

    /**
     * pid getter function
     * @returns {number} pid
     */
    getPid() {
        if (!this.pid) {
            throw "Process isn't started"
        }
        return this.pid;
    }

    /**
     * stdout getter function
     * @returns {ReadableStream} stdout as stream
     */
    getStdout() {
        return this.stdout
    }

    /**
     * download info getter function
     * @returns {object}
     */
    getInfo() {
        return this.info
    }
}

module.exports = Process;
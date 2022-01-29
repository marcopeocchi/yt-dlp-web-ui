import { spawn } from 'child_process';
import { join } from 'path';
import { Readable } from 'stream';
import { deleteDownloadByPID, insertDownload } from '../db/db';
import Logger from '../utils/BetterLogger';

const log = new Logger();

/**
 * Represents a download process that spawns yt-dlp.
 * @constructor
 * @param {string} url - The downlaod url.
 * @param {Array<String>} params - The cli arguments passed by the frontend.
 * @param {*} settings - The download settings passed by the frontend.
 */

class Process {
    private url: string;
    private params: Array<string>;
    private settings: any;
    private stdout: Readable;
    private pid: number;
    private info: any;
    private lock: boolean;
    private exePath = join(__dirname, 'yt-dlp');

    constructor(url: string, params: Array<string>, settings: any) {
        this.url = url;
        this.params = params || [];
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
    async start(callback?: Function): Promise<this> {
        await this.#__internalGetInfo();

        const ytldp = spawn(this.exePath,
            ['-o', `${this.settings?.download_path || 'downloads/'}%(title)s.%(ext)s`]
                .concat(this.params)
                .concat([this.url])
        );

        this.pid = ytldp.pid;
        this.stdout = ytldp.stdout;

        log.info('proc', `Spawned a new process, pid: ${this.pid}`)

        await insertDownload(this.url, this.info?.title, this.info?.thumbnail, null, this.pid);

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
        const ytdlpInfo = spawn(this.exePath, ['-s', '-j', this.url]);

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
        spawn('kill', [String(this.pid)]).on('exit', () => {
            deleteDownloadByPID(this.pid).then(() => {
                log.info('db', `Deleted ${this.pid} because SIGKILL`)
            })
        });
    }

    /**
     * pid getter function
     * @returns {number} pid
     */
    getPid(): number {
        if (!this.pid) {
            throw "Process isn't started"
        }
        return this.pid;
    }

    /**
     * stdout getter function
     * @returns {Readable} stdout as stream
     */
    getStdout(): Readable {
        return this.stdout
    }

    /**
     * download info getter function
     * @returns {object}
     */
    getInfo(): object {
        return this.info
    }
}

export default Process;
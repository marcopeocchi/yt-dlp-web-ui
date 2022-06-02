import { spawn } from 'child_process';
import { join } from 'path';
import { Readable } from 'stream';
import { ISettings } from '../interfaces/ISettings';
import Logger from '../utils/BetterLogger';
import { availableParams } from '../utils/params';

const log = new Logger();

/**
 * Represents a download process that spawns yt-dlp.
 * @constructor
 * @param url - The downlaod url.
 * @param params - The cli arguments passed by the frontend.
 * @param settings - The download settings passed by the frontend.
 */

class Process {
    private url: string;
    private params: Array<string>;
    private settings: ISettings;
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
     * @param callback not yet implemented
     * @returns the process instance
     */
    public async start(callback?: Function): Promise<this> {
        const sanitizedParams = this.params.filter((param: string) => availableParams.includes(param));

        const ytldp = spawn(this.exePath,
            ['-o', `${this.settings?.download_path || 'downloads/'}%(title)s.%(ext)s`]
                .concat(sanitizedParams)
                .concat([this.url])
        );

        this.pid = ytldp.pid;
        this.stdout = ytldp.stdout;

        log.info('proc', `Spawned a new process, pid: ${this.pid}`)

        return this;
    }

    /**
     * function used internally by the download process to fetch information, usually thumbnail and title
     * @returns Promise to the lock
     */
    public getInfo(): Promise<IDownloadInfo> {
        let stdoutChunks = [];
        const ytdlpInfo = spawn(this.exePath, ['-j', this.url]);

        ytdlpInfo.stdout.on('data', (data) => {
            stdoutChunks.push(data);
        });

        return new Promise((resolve, reject) => {
            ytdlpInfo.on('exit', () => {
                try {
                    const buffer = Buffer.concat(stdoutChunks);
                    const json = JSON.parse(buffer.toString());
                    this.info = json;
                    this.lock = false;
                    resolve({
                        formats: json.formats.map((format: IDownloadInfoSection) => {
                            return {
                                format_id: format.format_id ?? '',
                                format_note: format.format_note ?? '',
                                fps: format.fps ?? '',
                                resolution: format.resolution ?? '',
                                vcodec: format.vcodec ?? '',
                            }
                        }),
                        best: {
                            format_id: json.format_id ?? '',
                            format_note: json.format_note ?? '',
                            fps: json.fps ?? '',
                            resolution: json.resolution ?? '',
                            vcodec: json.vcodec ?? '',
                        },
                        thumbnail: json.thumbnail,
                        title: json.title,
                    });

                } catch (e) {
                    reject('failed fetching formats, downloading best available');
                }
            });
        })
    }

    /**
     * function that kills the current process
     */
    async kill() {
        spawn('kill', [String(this.pid)]).on('exit', () => {
            log.info('db', `Deleted ${this.pid} because SIGKILL`)
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
}

export default Process;
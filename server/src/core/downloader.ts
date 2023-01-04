import { spawn } from 'child_process';
import { from, interval } from 'rxjs';
import { map, throttle } from 'rxjs/operators';
import { Socket } from 'socket.io';
import MemoryDB from '../db/memoryDB';
import { IPayload } from '../interfaces/IPayload';
import { ISettings } from '../interfaces/ISettings';
import { CLIProgress } from '../types';
import Logger from '../utils/BetterLogger';
import Process from './Process';
import { states } from './states';

// settings read from settings.json
let settings: ISettings;
const log = Logger.instance;

const mem_db = new MemoryDB();

try {
    settings = require('../../settings.json');
}
catch (e) {
    new Promise(resolve => setTimeout(resolve, 500))
        .then(() => log.warn('dl', 'settings.json not found, ignore if using Docker'));
}
/**
 * Get download info such as thumbnail, title, resolution and list all formats
 * @param socket 
 * @param url 
 */
export async function getFormatsAndMetadata(socket: Socket, url: string) {
    let p = new Process(url, [], settings);
    try {
        const formats = await p.getMetadata();
        socket.emit('available-formats', formats)
    } catch (e) {
        log.warn('dl', e)
        socket.emit('progress', {
            status: states.PROG_DONE,
            pid: -1,
        });
    } finally {
        p = null;
    }
}

/**
 * Invoke a new download.  
 * Called by the websocket messages listener.
 * @param {Socket} socket current connection socket
 * @param {object} payload frontend download payload
 * @returns 
 */
export async function download(socket: Socket, payload: IPayload) {
    if (!payload || payload.url === '' || payload.url === null) {
        socket.emit('progress', { status: states.PROG_DONE });
        return;
    }

    const url = payload.url;
    const params = typeof payload.params !== 'object' ?
        payload.params.split(' ') :
        payload.params;

    const scopedSettings: ISettings = {
        ...settings,
        download_path: payload.path
    }

    let p = new Process(url, params, scopedSettings);

    p.start().then(downloader => {
        mem_db.add(downloader)
        displayDownloadMetadata(downloader, socket);
        streamProcess(downloader, socket);
    });
}

/**
 * Send via websocket download info "chunk"
 * @param process 
 * @param socket 
 */
function displayDownloadMetadata(process: Process, socket: Socket) {
    process.getMetadata()
        .then(metadata => {
            socket.emit('metadata', {
                pid: process.getPid(),
                metadata: metadata,
            });
        })
        .catch((e) => {
            socket.emit('progress', {
                status: states.PROG_DONE,
                pid: process.getPid(),
            });
            log.warn('dl', e)
        })
}

/**
 * Stream via websocket download stdoud "chunks"
 * @param process 
 * @param socket 
 */
function streamProcess(process: Process, socket: Socket) {
    const emitAbort = () => {
        socket.emit('progress', {
            status: states.PROG_DONE,
            pid: process.getPid(),
        });
    }

    from(process.getStdout().removeAllListeners())                            // stdout as observable
        .pipe(
            throttle(() => interval(500)),  // discard events closer than 500ms
            map(stdout => formatter(String(stdout), process.getPid()))
        )
        .subscribe({
            next: (stdout) => {
                socket.emit('progress', stdout)
            },
            complete: () => {
                process.kill().then(() => {
                    emitAbort();
                    mem_db.remove(process);
                });
            },
            error: () => {
                emitAbort();
                mem_db.remove(process);
            }
        });
}

/**
 * Retrieve all downloads.  
 * If the server has just been launched retrieve the ones saved to the database.  
 * If the server is running fetches them from the process pool.
 * @param {Socket} socket current connection socket
 * @returns 
 */
export async function retrieveDownload(socket: Socket) {
    // it's a cold restart: the server has just been started with pending
    // downloads, so fetch them from the database and resume.

    // if (coldRestart) {
    //     coldRestart = false;
    //     let downloads = [];
    //     // sanitize
    //     downloads = [...new Set(downloads.filter(el => el !== undefined))];
    //     log.info('dl', `Cold restart, retrieving ${downloads.length} jobs`)
    //     for (const entry of downloads) {
    //         if (entry) {
    //             await download(socket, entry);
    //         }
    //     }
    //     return;
    // }

    // it's an hot-reload the server it's running and the frontend ask for
    // the pending job: retrieve them from the "in-memory database" (ProcessPool)

    const _poolSize = mem_db.size()
    log.info('dl', `Retrieving ${_poolSize} jobs from pool`)
    socket.emit('pending-jobs', _poolSize)

    const it = mem_db.iterator();

    // resume the jobs
    for (const entry of it) {
        const [, process] = entry
        displayDownloadMetadata(process, socket);
        streamProcess(process, socket);
    }
}

/**
 * Abort a specific download if pid is provided, in the other case
 * calls the abortAllDownloads function
 * @see abortAllDownloads
 * @param {Socket} socket currenct connection socket
 * @param {*} args args sent by the frontend. MUST contain the PID.
 * @returns 
 */
export function abortDownload(socket: Socket, args: any) {
    if (!args) {
        abortAllDownloads(socket);
        return;
    }
    const { pid } = args;

    spawn('kill', [pid])
        .on('exit', () => {
            socket.emit('progress', {
                status: states.PROC_ABORT,
                process: pid,
            });
            log.warn('dl', `Aborting download ${pid}`);
        });
}

/**
 * Unconditionally kills all yt-dlp process.
 * @param {Socket} socket currenct connection socket
 */
export function abortAllDownloads(socket: Socket) {
    spawn('killall', ['yt-dlp'])
        .on('exit', () => {
            socket.emit('progress', { status: states.PROC_ABORT });
            log.info('dl', 'Aborting downloads');
        });
    mem_db.flush();
}

/**
 * Get pool current size
 */
export function getQueueSize(): number {
    return mem_db.size();
}

/**
 * @private Formats the yt-dlp stdout to a frontend-readable format
 * @param {string} stdout stdout as string
 * @param {number} pid current process id relative to stdout
 * @returns 
 */
const formatter = (stdout: string, pid: number) => {
    try {
        const p: CLIProgress = JSON.parse(stdout);
        if (p) {
            return {
                status: states.PROC_DOWNLOAD,
                progress: p.percentage,
                size: p.size,
                dlSpeed: p.speed,
                pid: pid,
            }
        }
    } catch (e) {
        return {
            progress: 0,
        }
    }
}

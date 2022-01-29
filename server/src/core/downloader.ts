import { spawn } from 'child_process';
import { from, interval } from 'rxjs';
import { throttle } from 'rxjs/operators';
import { pruneDownloads } from '../db/db';
import { killProcess } from '../utils/procUtils';
import Logger from '../utils/BetterLogger';
import Process from './Process';
import ProcessPool from './ProcessPool';
import { Socket } from 'socket.io';
import { IPayload } from '../interfaces/IPayload';

// settings read from settings.json
let settings;
let coldRestart = true;
const log = new Logger();

const pool = new ProcessPool();

try {
    settings = require('../settings.json');
}
catch (e) {
    console.warn("settings.json not found");
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
        socket.emit('progress', { status: 'Done!' });
        return;
    }

    const url = payload.url;
    const params = typeof payload.params !== 'object' ?
        payload.params.split(' ') :
        payload.params;

    const p = new Process(url, params, settings);

    p.start().then(downloader => {

        pool.add(p)
        let infoLock = true;
        let pid = downloader.getPid();

        from(downloader.getStdout())              // stdout as observable
            .pipe(throttle(() => interval(500)))  // discard events closer than 500ms
            .subscribe({
                next: (stdout) => {
                    if (infoLock) {
                        if (downloader.getInfo() === null) {
                            return;
                        }
                        socket.emit('info', {
                            pid: pid, info: downloader.getInfo()
                        });
                        infoLock = false;
                    }
                    socket.emit('progress', formatter(String(stdout), pid)) // finally, emit
                },
                complete: () => {
                    downloader.kill().then(() => {
                        socket.emit('progress', {
                            status: 'Done!',
                            pid: pid,
                        })
                        pool.remove(downloader);
                    })
                },
                error: () => {
                    socket.emit('progress', {
                        status: 'Done!', pid: pid
                    });
                }
            });
    })
}

/**
 * Retrieve all downloads.  
 * If the server has just been launched retrieve the ones saved to the database.  
 * If the server is running fetches them from the process pool.
 * @param {Socket} socket current connection socket
 * @returns 
 */
export async function retriveDownload(socket: Socket) {
    // it's a cold restart: the server has just been started with pending
    // downloads, so fetch them from the database and resume.
    if (coldRestart) {
        coldRestart = false;
        let downloads = await pruneDownloads();
        downloads = [... new Set(downloads)];
        log.info('dl', `Cold restart, retrieving ${downloads.length} jobs`)
        for (const entry of downloads) {
            if (entry) {
                await download(socket, entry);
            }
        }
        return;
    }

    // it's an hot-reload the server it's running and the frontend ask for
    // the pending job: retrieve them from the "in-memory database" (ProcessPool)
    log.info('dl', `Retrieving ${pool.size()} jobs from pool`)

    const it = pool.iterator();
    const tempWorkQueue = new Array();

    // sanitize
    for (const entry of it) {
        const [pid, process] = entry;
        pool.removeByPid(pid);
        await killProcess(pid);
        tempWorkQueue.push(process);
    }

    // resume the jobs
    for (const entry of tempWorkQueue) {
        await download(socket, {
            url: entry.url,
            params: entry.params,
        });
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
                status: 'Aborted',
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
            socket.emit('progress', { status: 'Aborted' });
            log.info('dl', 'Aborting downloads');
        });
}

/**
 * @private Formats the yt-dlp stdout to a frontend-readable format
 * @param {string} stdout stdout as string
 * @param {number} pid current process id relative to stdout
 * @returns 
 */
const formatter = (stdout: string, pid: number) => {
    const cleanStdout = stdout
        .replace(/\s\s+/g, ' ')
        .split(' ');
    const status = cleanStdout[0].replace(/\[|\]|\r/g, '');
    switch (status) {
        case 'download':
            return {
                status: cleanStdout[0].replace(/\[|\]|\r/g, ''),
                progress: cleanStdout[1],
                size: cleanStdout[3],
                dlSpeed: cleanStdout[5],
                pid: pid,
            }
        case 'merge':
            return {
                status: 'merging',
                progress: '100',
            }
        default:
            return { progress: '0' }
    }
}

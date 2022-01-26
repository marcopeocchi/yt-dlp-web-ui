const { spawn } = require('child_process');
const { from, interval } = require('rxjs');
const { throttle } = require('rxjs/operators');
const { Socket } = require('socket.io');
const { pruneDownloads } = require('./db');
const { logger } = require('./logger');
const Process = require('./Process');
const ProcessPool = require('./ProcessPool');
const { killProcess } = require('./procUtils');

// settings read from settings.json
let settings;
let coldRestart = true;

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
async function download(socket, payload) {
    if (!payload || payload.url === '' || payload.url === null) {
        socket.emit('progress', { status: 'Done!' });
        return;
    }

    const url = payload.url
    const params = payload.params?.xa ? '-x' : '';

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
                        socket.emit('info', downloader.getInfo());
                        infoLock = false;
                    }
                    socket.emit('progress', formatter(String(stdout), pid)) // finally, emit
                },
                complete: () => {
                    downloader.kill().then(() => {
                        socket.emit('progress', {
                            status: 'Done!',
                            process: pid,
                        })
                        pool.remove(downloader);
                    })
                },
                error: () => {
                    socket.emit('progress', { status: 'Done!' });
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
async function retriveDownload(socket) {
    // it's a cold restart: the server has just been started with pending
    // downloads, so fetch them from the database and resume.
    if (coldRestart) {
        coldRestart = false;
        let downloads = await pruneDownloads();
        downloads = [... new Set(downloads)];
        logger('dl', `Cold restart, retrieving ${downloads.length} jobs`)
        for (const entry of downloads) {
            if (entry) {
                await download(socket, entry);
            }
        }
        return;
    }

    // it's an hot-reload the server it's running and the frontend ask for
    // the pending job: retrieve them from the "in-memory database" (ProcessPool)
    logger('dl', `Retrieving jobs from pool`)
    const it = pool.iterator();

    for (const entry of it) {
        const [pid, process] = entry;
        await killProcess(pid);
        await download(socket, {
            url: process.url,
            params: process.params
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
function abortDownload(socket, args) {
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
            logger('dl', `Aborting download ${pid}`);
        });
}

/**
 * Unconditionally kills all yt-dlp process.
 * @param {Socket} socket currenct connection socket
 */
function abortAllDownloads(socket) {
    spawn('killall', ['yt-dlp'])
        .on('exit', () => {
            socket.emit('progress', { status: 'Aborted' });
            logger('dl', 'Aborting downloads');
        });
}

/**
 * @private Formats the yt-dlp stdout to a frontend-readable format
 * @param {string} stdout stdout as string
 * @param {number} pid current process id relative to stdout
 * @returns 
 */
const formatter = (stdout, pid) => {
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

module.exports = {
    download: download,
    abortDownload: abortDownload,
    abortAllDownloads: abortAllDownloads,
    retriveDownload: retriveDownload,
}

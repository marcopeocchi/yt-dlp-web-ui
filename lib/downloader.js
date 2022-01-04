const { spawn } = require('child_process');
const { from, interval } = require('rxjs');
const { throttle } = require('rxjs/operators');
const { insertDownload, deleteDownloadByPID, pruneDownloads } = require('./db');
const { logger } = require('./logger');
const { retriveStdoutFromProcFd, killProcess } = require('./procUtils');
let settings;

try {
    settings = require('../settings.json');
}
catch (e) {
    console.warn("settings.json not found");
}

const isWindows = process.platform === 'win32';

async function download(socket, payload) {

    if (!payload || payload.url === '' || payload.url === null) {
        socket.emit('progress', { status: 'Done!' });
        return;
    }

    const url = payload.url
    const params = payload.params?.xa ? '-x' : '';

    await getDownloadInfo(socket, url);

    const ytldp = spawn(`./lib/yt-dlp${isWindows ? '.exe' : ''}`,
        [
            '-o', `${settings.download_path || 'downloads/'}%(title)s.%(ext)s`,
            params,
            url
        ]
    );

    await insertDownload(url, null, null, null, ytldp.pid);

    from(ytldp.stdout)  // stdout as observable
        .pipe(throttle(() => interval(500)))  // discard events closer than 500ms
        .subscribe({
            next: (stdout) => {
                //let _stdout = String(stdout)
                socket.emit('progress', formatter(String(stdout))) // finally, emit
                //logger('download', `Fetching ${_stdout}`)
            },
            complete: () => {
                socket.emit('progress', { status: 'Done!' })
            }
        });

    ytldp.on('exit', () => {
        socket.emit('progress', { status: 'Done!' })
        logger('download', 'Done!')

        deleteDownloadByPID(ytldp.pid).then(() => {
            logger('db', `Deleted ${ytldp.pid} because SIGKILL`)
        })
    })
}

async function retriveDownload(socket) {
    const downloads = await pruneDownloads();

    if (downloads.length > 0) {
        for (const _download of downloads) {
            await killProcess(_download.process_pid);
            await download(socket, _download.url);
        }
    }
}

async function getDownloadInfo(socket, url) {
    let stdoutChunks = [];
    const ytdlpInfo = spawn(`./lib/yt-dlp${isWindows ? '.exe' : ''}`, ['-s', '-j', url]);

    ytdlpInfo.stdout.on('data', (data) => {
        stdoutChunks.push(data);
    });

    ytdlpInfo.on('exit', () => {
        try {
            const buffer = Buffer.concat(stdoutChunks);
            const json = JSON.parse(buffer.toString());
            socket.emit('info', json);
        } catch (e) {
            socket.emit('progress', { status: 'Aborted' });
            logger('download', 'Done!');
        }
    })
}

function abortDownload(socket) {
    const res = process.platform === 'win32' ?
        spawn('taskkill', ['/IM', 'yt-dlp.exe', '/F', '/T']) :
        spawn('killall', ['yt-dlp']);
    res.on('exit', () => {
        socket.emit('progress', { status: 'Aborted' });
        logger('download', 'Aborting downloads');
    });
}

const formatter = (stdout) => {
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
    retriveDownload: retriveDownload,
}

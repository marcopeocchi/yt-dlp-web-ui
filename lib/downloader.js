const { spawn } = require('child_process');
const logger = require('./logger');
const { from, interval } = require('rxjs');
const { throttle } = require('rxjs/operators');
let settings;

try {
    settings = require('../settings.json')
}
catch (e) {
    console.warn("settings.json not found")
}

const isWindows = process.platform === 'win32'

const download = (socket, url) => {
    if (url === '' || url === null) {
        socket.emit('progress', { status: 'Done!' })
        return
    }

    getDownloadInfo(socket, url)

    const ytldp = spawn(`./lib/yt-dlp${isWindows ? '.exe' : ''}`,
        ['-o', `${settings.download_path || 'downloads/'}%(title)s.%(ext)s`, url]
    )

    from(ytldp.stdout)  // stdout as observable
        .pipe(throttle(() => interval(500)))  // discard events closer than 500ms
        .subscribe({
            next: (stdout) => {
                //let _stdout = String(stdout)
                socket.emit('progress', formatter(String(stdout))) // finally, emit
                //logger('download', `Fetching ${stdout}`)
            },
            complete: () => {
                socket.emit('progress', { status: 'Done!' })
            }
        })

    ytldp.on('exit', () => {
        socket.emit('progress', { status: 'Done!' })
        logger('download', 'Done!')
    })
}

const getDownloadInfo = (socket, url) => {
    let stdoutChunks = [];
    const ytdlpInfo = spawn(`./lib/yt-dlp${isWindows ? '.exe' : ''}`, ['-s', '-j', url]);

    ytdlpInfo.stdout.on('data', (data) => {
        stdoutChunks.push(data)
    })

    ytdlpInfo.on('exit', () => {
        const buffer = Buffer.concat(stdoutChunks)
        const json = JSON.parse(buffer.toString())
        socket.emit('info', json)
    })
}

const abortDownload = (socket) => {
    const res = process.platform === 'win32' ?
        spawn('taskkill', ['/IM', 'yt-dlp.exe', '/F', '/T']) :
        spawn('killall', ['yt-dlp'])
    res.on('exit', () => {
        socket.emit('progress', 'Aborted!')
        logger('download', 'Aborting downloads')
    })
}

const formatter = (stdout) => {
    const cleanStdout = stdout
        .replace(/\s\s+/g, ' ')
        .split(' ')
    const status = cleanStdout[0].replace(/\[|\]|\r/g, '')
    switch (status) {
        case 'download':
            return {
                status: cleanStdout[0].replace(/\[|\]|\r/g, ''),
                progress: cleanStdout[1],
                size: cleanStdout[3],
                dlSpeed: cleanStdout[5],
            }
        case 'merger':
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
}

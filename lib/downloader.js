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
    const ytldp = spawn(`./lib/yt-dlp${isWindows ? '.exe' : ''}`,
        ['-o', `${settings.download_path || 'downloads/'}%(title)s.%(ext)s`, url]
    )
    ytldp.stdout.on('data', data => {
        // reactive programming magic
        from(Promise.resolve(data))  // stout as promise => Observable
            .pipe(throttle(() => interval(500)))  // discard events closer than 500ms
            .subscribe({
                next: () => {
                    socket.emit('progress', data.toString()) // finally, emit
                    logger('download', `Fetching ${data.toString()}`)
                }
            })
    })
    ytldp.on('exit', () => {
        socket.emit('progress', 'Done!')
        logger('download', 'Done!')
    })
}

const abortDownload = (socket) => {
    const res = process.platform === 'win32' ?
        spawn('taskkill', ['/IM', 'yt-dlp.exe', '/F', '/T']) :
        spawn('killall', ['yt-dlp'])
    res.stdout.on('data', data => {
        socket.emit('progress', 'Aborted!')
        logger('download', `Aborting ${data.toString()}`)
    })
    logger('download', 'Aborted')
}

module.exports = {
    download: download,
    abortDownload: abortDownload
}
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

    from(ytldp.stdout)  // stout as observable
        .pipe(throttle(() => interval(500)))  // discard events closer than 500ms
        .subscribe({
            next: (stdout) => {
                let _stdout = String(stdout)
                socket.emit('progress', formatter(_stdout)) // finally, emit
                //logger('download', `Fetching ${stdout}`)
                console.log(formatter(_stdout))
            },
            complete: () => {
                socket.emit('progress', { status: 'Done!' })
                logger('download', 'Done!')
            }
        })

    ytldp.on('exit', () => {
        socket.emit('progress', { status: 'Done!' })
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
    abortDownload: abortDownload
}
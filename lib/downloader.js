const { spawn } = require('child_process');
const logger = require('./logger');
let settings;

try {
    settings = require('../settings.json');
}
catch (e) {
    console.warn("settings.json not found")
}

const isWindows = process.platform === 'win32';

const download = (socket, url) => {
    const ytldp = spawn(`./lib/yt-dlp${isWindows ? '.exe' : ''}`,
        ['-o', `${settings.download_path || './downloads/'}%(title)s.%(ext)s`, url]
    )

    ytldp.stdout.on('data', data => {
        socket.emit('progress', data.toString())
        console.log(data.toString())
    })
    ytldp.on('exit', () => {
        socket.emit('progress', 'Done!')
    })
}

const abortDownload = (socket) => {
    const res = process.platform === 'win32' ?
        spawn('taskkill', ['/IM', 'yt-dlp.exe', '/F', '/T']) :
        spawn('killall', ['yt-dlp'])
    res.stdout.on('data', data => {
        socket.emit('progress', 'Aborted!')
        console.log(data.toString())
    })
    logger('download', 'Aborted')
}

module.exports = {
    download: download,
    abortDownload: abortDownload
}
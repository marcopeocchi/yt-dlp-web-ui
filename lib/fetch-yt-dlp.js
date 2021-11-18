const https = require('https');
const path = require('path');
const fs = require('fs');

const isWindows = process.platform === 'win32';

const file = fs.createWriteStream(path.join(
    __dirname, `yt-dlp${isWindows ? '.exe' : ''}`
));

https.get(
    isWindows ?
        'https://github.com/yt-dlp/yt-dlp/releases/download/2021.11.10.1/yt-dlp.exe' :
        'https://github.com/yt-dlp/yt-dlp/releases/download/2021.11.10.1/yt-dlp',
    res => res.pipe(file)
);
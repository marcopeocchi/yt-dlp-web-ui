const https = require('https');
const fs = require('fs');
const path = require('path');

// endpoint to github API
const options = {
    hostname: 'api.github.com',
    path: '/repos/yt-dlp/yt-dlp/releases/latest',
    headers: {
        'User-Agent': 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:88.0) Gecko/20100101 Firefox/88.0'
    },
    method: 'GET',
    port: 443,
}

// build the binary url based on the release tag
function buildDonwloadOptions(release) {
    return {
        hostname: 'github.com',
        path: `/yt-dlp/yt-dlp/releases/download/${release}/yt-dlp`,
        headers: {
            'User-Agent': 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:88.0) Gecko/20100101 Firefox/88.0'
        },
        method: 'GET',
        port: 443,
    }
}

// main
async function update() {
    // ensure that the binary has been removed
    try {
        fs.rmSync(path.join(__dirname, 'yt-dlp'))
    }
    catch (e) {
        console.log('file not found!')
    }
    // body buffer
    let chunks = []
    https.get(options, res => {
        // push the http packets chunks into the buffer
        res.on('data', chunk => {
            chunks.push(chunk)
        });
        // the connection has ended so build the body from the buffer
        // parse it as a JSON and get the tag_name
        res.on('end', () => {
            const buffer = Buffer.concat(chunks)
            const release = JSON.parse(buffer.toString())['tag_name']
            console.log('The latest release is:', release)
            // invoke the binary downloader
            downloadBinary(buildDonwloadOptions(release))
        })
    })
}

function downloadBinary(url) {
    https.get(url, res => {
        // if it is a redirect follow the url
        if (res.statusCode === 301 || res.statusCode === 302) {
            return downloadBinary(res.headers.location)
        }
        let bin = fs.createWriteStream(path.join(__dirname, 'yt-dlp'))
        res.pipe(bin)
        // once the connection has ended make the file executable
        res.on('end', () => {
            fs.chmod(path.join(__dirname, 'yt-dlp'), 0o775, err => {
                err ? console.error('failed updating!') : console.log('done!')
            })
        })
    })
}

function updateFromFrontend(socket) {
    update().then(() => {
        socket.emit('updated')
    })
}

module.exports = {
    ytdlpUpdater: updateFromFrontend
}
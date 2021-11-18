const Koa = require('koa');
const serve = require('koa-static');
const { Server } = require('socket.io');
const path = require('path');
const { createServer } = require('http');
const cors = require('@koa/cors');
const logger = require('./lib/logger');
const { download, abortDownload } = require('./lib/downloader');

const app = new Koa()
const server = createServer(app.callback())
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
})

io.on('connection', socket => {
    logger('ws', 'connesso')

    socket.on('send-url', args => {
        logger('ws', args)
        download(socket, args)
    })

    socket.on('abort', () => {
        abortDownload(socket)
    })
});

io.on('disconnect', () => {
    logger('ws', 'disconnesso')
});

app
    .use(cors())
    .use(serve(path.join(__dirname, 'dist')))

console.log('[koa] Server started port', 3000)

server.listen(3000)
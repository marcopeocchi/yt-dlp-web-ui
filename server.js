const Koa = require('koa'),
    serve = require('koa-static'),
    cors = require('@koa/cors'),
    { logger, splash } = require('./server/logger'),
    { join } = require('path'),
    { Server } = require('socket.io'),
    { createServer } = require('http'),
    { ytdlpUpdater } = require('./server/updater'),
    {
        download,
        abortDownload,
        retriveDownload,
        abortAllDownloads,
    } = require('./server/downloader'),
    db = require('./server/db');

const app = new Koa()
const server = createServer(app.callback())
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
})

/*
    WebSocket listeners
*/
io.on('connection', socket => {
    logger('ws', `${socket.handshake.address} connected!`)

    socket.on('send-url', (args) => {
        logger('ws', args?.url)
        download(socket, args)
    })
    socket.on('abort', (args) => {
        abortDownload(socket, args)
    })
    socket.on('abort-all', () => {
        abortAllDownloads(socket)
    })
    socket.on('update-bin', () => {
        ytdlpUpdater(socket)
    })
    socket.on('fetch-jobs', () => {
        socket.emit('pending-jobs', db.retrieveAll())
    })
    socket.on('retrieve-jobs', () => {
        retriveDownload(socket)
    })
})

io.on('disconnect', (socket) => {
    logger('ws', `${socket.handshake.address} disconnected`)
})

app
    .use(cors())
    .use(serve(join(__dirname, 'dist')))

splash()
logger('koa', `Server started on port ${process.env.PORT || 3022}`)

db.init()
    .then(() => server.listen(process.env.PORT || 3022))
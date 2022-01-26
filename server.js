const Koa = require('koa'),
    serve = require('koa-static'),
    cors = require('@koa/cors'),
    { logger, splash } = require('./lib/logger'),
    { join } = require('path'),
    { Server } = require('socket.io'),
    { createServer } = require('http'),
    { ytdlpUpdater } = require('./lib/updater'),
    {
        download,
        abortDownload,
        retriveDownload,
        abortAllDownloads
    } = require('./lib/downloader'),
    db = require('./lib/db');

const app = new Koa()
const server = createServer(app.callback())
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
})

io.on('connection', socket => {
    logger('ws', `${socket.handshake.address} connected!`)
    // message listeners
    socket.on('send-url', args => {
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
    socket.on('fetch-jobs', async () => {
        socket.emit('pending-jobs', await db.retrieveAll())
    })
    socket.on('retrieve-jobs', async () => {
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
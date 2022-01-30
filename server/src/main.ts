import Koa from 'koa';
import serve from 'koa-static';
import cors from '@koa/cors';
import { logger, splash } from './utils/logger';
import { join } from 'path';
import { Server } from 'socket.io';
import { createServer } from 'http';
import { ytdlpUpdater } from './utils/updater';
import { download, abortDownload, retriveDownload, abortAllDownloads } from './core/downloader';
import Logger from './utils/BetterLogger';
import { retrieveAll, init } from './db/db';
import { getFreeDiskSpace } from './utils/procUtils';

const app = new Koa()
const log = new Logger()
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
        socket.emit('pending-jobs', retrieveAll())
    })
    socket.on('retrieve-jobs', () => {
        retriveDownload(socket)
    })
    socket.on('disk-space', () => {
        getFreeDiskSpace(socket)
    })
})

io.on('disconnect', (socket) => {
    logger('ws', `${socket.handshake.address} disconnected`)
})

app
    .use(cors())
    .use(serve(join(__dirname, 'frontend')))

splash()
log.info('koa', `Server started on port ${process.env.PORT || 3022}`)

init()
    .then(() => server.listen(process.env.PORT || 3022))
    .catch(err => log.err('db', err))

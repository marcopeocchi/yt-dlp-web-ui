import { logger, splash } from './utils/logger';
import { join } from 'path';
import { Server } from 'socket.io';
import { ytdlpUpdater } from './utils/updater';
import { download, abortDownload, retrieveDownload, abortAllDownloads, getFormatsAndInfo } from './core/downloader';
import { getFreeDiskSpace } from './utils/procUtils';
import Logger from './utils/BetterLogger';
import { listDownloaded } from './core/downloadArchive';
import { createServer } from 'http';
import * as Koa from 'koa';
import * as Router from 'koa-router';
import * as serve from 'koa-static';
import * as cors from '@koa/cors';
import { streamer } from './core/streamer';

const app = new Koa();
const server = createServer(app.callback());
const router = new Router();
const log = new Logger();
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Koa routing

router.get('/settings', (ctx, next) => {
    ctx.redirect('/')
    next()
})
router.get('/downloaded', (ctx, next) => {
    ctx.redirect('/')
    next()
})
router.get('/getAllDownloaded', (ctx, next) => {
    listDownloaded(ctx, next)
})
router.get('/stream/:filepath', (ctx, next) => {
    streamer(ctx, next)
})

// WebSocket listeners

io.on('connection', socket => {
    logger('ws', `${socket.handshake.address} connected!`)

    socket.on('send-url', (args) => {
        logger('ws', args?.url)
        download(socket, args)
    })
    socket.on('send-url-format-selection', (args) => {
        logger('ws', args?.url)
        if (args.url) getFormatsAndInfo(socket, args?.url)
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
    socket.on('retrieve-jobs', () => {
        retrieveDownload(socket)
    })
    socket.on('disk-space', () => {
        getFreeDiskSpace(socket)
    })
})

io.on('disconnect', (socket) => {
    logger('ws', `${socket.handshake.address} disconnected`)
})

app.use(serve(join(__dirname, 'frontend')))
app.use(router.routes())
app.use(cors())

server.listen(process.env.PORT || 3022)

splash()
log.info('http', `Server started on port ${process.env.PORT || 3022}`)

/**
 * Cleanup handler
 */
const gracefullyStop = () => {
    log.warn('proc', 'Shutting down...')
    io.disconnectSockets(true)
    server.close()
    log.info('proc', 'Done!')
    process.exit(0)
}

// Intercepts singnals and perform cleanups before shutting down.
process
    .on('SIGTERM', () => gracefullyStop())
    .on('SIGUSR1', () => gracefullyStop())
    .on('SIGUSR2', () => gracefullyStop())

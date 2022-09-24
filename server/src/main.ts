import { splash } from './utils/logger';
import { join } from 'path';
import { Server } from 'socket.io';
import { ytdlpUpdater } from './utils/updater';
import {
    download,
    abortDownload,
    retrieveDownload,
    abortAllDownloads,
    getFormatsAndMetadata
} from './core/downloader';
import { getFreeDiskSpace } from './utils/procUtils';
import { listDownloaded } from './core/downloadArchive';
import { createServer } from 'http';
import { streamer } from './core/streamer';
import * as Koa from 'koa';
import * as Router from 'koa-router';
import * as serve from 'koa-static';
import * as cors from '@koa/cors';
import Logger from './utils/BetterLogger';
import { ISettings } from './interfaces/ISettings';
import { directoryTree } from './utils/directoryUtils';

const app = new Koa();
const server = createServer(app.callback());
const router = new Router();
const log = Logger.instance;
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

let settings: ISettings;

try {
    settings = require('../settings.json');
} catch (e) {
    log.warn('settings', 'file not found, ignore if using Docker');
}

// Koa routing
router.get('/settings', (ctx, next) => {
    ctx.redirect('/')
    next()
})
router.get('/downloaded', (ctx, next) => {
    ctx.redirect('/')
    next()
})
router.get('/archive', (ctx, next) => {
    listDownloaded(ctx)
        .then((res: any) => {
            ctx.body = res
            next()
        })
        .catch((err: any) => {
            ctx.body = err;
            next()
        })
})
router.get('/stream/:filepath', (ctx, next) => {
    streamer(ctx, next)
})
router.get('/tree', (ctx, next) => {
    ctx.body = directoryTree()
    next()
})

// WebSocket listeners
io.on('connection', socket => {
    log.info('ws', `${socket.handshake.address} connected!`)

    socket.on('send-url', (args) => {
        log.info('ws', args?.url)
        download(socket, args)
    })
    socket.on('send-url-format-selection', (args) => {
        log.info('ws', `Formats ${args?.url}`)
        if (args.url) getFormatsAndMetadata(socket, args?.url)
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
    log.info('ws', `${socket.handshake.address} disconnected`)
})

app.use(serve(join(__dirname, 'frontend')))
app.use(cors())
app.use(router.routes())

server.listen(process.env.PORT || settings.port || 3022)

splash()
log.info('http', `Server started on port ${process.env.PORT || settings.port || 3022}`)

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

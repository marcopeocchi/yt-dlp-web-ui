import { logger, splash } from './utils/logger';
import { join } from 'path';
import { Server } from 'socket.io';
import { ytdlpUpdater } from './utils/updater';
import { download, abortDownload, retrieveDownload, abortAllDownloads } from './core/downloader';
import { init } from './db/db';
import { getFreeDiskSpace } from './utils/procUtils';
import Logger from './utils/BetterLogger';
import Jean from './core/HTTPServer';

const server = new Jean(join(__dirname, 'frontend')).createServer();
const log = new Logger();
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


splash()
log.info('http', `Server started on port ${process.env.PORT || 3022}`)

init()
    .then(() => server.listen(process.env.PORT || 3022))
    .catch(err => log.err('db', err))


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

/* Intercepts singnals and perform cleanups before shutting down. */
process
    .on('SIGTERM', () => gracefullyStop())
    .on('SIGUSR1', () => gracefullyStop())
    .on('SIGUSR2', () => gracefullyStop())

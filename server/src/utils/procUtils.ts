import { exec, spawn } from 'child_process';
import fs = require('fs');
// import net = require('net');
import { logger } from './logger';

/**
 * Browse /proc in order to find the specific pid
 * @param {number} pid 
 * @returns {*} process stats if any
 */
export function existsInProc(pid: number): any {
    try {
        return fs.statSync(`/proc/${pid}`)
    } catch (e) {
        logger('proc', `pid ${pid} not found in procfs`)
    }
}

/*
function retriveStdoutFromProcFd(pid) {
    if (existsInProc(pid)) {
        const unixSocket = fs.readlinkSync(`/proc/${pid}/fd/1`).replace('socket:[', '127.0.0.1:').replace(']', '')
        if (unixSocket) {
            console.log(unixSocket)
            logger('proc', `found pending job on pid: ${pid} attached to UNIX socket: ${unixSocket}`)
            return net.createConnection(unixSocket)
        }
    }
}
*/

/**
 * Kills a process with a sys-call
 * @param {number} pid the killed process pid
 */
export async function killProcess(pid: number) {
    const res = spawn('kill', [String(pid)])
    res.on('exit', () => {
        logger('proc', `Successfully killed yt-dlp process, pid: ${pid}`)
    })
}

export function getFreeDiskSpace(socket: any) {
    let buffer: string = '';
    let message: string = 'free-space';
    exec("df -h / | tail -1 | awk '{print $4}'", (_, stdout) => {
        socket.emit(message, stdout)
    })
}
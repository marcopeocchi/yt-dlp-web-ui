import { exec, spawn } from 'child_process';
import { statSync } from 'fs';
import Logger from './BetterLogger';

const log = Logger.instance;

/**
 * Browse /proc in order to find the specific pid
 * @param {number} pid 
 * @returns {*} process stats if any
 */
export function existsInProc(pid: number): any {
    try {
        return statSync(`/proc/${pid}`)
    } catch (e) {
        log.warn('proc', `pid ${pid} not found in procfs`)
    }
}

/**
 * Kills a process with a sys-call
 * @param {number} pid the killed process pid
 */
export async function killProcess(pid: number) {
    const res = spawn('kill', [String(pid)])
    res.on('exit', () => {
        log.info('proc', `Successfully killed yt-dlp process, pid: ${pid}`)
    })
}

export function getFreeDiskSpace(socket: any, path: string) {
    const message: string = 'free-space';
    exec(`df -h ${path} | tail -1 | awk '{print $4}'`, (_, stdout) => {
        socket.emit(message, stdout)
    })
}
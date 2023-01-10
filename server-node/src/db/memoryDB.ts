/**
 * Represents a download process that spawns yt-dlp.
 */

import Process from "../core/Process";

class MemoryDB {
    private _pool: Map<number, Process>
    private _size: number

    constructor() {
        this.init()
    }

    private init() {
        this._pool = new Map<number, Process>()
        this._size = 0
    }

    /**
     * Pool size getter
     * @returns {number} pool's size
     */
    size(): number {
        return this._size
    }

    /**
     * Add a process to the pool
     * @param {Process} process 
     */
    add(process: Process) {
        this._pool.set(process.getPid(), process)
        this._size++
    }

    /**
     * Delete a process from the pool
     * @param {Process} process 
     */
    remove(process: Process) {
        if (this._size === 0) return
        this._pool.delete(process.getPid())
        this._size--
    }

    /**
     * Delete a process from the pool by its pid
     * @param {number} pid 
     */
    removeByPid(pid: number) {
        this._pool.delete(pid)
    }

    /**
     * get an iterator for the pool
     * @returns {IterableIterator} iterator 
     */
    iterator(): IterableIterator<[number, Process]> {
        return this._pool.entries()
    }

    /**
     * get a process by its pid
     * @param {number} pid 
     * @returns {Process}
     */
    getByPid(pid: number): Process {
        return this._pool.get(pid)
    }

    /**
     * Clear memory db
     */
    flush() {
        this.init()
    }
}

export default MemoryDB;
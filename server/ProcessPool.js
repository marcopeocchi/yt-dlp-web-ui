/**
 * @class
 * Represents a download process that spawns yt-dlp.
 */

class ProcessPool {
    constructor() {
        this._pool = new Map();
        this._size = 0;
    }

    /**
     * Pool size getter
     * @returns {number} pool's size
     */
    size() {
        return this._size;
    }

    /**
     * Add a process to the pool
     * @param {Process} process 
     */
    add(process) {
        this._pool.set(process.getPid(), process)
    }

    /**
     * Delete a process from the pool
     * @param {Process} process 
     */
    remove(process) {
        this._pool.delete(process.getPid())
    }

    /**
     * Delete a process from the pool by its pid
     * @param {number} pid 
     */
    removeByPid(pid) {
        this._pool.delete(pid)
    }

    /**
     * get an iterator for the pool
     * @returns {IterableIterator} iterator 
     */
    iterator() {
        return this._pool.entries()
    }

    /**
     * get a process by its pid
     * @param {number} pid 
     * @returns {Process}
     */
    getByPid(pid) {
        return this._pool.get(pid)
    }
}

module.exports = ProcessPool;
const uuid = require('uuid')
const { logger } = require('./logger')
const { existsInProc } = require('./procUtils')

const db = require('better-sqlite3')('downloads.db')

async function init() {
    try {
        db.exec(`CREATE TABLE downloads (
            uid varchar(36) NOT NULL,
            url text NOT NULL,
            title text,
            thumbnail text,
            created date,
            size text,
            process_pid int NOT NULL,
            PRIMARY KEY (uid)
        )`)
    } catch (e) {
        logger('db', 'Table already created, ignoring')
    }
}

async function get_db() {
    return db
}

async function insertDownload(url, title, thumbnail, size, PID) {
    const uid = uuid.v1()
    db
        .prepare(`
            INSERT INTO downloads 
                (uid, url, title, thumbnail, size, process_pid) 
                VALUES (?, ?, ?, ?, ?, ?)`
        )
        .run(uid, url, title, thumbnail, size, PID)

    return uid
}

async function retrieveAll() {
    return db
        .prepare('SELECT * FROM downloads')
        .all()
}

async function deleteDownloadById(uid) {
    db.prepare(`DELETE FROM downloads WHERE uid=${uid}`).run()
}

async function deleteDownloadByPID(PID) {
    db.prepare(`DELETE FROM downloads WHERE process_pid=${PID}`).run()
}

async function pruneDownloads() {
    const all = await retrieveAll()
    return all.map(job => {
        if (existsInProc(job.process_pid)) {
            return job
        } else {
            deleteDownloadByPID(job.process_pid)
        }
    })
}

module.exports = {
    init: init,
    getDB: get_db,
    insertDownload: insertDownload,
    retrieveAll: retrieveAll,
    deleteDownloadById: deleteDownloadById,
    deleteDownloadByPID: deleteDownloadByPID,
    pruneDownloads: pruneDownloads,
}
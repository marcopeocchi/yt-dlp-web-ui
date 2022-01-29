import { v1 } from 'uuid';
import { existsInProc } from '../utils/procUtils';
import Logger from '../utils/BetterLogger';
const db = require('better-sqlite3')('downloads.db');

const log = new Logger();

/**
 * Inits the repository, the tables.
 */
export async function init() {
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
        log.warn('db', 'Table already created, ignoring')
    }
}

/**
 * Get an instance of the db.
 * @returns {BetterSqlite3.Database} Current database instance
 */
export async function get_db(): Promise<any> {
    return db
}

/**
 * Insert an new download to the database
 * @param {string} url the video url
 * @param {string} title the title fetched by the info process
 * @param {string} thumbnail the thumbnail url fetched by the info process
 * @param {string} size optional - the download size
 * @param {number} PID the pid of the downloader
 * @returns {Promise<string>} the download UUID
 */
export async function insertDownload(url: string, title: string, thumbnail: string, size: string, PID: number): Promise<string> {
    const uid = v1()
    try {
        db
            .prepare(`
                INSERT INTO downloads 
                    (uid, url, title, thumbnail, size, process_pid) 
                    VALUES (?, ?, ?, ?, ?, ?)`
            )
            .run(uid, url, title, thumbnail, size, PID)
    } catch (error) {
        log.err('db', 'some error occourred')
    }

    return uid
}

/**
 * Retrieve all downloads from the database
 * @returns {ArrayLike} a collection of results
 */
export async function retrieveAll(): Promise<any> {
    return db
        .prepare('SELECT * FROM downloads')
        .all()
}

/**
 * Delete a download by its uuid
 * @param {string} uid the to-be-deleted download uuid
 */
export async function deleteDownloadById(uid: string) {
    db.prepare(`DELETE FROM downloads WHERE uid=${uid}`).run()
}

/**
 * Delete a download by its pid
 * @param {string} pid the to-be-deleted download pid
 */
export async function deleteDownloadByPID(PID) {
    db.prepare(`DELETE FROM downloads WHERE process_pid=${PID}`).run()
}

/**
 * Deletes the downloads that aren't active anymore
 * @returns {Promise<ArrayLike>}
 */
export async function pruneDownloads(): Promise<any> {
    const all = await retrieveAll()
    return all.map(job => {
        if (existsInProc(job.process_pid)) {
            return job
        }
        deleteDownloadByPID(job.process_pid)
    })
}
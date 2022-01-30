/**
 * Represent a download db record
 */

export interface IRecord {
    uid: string,
    url: string,
    title: string,
    thumbnail: string,
    created: Date,
    size: string,
    pid: number,
    params: string,
}
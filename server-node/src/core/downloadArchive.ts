import { resolve as pathResolve } from "path";
import { readdir } from "fs";
import { ISettings } from "../interfaces/ISettings";
import Logger from "../utils/BetterLogger";

let settings: ISettings;
const log = Logger.instance;

try {
    settings = require('../../settings.json');
} catch (e) {
    log.warn('dl', 'settings.json not found');
}

export function listDownloaded(ctx: any) {
    return new Promise((resolve, reject) => {
        readdir(pathResolve(settings.download_path || 'download'), (err, files) => {
            if (err) {
                reject({ err: true })
                return
            }
            ctx.body = files.map(file => {
                resolve({
                    filename: file,
                    path: pathResolve(file),
                })
            })
        })
    })
}

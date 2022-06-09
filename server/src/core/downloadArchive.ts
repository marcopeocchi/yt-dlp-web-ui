import { resolve } from "path";
import { readdir } from "fs";


const archived = [
    {
        id: 1,
        title: '',
        path: resolve(''),
        img: '',
    },
]

export function listDownloaded(ctx: any, next: any) {
    //readdir()
    ctx.body = archived
    next()
}

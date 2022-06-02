import { resolve } from "path";

const archived = [
    {
        id: 1,
        title: 'AleXa (알렉사) – Voting Open in American Song Contest Grand Final!',
        path: resolve('downloads/AleXa (알렉사) – Voting Open in American Song Contest Grand Final!.webm'),
        img: 'https://i.ytimg.com/vi/WbBUz7pjUnM/hq720.jpg?sqp=-oaymwEcCNAFEJQDSFXyq4qpAw4IARUAAIhCGAFwAcABBg==&rs=AOn4CLAi5MNtvpgnY9aRpdFlhAfhdV7Zlg',
    },
]

export function listDownloaded(ctx: any, next: any) {
    ctx.body = archived
    next()
}

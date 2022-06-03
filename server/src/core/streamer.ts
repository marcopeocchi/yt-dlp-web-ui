import { stat, createReadStream } from 'fs';
import { lookup } from 'mime-types';

export function streamer(ctx: any, next: any) {
    const filepath = ''
    stat(filepath, (err, stat) => {
        if (err) {
            ctx.response.status = 404;
            ctx.body = { err: 'resource not found' };
            next();
        }
        const fileSize = stat.size;
        const range = ctx.headers.range;
        if (range) {
            const parts = range.replace(/bytes=/, '').split('-');
            const start = parseInt(parts[0], 10);
            const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
            const chunksize = end - start + 1;
            const file = createReadStream(filepath, { start, end });
            const head = {
                'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                'Accept-Ranges': 'bytes',
                'Content-Length': chunksize,
                'Content-Type': lookup(filepath)
            };
            ctx.res.writeHead(206, head);
            file.pipe(ctx.res);
            next();
        } else {
            const head = {
                'Content-Length': fileSize,
                'Content-Type': 'video/mp4'
            };
            ctx.res.writeHead(200, head);
            createReadStream(ctx.params.filepath).pipe(ctx.res);
            next();
        }
    });
}
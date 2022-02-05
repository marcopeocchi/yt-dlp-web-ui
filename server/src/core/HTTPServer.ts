import http from 'http';
import url from 'url';
import fs, { open, close } from 'fs';
import { parse, join } from 'path';

namespace server {
    export const mimes = {
        '.html': 'text/html',
        '.ico': 'image/x-icon',
        '.js': 'text/javascript',
        '.json': 'application/json',
        '.css': 'text/css',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.webp': 'image/webp',
    };
}

class Jean {
    private workingDir: string;

    /**
     * Jean static file server its only purpose is serving SPA and images
     * with the lowest impact possible.
     * @param workingDir sets the root directory automatically trying index.html
     * If specified the file in addition to the directory it will serve the
     * file directly.  
     * *e.g* new Jean(path.join(__dirname, 'dist')) will try
     * index.html from the dist directory;           
     * @author me :D
     */

    constructor(workingDir: string) {
        this.workingDir = workingDir;
    }

    /**
     * Create a static file server
     * @returns an instance of a standard NodeJS http.Server
     */
    public createServer(): http.Server {
        return http.createServer((req, res) => {
            // parse the current given url
            const parsedUrl = url.parse(req.url, false)
            // extract the pathname and guard it with the working dir
            let pathname = join(this.workingDir, `.${parsedUrl.pathname}`);
            // extract the file extension
            const ext = parse(pathname).ext;

            // open the file or directory and fetch its descriptor
            open(pathname, 'r', (err, fd) => {
                // whoops, not found, send a 404
                if (err) {
                    res.statusCode = 404;
                    res.end(`File ${pathname} not found!`);
                    return;
                }
                // something's gone wrong it's not a file or a directory
                fs.fstat(fd, (err, stat) => {
                    if (err) {
                        res.statusCode = 500;
                        res.end(err);
                    }
                    // try file index.html
                    if (stat.isDirectory()) {
                        pathname = join(pathname, 'index.html')
                    }
                    // read the file
                    fs.readFile(pathname, (err, data) => {
                        if (err) {
                            res.statusCode = 500;
                            res.end(`Error reading the file: ${err}`);
                        } else {
                            // infer it's extension otherwise it's the index.html
                            res.setHeader('Content-type', server.mimes[ext] || 'text/html');
                            res.end(data);
                            close(fd);
                        }
                    });
                })
            });
        })
    }
}

export default Jean;
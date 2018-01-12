 
var express = require('express'),
cluster = require('express-cluster'),
fs = require('fs'),
app = express(),
compression = require('compression');

console.log('Servidor iniciado');
cluster((worker) => {
    app.use(compression());
    app.get('/:name', (req, res) => {
        const path = 'videos/'+req.params.name+'.mp4';
        const stat = fs.statSync(path);
        const fileSize = stat.size;
        const range = req.headers.range;
        if (range) {
            const parts = range.replace(/bytes=/, "").split("-")
            const start = parseInt(parts[0], 10)
            const end = parts[1] 
                ? parseInt(parts[1], 10)
                : fileSize-1
            const chunksize = (end-start)+1
            const file = fs.createReadStream(path, {start, end})
            const head = {
                'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                'Accept-Ranges': 'bytes',
                'Content-Length': chunksize,
                'Content-Type':  'text/event-stream',
            }
            res.writeHead(206, head);
            file.pipe(res);
        } else {
            const head = {
                'Content-Length': fileSize,
                'Content-Type': 'video/mp4',
            }
            res.writeHead(200, head)
            fs.createReadStream(path).pipe(res)
        }
    });

    return app.listen(3000);
}, {count: 3});

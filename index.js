
var express = require('express'),
    cluster = require('express-cluster'),
    fs = require('fs'),
    app = express(),
    compression = require('compression'),
    serveIndex = require('serve-index'),
    fs = require("fs"),
    path = require("path");

console.log('Servidor iniciado');
cluster((worker) => {
    app.engine('jade', require('jade').__express)
    app.set('views', path.join(__dirname, 'views'));
    app.set('view engine', 'jade');
    app.use('/assets', express.static('assets'))
    app.use(compression());
    app.get('/', (req, res) => {
        var dir = __dirname + '/videos';
        var list = fs.readdirSync(dir);
        res.render('index', { 'list': list });
    });
    app.get('/videos/:name', (req, res) => {
        const path = 'videos/' + req.params.name;
        const stat = fs.statSync(path);
        const fileSize = stat.size;
        const range = req.headers.range;
        if (range) {
            const parts = range.replace(/bytes=/, "").split("-")
            const start = parseInt(parts[0], 10)
            const end = parts[1]
                ? parseInt(parts[1], 10)
                : fileSize - 1
            const chunksize = (end - start) + 1
            const file = fs.createReadStream(path, { start, end })
            const head = {
                'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                'Accept-Ranges': 'bytes',
                'Content-Length': chunksize,
                'Content-Type': 'text/event-stream',
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
}, { count: 3 });

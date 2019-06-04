const express         = require("express");
const app             = express();
const bodyParser      = require('body-parser');
const errorHandler    = require('errorhandler');
const methodOverride  = require('method-override');
const compression     = require('compression');
const gzipStatic      = require('connect-gzip-static');
const util            = require('gulp-util');
const port            = parseInt(process.env.PORT, 10) || 3000;


app.use(gzipStatic(__dirname + '/build'));
app.use(compression());

app.get("/", (req, res) => {
    res.redirect("/index.html");
});

app.get('*.js', (req, res, next) => {
    req.url = req.url + '.gz';
    res.header('Content-Encoding', 'gzip');
    next();
});

app.use(methodOverride());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(express.static(__dirname + '/build'));
app.use(errorHandler({
    dumpExceptions: true,
    showStack: true
}));

util.log(util.colors.black.bgYellow.bold(' EXPRESS JS '), "http://localhost:" + port);
app.listen(port);

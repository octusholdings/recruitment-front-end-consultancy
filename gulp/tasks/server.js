const gulp 		= require('gulp');
const spawn 	= require('child_process').spawn;
const util      = require('gulp-util');
const argv      = require('yargs').argv;
var node;


/**
 * $ gulp server
 * description: launch the server. If there's a server already running, kill it.
 */
gulp.task('server', function() {
    if (!argv.prod) {
        if (node) node.kill();
        node = spawn('node', ['server.js'], {stdio: 'inherit'})
        node.on('close', function (code) {
            if (code === 8) {
            	util.beep();
            	util.log('CLOSE!!!');
            	node.kill();
            }
        });
    }
});

// clean up if an error goes unhandled.
process.on('exit', function() {
    if (node) {
    	node.kill()
    }
});
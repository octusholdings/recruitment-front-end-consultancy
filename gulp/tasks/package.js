var gulp = require('gulp');
var zip = require('gulp-zip');
var tar = require('gulp-tar');
var size = require('gulp-size');
var Spinner = require('cli-spinner').Spinner;

var spinner = new Spinner({
	text: '%s',
	stream: process.stderr,
	onTick: function (msg) {
		this.clearLine(this.stream);
        this.stream.write(msg);
	}
});

gulp.task('package', ['zip'], function() {
    spinner.stop(true);

    gulp.src('./dist/octus-ui.zip')
    	.pipe(size({showFiles: true}));
});

gulp.task('zip', function () {

	return gulp.src('./build/**')
        .pipe(zip('octus-ui.zip'))
        .pipe(gulp.dest('dist'))
})
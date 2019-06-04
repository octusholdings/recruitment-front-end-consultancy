var gulp = require('gulp');
var argv = require('yargs').argv;
var gulpif = require('gulp-if');
var runSequence = require('run-sequence');
var exit = require('gulp-exit');

//gulpif(argv.production, gulp('copy:prod:html')),
//    gulpif(argv.dev, gulp('copy:dev:html')),

gulp.task('build', () => {
    return runSequence(
        ['styles','images'],
        ['copy:html','copy:fonts','copy:initjs','copy:css:fonts','copy:fonts:pdf','copy:libs','copy:webinf','copy:ico']
    );
});
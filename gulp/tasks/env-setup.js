var gulp = require('gulp'),
    argv = require('yargs').argv,
    gulpif = require('gulp-if'),
    rename = require('gulp-rename'),
    replace = require('gulp-replace'),
    gutil = require('gulp-util');

gulp.task('env-setup', () => {
    gutil.log("Setting up keys=" + Object.keys(argv));
    return gulp.src(['./src/javascript/config.tmpl'])
        .pipe(gulpif(argv.nginx, replace(/UI_LOCATION/g, '')))
        .pipe(gulpif(argv.nginx, replace(/SERVER_LOCATION/g, '..')))
        .pipe(gulpif(argv.dev, replace(/UI_LOCATION/g, 'localhost:4567')))
        .pipe(gulpif(argv.dev, replace(/SERVER_LOCATION/g, 'localhost:8080')))
        .pipe(gulpif(argv.docker, replace(/UI_LOCATION/g, 'localhost')))
        .pipe(gulpif(argv.docker, replace(/SERVER_LOCATION/g, 'localhost:81')))
        .pipe(gulpif(argv.test, replace(/SERVER_LOCATION/g, 'test-validation.octus.io')))
        .pipe(gulpif(argv.test, replace(/UI_LOCATION/g, 'localhost:4567')))
        .pipe(rename('config.js'))
        .pipe(gulp.dest('./src/javascript'));
});
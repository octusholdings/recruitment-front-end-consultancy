const gulp      = require('gulp');
const jsonmin   = require('gulp-jsonmin');
const argv      = require('yargs').argv;
const rename    = require('gulp-rename');
const gulpif    = require('gulp-if');
const concat    = require('gulp-concat');
const babel     = require('gulp-babel');
const replace   = require('gulp-replace');
const gzip      = require('gulp-gzip');
const strip             = require('gulp-strip-comments');
const removeEmptyLines  = require('gulp-remove-empty-lines');

const SIZE_OPTS = {
    showFiles: true,
    gzip: true
};

gulp.task('copy:dev:html', () => {
	return gulp.src('src/html/index-dev.html')
        .pipe(rename("index.html"))
		.pipe(gulp.dest('build'));
});

gulp.task('copy:prod:html', () => {
    return gulp.src('src/html/index-prod.html')
        .pipe(rename("index.html"))
        .pipe(gulp.dest('build'));
});

gulp.task('copy:initjs', () => {
    return gulp.src('init.js')
        .pipe(gulpif(argv.nginx, replace('http://SERVER_LOCATION', '..')))
        .pipe(gulpif(argv.prod, replace('http://SERVER_LOCATION', '..')))
        .pipe(gulpif(argv.dev, replace(/SERVER_LOCATION/g, 'localhost:8080')))
        .pipe(gulpif(argv.test, replace(/SERVER_LOCATION/g, 'test-validation.octus.io')))
        .pipe(babel({presets: ['minify']}))
        .pipe(gulp.dest('build'))
        .pipe(gzip({gzipOptions: {level: 9}}))
        .pipe(gulp.dest('build'));
});

gulp.task('copy:errorhtml', () => {

    return gulp.src('src/html/e403.html')
        .pipe(gulp.dest('build'));
});

gulp.task('copy:html', () => {
	return gulp.src('src/html/index.html')
        .pipe(rename("index.html"))
		.pipe(gulp.dest('build'));
});

gulp.task('copy:css', () => {
	return gulp.src('src/css/**')
		.pipe(gulp.dest('build/css'));
});

gulp.task('copy:fonts', () => {
	return gulp.src('src/fonts/**')
		.pipe(gulp.dest('build/fonts'));
});

/*
Needed for kendo-ui PDF rendering
 */
gulp.task('copy:css:fonts', () => {
	return gulp.src('src/css/glyphs/**')
		.pipe(gulp.dest('build/css/fonts/glyphs'));
});

gulp.task('copy:fonts:pdf', () => {
    return gulp.src('src/fonts/DejaVu/**')
        .pipe(gulp.dest('build/css/fonts/DejaVu'));
});

gulp.task('copy:ico', () => {
    return gulp.src('src/ico/**')
        .pipe(gulp.dest('build/ico'));
});

gulp.task('copy:libs', () => {
    var libs = [
        'src/libs/modernizr/modernizr-2.6.2/js/modernizr-2.6.2.js',
        'lib/kendo/js/kendo.all.min.js'
    ];
    return gulp.src(libs)
        .pipe(concat('libs.js'))
        .pipe(strip())
        .pipe(removeEmptyLines())
        .pipe(gulp.dest('build/libs/'))
        .pipe(gzip({gzipOptions: {level: 9}}))
        .pipe(gulp.dest('build/libs/'));
});

gulp.task('copy:webinf', () => {
    return gulp.src('src/WEB-INF/**')
        .pipe(gulp.dest('build/WEB-INF'));
});

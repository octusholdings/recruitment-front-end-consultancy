var gulp    = require('gulp'),
    minify  = require('gulp-clean-css'),
    sass    = require('gulp-sass'),
    del     = require('del'),
    concat  = require('gulp-concat'),
    rename  = require('gulp-rename'),
    argv    = require('yargs').argv;



/* Build JAC styles into the app.css 
 * Breakdown of tasks:
 * - re-run styles task to generate out app.css
 * - copy the app.css, duplicate it and rename it app-dup.css
 * - delete app.css
 * - compile <client>.scss file into <client>.css
 * - combine app-dup.css with <client>.css to generate out the new app.css
 * - clean up and delete the app-dup.css and <client>.css
 * - watch for change in <client>.scss and re-run from top
 */


var sass_folder = './src/sass/client/',
    sass_jac    = 'jac.scss',

    css_folder  = './build/css/',
    css_jac     = 'jac.css',
    css_app     = 'app.css';

gulp.task('build-jac', [
    'styles',
    'copy:appcss',
    'del:appcss',
    'styles-jac',
    'watch-jac'
]);

gulp.task('copy:appcss', ['styles'], function() {
    console.log('TASK: duplicate app.css file')
    return gulp.src('./build/css/app.css')
        .pipe(rename("app-dup.css"))
        .pipe(gulp.dest('./build/css'));
})

gulp.task('del:appcss', ['copy:appcss'], function() {
    console.log('TASK: delete app.css file')
    del([
        './build/css/app.css'
    ])
})

gulp.task('styles-jac', [
    'sass-jac', 
    'css-jac', 
    'clean-jac'
])

gulp.task('sass-jac', ['del:appcss'], function() {
    console.log('TASK: compiling sass for JAC')
    return gulp.src('./src/sass/client/jac.scss')
        .pipe(sass())
        .pipe(minify())
        .pipe(gulp.dest('./build/css'));
})

gulp.task('css-jac', ['sass-jac'], function() {
    console.log('TASK: combining files: "\n -> ./build/css/app-dup.css", "\n -> ./build/css/jac.css"');
    return gulp.src(['./build/css/app-dup.css', './build/css/jac.css'])
        .pipe(concat('app.css'))
        .pipe(gulp.dest('./build/css'));
})

gulp.task('clean-jac', ['css-jac'], function() {
    console.log('TASK: del jac.css and app-dup.css')
    del([
        './build/css/jac.css',
        './build/css/app-dup.css'
    ])
})

gulp.task('watch-jac', ['clean-jac'], function() {
    console.log('TASK: watch JAC')
    if (!argv.prod) {
        gulp.watch('./src/sass/client/jac.scss', ['build-jac']);
    }
})
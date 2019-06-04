const gulp          = require('gulp');
const minify        = require('gulp-clean-css');
const sass          = require('gulp-sass');
const sourcemaps    = require('gulp-sourcemaps');
const concat        = require('gulp-concat');
const cache         = require('gulp-cached');
const remember      = require('gulp-remember');

gulp.task('styles', ['styles-base', 'styles-sass', 'styles-theme' , 'styles-kendo', 'styles-kendo-files']);

var baseCcs = [
    "./src/css/bootstrap.css",
    "./src/css/extension.css",
    "./src/css/select2.css",
    "./src/css/main.css",
    "./src/css/style.css",
    "./src/css/boo-extension.css",
    "./src/css/bootstrap-select.min.css",
    "./src/css/bootstrap-editable.css",
    "./src/css/bootstrap-tagsinput.css",
    "./src/css/gridstack.min.css",
    "./src/css/layout.css",
    "./lib/imageViewer/imageviewer.css"
];

var themeCcs = [
        "./src/boo-less/plugins.css"
    ];

var kendoStylesDir = "./lib/kendo/styles";
var kendoCcs = [
    kendoStylesDir + "/kendo.common.min.css",
    kendoStylesDir + "/kendo.silver.min.css",
    kendoStylesDir + "/kendo.dataviz.min.css",
    kendoStylesDir + "/kendo.rtl.min.css",
    kendoStylesDir + "/kendo.mobile.all.min.css",
    kendoStylesDir + "/kendo.dataviz.silver.min.css",
    kendoStylesDir + "/kendo.themeBuilder.css"
    ];


gulp.task('styles-base', () => {
    return gulp.src(baseCcs)
        .pipe(cache('styleBase'))
        .pipe(sourcemaps.init())
        .pipe(minify())
        .pipe(remember('styleBase'))
        .pipe(concat('octus.css'))
        .pipe(sourcemaps.write())
        .pipe(gulp.dest('./build/css'));
});

gulp.task('styles-sass', () => {
    return gulp.src('./src/sass/app.scss')
        // .pipe(cache('styleSass'))
        .pipe(sourcemaps.init())
        .pipe(sass())
        .pipe(minify())
        .pipe(remember('styleSass'))
        .pipe(sourcemaps.write())
        .pipe(gulp.dest('./build/css'))
});

gulp.task('styles-theme', () => {
    return gulp.src(themeCcs)
        .pipe(cache('styleTheme'))
        .pipe(sourcemaps.init())
        .pipe(minify())
        .pipe(remember('styleTheme'))
        .pipe(concat('octus-theme.css'))
        .pipe(sourcemaps.write())
        .pipe(gulp.dest('./build/css'));
});

gulp.task('styles-kendo', () => {
    return gulp.src(kendoCcs)
        .pipe(cache('styleKendo'))
        .pipe(sourcemaps.init())
        .pipe(minify())
        .pipe(remember('styleKendo'))
        .pipe(concat('octus-theme.css'))
        .pipe(sourcemaps.write())
        .pipe(gulp.dest('./build/css'));
});

gulp.task('styles-kendo-files', () => {
    return gulp.src(kendoStylesDir + '/Silver/**')
        .pipe(cache('styleKendoFiles'))
        .pipe(gulp.dest('./build/css/Silver'));
});
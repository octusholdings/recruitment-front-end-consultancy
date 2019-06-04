const fs                = require('fs');
const gulp              = require('gulp');
const util              = require('gulp-util');
const sourcemaps        = require('gulp-sourcemaps');
const gzip              = require('gulp-gzip');
const gulpif            = require('gulp-if');
const babel             = require('gulp-babel');
const duration          = require('gulp-duration');
const browserify        = require('browserify');
const buffer            = require('vinyl-buffer');
const source            = require('vinyl-source-stream');
const argv              = require('yargs').argv;
const watchify          = require('watchify');
const browserSync       = require('browser-sync').create();
const compress          = require('compression');
const runSequence       = require('run-sequence');
const Spinner           = require('cli-spinner').Spinner;
const exit              = require('gulp-exit');
const packageJson       = require('../../package.json');
const SIZE_OPTS         = {
    showFiles: true,
    gzip: true
};
var DEBUG_MODE;
var spinner = new Spinner({
    text: '%s',
    stream: process.stderr,
    onTick: function (msg) {
        this.clearLine(this.stream);
        this.stream.write(msg);
    }
});

if (argv.prod || argv.min) {
    DEBUG_MODE = false;
} else {
    DEBUG_MODE = true;
}

watchify.args.debug = DEBUG_MODE;

const APPS_DIST_DIR = "./build";
const EXTERNAL_LIBS = packageJson.browser;

var vendor = browserify({
    entries:"./src/javascript/vendor.js"
});

var bundler = function() {
    return browserify({
        cache: {},
        packageCache: {},
        entries:"./src/javascript/main.js", 
        debug:DEBUG_MODE
    })
    .plugin(require('dep-case-verify'))
    .external(Object.keys(EXTERNAL_LIBS));
}

var bundler_dev = watchify(bundler());

var browserifyErrorHandler = (err) => {
    console.log('[BROWSERIFY ERROR] ' + err.message);
    util.beep();
}

var browserifyEndHandler = (type) => {
    util.log(util.colors.bgBlue.bold(' ' + type + ' BUNDLE COMPLETE! '));
}

var appBundle = () => {
    if (argv.prod || argv.min) {
        return bundler().bundle()
            .on('error', function (err) { 
                browserifyErrorHandler(err);
                this.emit('end');
            })
            .on('end', function () {
                browserifyEndHandler('APP') 
            })
            .pipe(duration('app bundle took:'))
            .pipe(source("app.js"))
            .pipe(buffer())
            .pipe(babel({presets: ['minify']}))
            .pipe(gulp.dest(APPS_DIST_DIR))
            .pipe(gzip({gzipOptions: {level: 9}}))
            .pipe(gulp.dest(APPS_DIST_DIR))
            .pipe(exit())
    } else {
        return bundler_dev.bundle()
            .on('error', (err) => browserifyErrorHandler(err) )
            .on('end', () => browserifyEndHandler('APP') )
            .pipe(duration('app bundle took:'))
            .pipe(source("app.js"))
            .pipe(buffer())
            .pipe(gulp.dest(APPS_DIST_DIR))
            .pipe(gzip({gzipOptions: {level: 9}}))
            .pipe(sourcemaps.init({loadMaps: true}))
            .pipe(sourcemaps.write('./'))
            .pipe(gulp.dest(APPS_DIST_DIR))
    }
}

var vendorBundle = () => {
    return vendor.bundle()
        .on('error', (err) => browserifyErrorHandler(err) )
        .on('end', () => browserifyEndHandler('VENDOR'))
        .pipe(duration('vendor bundle took:'))
        .pipe(source("infrastructure.js"))
        .pipe(buffer())
        .pipe(gulpif(argv.prod || argv.min, babel({presets: ['minify']})))
        .pipe(gulp.dest(APPS_DIST_DIR))
        .pipe(gzip({gzipOptions: {level: 9}}))
        .pipe(gulp.dest(APPS_DIST_DIR));
}

var gzipBundle = () => {
    if (argv.prod || argv.min || argv.nginx) {
        // only happen during --min arguments
        util.log(util.colors.white.bgCyan.bold(' GZIP BUNDLE '));

        return gulp.src('build/app.js')
            .pipe(duration('gzip app.js took:'))
            .pipe(gzip({gzipOptions: {level: 9}}))
            .pipe(gulp.dest(APPS_DIST_DIR));
    } else {
        util.log(util.colors.black.bgWhite.bold(' NO GZIP BUNDLE '), 'run with --min argument to run this function');
    }
}

var gzipVendor = () => {
    if (argv.prod || argv.min || argv.nginx) {
        // only happen during --min arguments
        util.log(util.colors.white.bgCyan.bold(' GZIP VENDOR '));

        return gulp.src('build/infrastructure.js')
            .pipe(duration('gzip infrastructure.js took:'))
            .pipe(sourcemaps.init({loadMaps: true}))
            .pipe(sourcemaps.write('./'))
            .pipe(gzip({gzipOptions: {level: 9}}))
            .pipe(gulp.dest(APPS_DIST_DIR))
    } else {
        util.log(util.colors.black.bgWhite.bold(' NO GZIP VENDOR '), 'run with --min argument to run this function');
    }
}

gulp.task("build-app-lib", () => {
    spinner.start();

    return runSequence(
        ["vendor", "bundle"], 
        "nginx",
        "browserSync"
    );
})

gulp.task("bundle", () => {
    var msg = util.colors.blue('[GULP TASK]') + ' build ' + util.colors.white.bgBlue.bold(' APP ');

    if (argv.prod) {
        util.log(msg + ' lib: building for', util.colors.black.bgWhite.bold(' PRODUCTION '))
    } else if (argv.dev) {
        util.log(msg + ' lib: building for', util.colors.black.bgWhite.bold(' DEV '))
    } else {
        util.log(msg + ' lib: building')
    }

    return appBundle();  
})

gulp.task("vendor", () => {
    var msg = util.colors.blue('[GULP TASK]') + ' bundle ' + util.colors.white.bgRed.bold(' VENDOR ');

    if (argv.prod) {
        util.log(msg + ' lib: building for', util.colors.black.bgWhite.bold(' PRODUCTION '))
    } else if (argv.dev) {
        util.log(msg + ' lib: building for', util.colors.black.bgWhite.bold(' DEV '))
    } else {
        util.log(msg + ' lib: building')
    }

    Object.keys(EXTERNAL_LIBS).forEach((lib) => {
        vendor.require(lib);
    });

    return vendorBundle();
})

gulp.task('browserSync', () => {
    if (!argv.prod && !argv.nginx) {
        util.log(util.colors.black.bgYellow.bold(' STARTING BROWSER-SYNC '));
        browserSync.init({
            proxy: 'localhost:3000',
            port: 4567,
            middleware: [compress()],
            ghostMode: false
        });

        gulp.watch('src/sass/*.scss', ['styles'] );
        gulp.watch('src/css/**/*.css', ['styles'] );
        gulp.watch("build/**/*.css").on('change', browserSync.reload );
    }

    spinner.stop();
});

gulp.task('nginx', () => {
    if (argv.nginx) {
        util.log(util.colors.black.bgYellow.bold(' RUNNING WITH NGINX. MOVING INTO .UI/ FOLDER '));
        gulp.src('build/**').pipe(gulp.dest('nginx/ui/'));
    }
})

gulp.task('refresh', () => {
    if (!argv.prod) {
        util.log(util.colors.black.bgWhite.bold(' RELOADING... '));
        browserSync.reload();
    }
});

bundler_dev.on("update", (ids) => {
    var fileChangedConsole = ids.map((file) => {
        return file.substring(file.lastIndexOf('/'), file.length);
    }).join('\n');

    var fileChangedBS = ids.map((file) => {
        return file.substring(file.lastIndexOf('/'), file.length);
    }).join('</br>');

    browserSync.notify("change in the file:</br>" + fileChangedBS);
    util.log(util.colors.bold('change in the file:\n' + fileChangedConsole));

    if (argv.min) {
        return runSequence(
            "bundle", 
            "uglify",
            "nginx",
            "refresh"
        );
    } else {
        return runSequence(
            "bundle", 
            "nginx",
            "refresh"
        );
    }
})
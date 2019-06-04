var changed     = require('gulp-changed');
var gulp        = require('gulp');
// var imagemin = require('gulp-imagemin');

gulp.task('images', () => {
	var dest = './build/img';
	var dest_kendo = './build/css/images';

	gulp.src('./src/img/**')
		.pipe(changed(dest))
        .pipe(gulp.dest(dest));

    gulp.src('./lib/kendo/styles/images/**')
    	.pipe(changed(dest_kendo))
    	.pipe(gulp.dest(dest_kendo));
});

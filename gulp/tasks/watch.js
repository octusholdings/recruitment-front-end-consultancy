var gulp = require('gulp');

gulp.task('watch', ['setWatch'], function() {
	//gulp.watch('src/boo-less/**', ['copy:less']);
	//gulp.watch('src/css/**', ['copy:css']);
	//gulp.watch('src/html/**', ['copy:html']);
	gulp.watch('src/javascript/**/*.js', ['build-app-lib']);
	gulp.watch('src/javascript/**/*.hbs', ['build-app-lib']);
	gulp.watch('src/sass/*.scss', ['styles']);
	gulp.watch('src/css/**/*.css', ['styles']);

});
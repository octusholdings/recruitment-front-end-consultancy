const gulp 			= require('gulp');
const runSequence 	= require('run-sequence');

gulp.task('dev-run', () => {
	return runSequence("server",'build-app-lib', 'env-setup', 'build')
});
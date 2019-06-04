const fs 			= require('fs');
const onlyScripts 	= require('./util/scriptFilter');
const tasks 		= fs.readdirSync('./gulp/tasks/').filter(onlyScripts);
const gulp 			= require('gulp');
const taskListing 	= require('gulp-task-listing');

tasks.forEach(function(task) {
	require('./tasks/' + task);
});

gulp.task('help', taskListing);

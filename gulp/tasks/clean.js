var gulp = require('gulp'),
    concat = require('gulp-concat'),
    del = require('del');

gulp.task('clean', function() {

    del([
        'build/*',
        'dist/*'
    ]);

});
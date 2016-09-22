/* eslint-disable */
'use strict';

var gulp = require('gulp');
var runSequence = require('run-sequence');
var OPTIONS = require('./tools/paths');

////////////////////////////////////////////////////////////////////
// EXTERNAL TASKS
////////////////////////////////////////////////////////////////////
require('./tools/tasks/scriptTasks')(gulp, OPTIONS);
// require('./tools/tasks/docTasks')(gulp, OPTIONS);
// require('./tools/tasks/testTasks')(gulp, OPTIONS);
require('./tools/tasks/styleTasks')(gulp, OPTIONS);
require('./tools/tasks/mediaTasks')(gulp, OPTIONS);
require('./tools/tasks/utilityTasks')(gulp, OPTIONS);

////////////////////////////////////////////////////////////////////
// UNIFIED GULP TASKS
////////////////////////////////////////////////////////////////////
// gulp.task('copy:data', ['clean:data:json', 'json']);
gulp.task('lint', ['lint:scripts']);
gulp.task('build', function() {
    runSequence(
        'clean:build',
        'build:scripts',
        'build:styles'
    );
});
gulp.task('dist', function() {
    runSequence(
        'clean:dist',
        ['build:scripts', 'build:styles']
        // 'copy:data',
        // 'fonts',
        // 'minify-images',
        // 'lint:scripts'
    );
});
gulp.task('watch', ['watch:scripts', 'watch:styles']);
gulp.task('default', ['build']);

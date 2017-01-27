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
gulp.task('lint', ['lint:scripts']);

gulp.task('build', () => {
    runSequence(
        'build:server',
        'build:scripts',
        'build:styles'
    );
});

gulp.task('dist', () => {
    runSequence(
        'clean:dist',
        ['build:scripts', 'build:styles']
        // 'lint:scripts'
    );
});
gulp.task('watch', ['watch:scripts', 'watch:styles']);
gulp.task('default', ['build']);

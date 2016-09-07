'use strict';

var gulp = require('gulp');
var runSequence = require('run-sequence');
var OPTIONS = require('./tools/paths');

////////////////////////////////////////////////////////////////////
// EXTERNAL TASKS
////////////////////////////////////////////////////////////////////
// require('./tools/tasks/scriptTasks')(gulp, OPTIONS);
// require('./tools/tasks/docTasks')(gulp, OPTIONS);
// require('./tools/tasks/testTasks')(gulp, OPTIONS);
require('./tools/tasks/styleTasks')(gulp, OPTIONS);
require('./tools/tasks/mediaTasks')(gulp, OPTIONS);
// require('./tools/tasks/serverTasks')(gulp, OPTIONS);
// require('./tools/tasks/markupTasks')(gulp, OPTIONS);
require('./tools/tasks/utilityTasks')(gulp, OPTIONS);

////////////////////////////////////////////////////////////////////
// UNIFIED GULP TASKS
////////////////////////////////////////////////////////////////////
gulp.task('copy:data', ['clean:data:json', 'json']);

gulp.task('build', function() {
    runSequence(
        'clean:build',
        'build:styles'
//         ['build:sass', 'build:scripts']
//         'lint:scripts'
    );
});
// gulp.task('watch', ['watch:styles', 'watch:scripts']);

gulp.task('dist', function() {
    runSequence(
        'clean:dist',
        'build:styles',
        'copy:data',
        'fonts',
        'minify-images'
    );
});

gulp.task('default', ['build']);

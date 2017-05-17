/* eslint-disable */

const gulp = require('gulp');
const runSequence = require('run-sequence');
const OPTIONS = require('./tools/paths');

const buildMarkup = require('./tools/tasks/buildMarkup');
const jsonAssembler = require('./tools/tasks/jsonAssembler');

////////////////////////////////////////////////////////////////////
// EXTERNAL TASKS
////////////////////////////////////////////////////////////////////
require('./tools/tasks/scriptTasks')(gulp, OPTIONS);
require('./tools/tasks/styleTasks')(gulp, OPTIONS);
require('./tools/tasks/mediaTasks')(gulp, OPTIONS);
require('./tools/tasks/utilityTasks')(gulp, OPTIONS);

////////////////////////////////////////////////////////////////////
// UNIFIED GULP TASKS
////////////////////////////////////////////////////////////////////
gulp.task('markup', () => buildMarkup());
gulp.task('json:assemble', () => jsonAssembler());

gulp.task('lint', ['lint:scripts']);

gulp.task('build', () => {
    runSequence(
        'clean',
        [
            'build:scripts',
            'build:server',
            'build:styles',
            'markup'
        ],
        'json:assemble',
        'copy:dist'
    )
});

gulp.task('watch', ['watch:scripts', 'watch:styles']);
gulp.task('default', ['build']);

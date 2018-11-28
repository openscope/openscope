/* eslint-disable */

const gulp = require('gulp');
const OPTIONS = require('./tools/paths');

const buildMarkup = require('./tools/tasks/buildMarkup');
const jsonAssembler = require('./tools/tasks/jsonAssembler');

require('./tools/tasks/scriptTasks')(gulp, OPTIONS);
require('./tools/tasks/styleTasks')(gulp, OPTIONS);
require('./tools/tasks/mediaTasks')(gulp, OPTIONS);
require('./tools/tasks/utilityTasks')(gulp, OPTIONS);

gulp.task('markup', gulp.series(buildMarkup));
gulp.task('json:assemble', gulp.series(jsonAssembler));

const buildAndMarkup = gulp.parallel(
    'build:scripts',
    'build:server',
    'build:styles',
    'markup'
);

gulp.task('build', gulp.series(
    'clean',
    buildAndMarkup,
    'json:assemble',
    'copy:dist'
));

gulp.task('watch', gulp.parallel('watch:scripts', 'watch:styles'));
gulp.task('default', gulp.series('build'));

/* eslint-disable */

const gulp = require('gulp');
const OPTIONS = require('./tools/options');

const buildMarkup = require('./tools/tasks/buildMarkup');
const jsonAssembler = require('./tools/tasks/jsonAssembler');

require('./tools/tasks/scriptTasks')(gulp, OPTIONS);
require('./tools/tasks/styleTasks')(gulp, OPTIONS);
require('./tools/tasks/mediaTasks')(gulp, OPTIONS);
require('./tools/tasks/utilityTasks')(gulp, OPTIONS);

gulp.task(OPTIONS.TASKS.MARKUP, gulp.series(buildMarkup));
gulp.task(OPTIONS.TASKS.JSON.ASSEMBLE, gulp.series(jsonAssembler));

const buildAndMarkup = gulp.parallel(
    OPTIONS.TASKS.BUILD.SCRIPTS,
    OPTIONS.TASKS.BUILD.SERVER,
    OPTIONS.TASKS.BUILD.STYLES,
    OPTIONS.TASKS.MARKUP
);

gulp.task(OPTIONS.TASKS.BUILD.DEFAULT, gulp.series(
    OPTIONS.TASKS.CLEAN.DEFAULT,
    buildAndMarkup,
    jsonAssembler,
    OPTIONS.TASKS.COPY.DIST
));

gulp.task(OPTIONS.TASKS.WATCH.DEFAULT, gulp.parallel(OPTIONS.TASKS.WATCH.SCRIPTS, OPTIONS.TASKS.WATCH.STYLES));
gulp.task(OPTIONS.TASKS.DEFAULT, gulp.series(OPTIONS.TASKS.BUILD.DEFAULT));

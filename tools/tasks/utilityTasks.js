/* eslint-disable */
'use strict';

module.exports = (gulp, config) => {
    const OPTIONS = config;
    const rimraf = require('rimraf');

    ////////////////////////////////////////////////////////////////////
    // SPAWN A CONNECT SERVER
    ////////////////////////////////////////////////////////////////////
    gulp.task('server', () => {
        const connect = require('gulp-connect');
        const path = require('path');

        connect.server({
            root: OPTIONS.DIR.BUILD,
            port: 3003,
            fallback: path.join(OPTIONS.DIR.BUILD, 'index.html')
        });
    });

    ////////////////////////////////////////////////////////////////////
    // CLEAN DESTINATION SCRIPT FILES
    ////////////////////////////////////////////////////////////////////
    gulp.task('clean:build:scripts', (cb) => {
        rimraf(OPTIONS.DIR.BUILD_SCRIPTS_CLIENT, cb);
    });

    ////////////////////////////////////////////////////////////////////
    // CLEAN DESTINATION SCRIPT FILES
    ////////////////////////////////////////////////////////////////////
    gulp.task('clean:build:server', (cb) => {
        rimraf(OPTIONS.DIR.BUILD_SCRIPTS_SERVER, cb);
    });

    ////////////////////////////////////////////////////////////////////
    // CLEAN DESTINATION STYLE FILES
    ////////////////////////////////////////////////////////////////////
    gulp.task('clean:build:styles', (cb) => {
        rimraf(OPTIONS.DIR.BUILD_STYLE, cb);
    });

    ////////////////////////////////////////////////////////////////////
    // TASKS
    ////////////////////////////////////////////////////////////////////
    gulp.task('clean:build', [
        'clean:build:scripts',
        'clean:build:styles'
    ]);

    gulp.task('clean:dist', [
        'clean:build'
    ]);

    gulp.task('clean', ['clean:build']);
}

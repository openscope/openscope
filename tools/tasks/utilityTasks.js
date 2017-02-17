/* eslint-disable */
'use strict';

module.exports = (gulp, config) => {
    const rimraf = require('rimraf');
    const runSequence = require('run-sequence');

    const OPTIONS = config;

    ////////////////////////////////////////////////////////////////////
    // SPAWN A CONNECT SERVER
    ////////////////////////////////////////////////////////////////////
    gulp.task('server', () => {
        const connect = require('gulp-connect');
        const path = require('path');

        connect.server({
            root: OPTIONS.DIR.DIST,
            port: 3003,
            fallback: path.join(OPTIONS.DIR.DIST, 'index.html')
        });
    });

    ////////////////////////////////////////////////////////////////////
    // TASKS
    ////////////////////////////////////////////////////////////////////
    gulp.task('clean', (cb) => {
        const dirsToClean = [
            OPTIONS.DIR.DIST_SCRIPTS_CLIENT,
            OPTIONS.DIR.DIST_SCRIPTS_SERVER,
            OPTIONS.DIR.DIST_STYLE,
            OPTIONS.DIR.DIST_ASSETS,
        ];
        const glob = `{${dirsToClean.join(',')}}`;

        return rimraf(glob, cb);
    });
}

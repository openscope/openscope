/* eslint-disable */
'use strict';

module.exports = (gulp, config) => {
    const rimraf = require('rimraf');
    const runSequence = require('run-sequence');

    const OPTIONS = config;

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

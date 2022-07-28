/* eslint-disable */
'use strict';

module.exports = (gulp, config) => {
    const rimraf = require('rimraf');
    const OPTIONS = config;

    gulp.task(OPTIONS.TASKS.CLEAN.DEFAULT, gulp.series((done) => {
        const dirsToClean = [
            OPTIONS.DIR.DIST_SCRIPTS_CLIENT,
            OPTIONS.DIR.DIST_SCRIPTS_SERVER,
            OPTIONS.DIR.DIST_STYLE,
            OPTIONS.DIR.DIST_ASSETS,
            OPTIONS.DIR.DIST_GUIDES
        ];
        const glob = `{${dirsToClean.join(',')}}`;

        return rimraf(glob, done);
    }));
}

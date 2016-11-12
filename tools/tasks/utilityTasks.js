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
        rimraf(OPTIONS.DIR.BUILD_SCRIPTS, cb);
    });

    ////////////////////////////////////////////////////////////////////
    // CLEAN DESTINATION STYLE FILES
    ////////////////////////////////////////////////////////////////////
    gulp.task('clean:build:styles', (cb) => {
        rimraf(OPTIONS.DIR.BUILD_STYLE, cb);
    });

    ////////////////////////////////////////////////////////////////////
    // CLEAN DESTINATION IMAGES
    ////////////////////////////////////////////////////////////////////
    gulp.task('clean:build:images', (cb) => {
        rimraf(OPTIONS.DIR.BUILD_IMAGES, cb);
    });

    ////////////////////////////////////////////////////////////////////
    // CLEAN DESTINATION FONT FILES
    ////////////////////////////////////////////////////////////////////
    gulp.task('clean:build:fonts', (cb) => {
        rimraf(OPTIONS.DIR.BUILD_FONTS, cb);
    });

    ////////////////////////////////////////////////////////////////////
    // CLEAN JSON DATA FOLDERS
    ////////////////////////////////////////////////////////////////////
    gulp.task('clean:aircraft', (cb) => {
        rimraf(OPTIONS.DIR.BUILD_AIRCRAFT, cb);
    });

    gulp.task('clean:airlines', (cb) => {
        rimraf(OPTIONS.DIR.BUILD_AIRLINES, cb);
    });

    gulp.task('clean:airports', (cb) => {
        rimraf(OPTIONS.DIR.BUILD_AIRPORTS, cb);
    });

    gulp.task('clean:data:json', [
        'clean:aircraft',
        'clean:airlines',
        'clean:airports'
    ]);

    ////////////////////////////////////////////////////////////////////
    // TASKS
    ////////////////////////////////////////////////////////////////////
    gulp.task('clean:build', [
        'clean:build:scripts',
        'clean:build:styles'
    ]);

    gulp.task('clean:dist', [
        // 'clean:build:fonts',
        // 'clean:aircraft',
        // 'clean:airlines',
        // 'clean:airports',
        // 'clean:build:images',
        'clean:build'
    ]);

    gulp.task('clean', ['clean:build']);
}

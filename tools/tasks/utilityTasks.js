'use strict';

module.exports = function(gulp, config) {
    var OPTIONS = config;
    var rimraf = require('rimraf');

    ////////////////////////////////////////////////////////////////////
    // CLEAN DESTINATION SCRIPT FILES
    ////////////////////////////////////////////////////////////////////
    gulp.task('clean:build:scripts', function(cb) {
        rimraf(OPTIONS.DIR.BUILD_SCRIPTS, cb);
    })

    ////////////////////////////////////////////////////////////////////
    // CLEAN DESTINATION STYLE FILES
    ////////////////////////////////////////////////////////////////////
    gulp.task('clean:build:styles', function(cb) {
        rimraf(OPTIONS.DIR.BUILD_STYLE, cb);
    });

    ////////////////////////////////////////////////////////////////////
    // CLEAN DESTINATION IMAGES
    ////////////////////////////////////////////////////////////////////
    gulp.task('clean:build:images', function(cb) {
        rimraf(OPTIONS.DIR.BUILD_IMAGES, cb);
    });

    ////////////////////////////////////////////////////////////////////
    // CLEAN DESTINATION FONT FILES
    ////////////////////////////////////////////////////////////////////
    gulp.task('clean:build:fonts', function(cb) {
        rimraf(OPTIONS.DIR.BUILD_FONTS, cb);
    });

    ////////////////////////////////////////////////////////////////////
    // CLEAN JSON DATA FOLDERS
    ////////////////////////////////////////////////////////////////////
    gulp.task('clean:aircraft', function(cb) {
        rimraf(OPTIONS.DIR.BUILD_AIRCRAFT, cb);
    });

    gulp.task('clean:airlines', function(cb) {
        rimraf(OPTIONS.DIR.BUILD_AIRLINES, cb);
    });

    gulp.task('clean:airports', function(cb) {
        rimraf(OPTIONS.DIR.BUILD_AIRPORTS, cb);
    });


    ////////////////////////////////////////////////////////////////////
    // TASKS
    ////////////////////////////////////////////////////////////////////

    gulp.task('clean:data:json', [
        'clean:aircraft',
        'clean:airlines',
        'clean:airports'
    ]);

    gulp.task('clean:build', [
        'clean:build:scripts',
        'clean:build:styles'
    ]);

    gulp.task('clean:dist', [
        'clean:build:fonts',
        'clean:data:json',
        'clean:build:images',
        'clean:build'
    ]);

    gulp.task('clean', ['clean:dist']);
}

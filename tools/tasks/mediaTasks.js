/* eslint-disable */
'use strict';

module.exports = function(gulp, config) {
    const OPTIONS = config;

    gulp.task('copy:airports', () => {
        gulp.src(OPTIONS.GLOB.STATIC_AIRPORTS)
            .pipe(gulp.dest(OPTIONS.DIR.DIST_AIRPORTS));
    });

    gulp.task('copy:static', () => {
        const path = require('path');
        const imagemin = require('gulp-imagemin');
        const cache = require('gulp-cache');
        const merge = require('merge-stream');

        const fonts = gulp.src(OPTIONS.GLOB.FONTS)
            .pipe(gulp.dest(OPTIONS.DIR.DIST_FONT));

        const images = gulp.src(OPTIONS.GLOB.IMAGES)
            .pipe(cache(
                imagemin({ interlaced: true })
            ))
            .pipe(gulp.dest(OPTIONS.DIR.DIST_IMAGES));

        merge(fonts, images);
    });

    gulp.task('copy:prod', ['copy:static', 'copy:airports']);

    ////////////////////////////////////////////////////////////////////
    // TASKS
    ////////////////////////////////////////////////////////////////////

    // gulp.task('media', ['clean:build:styles']);
}

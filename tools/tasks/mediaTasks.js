/* eslint-disable */
'use strict';

module.exports = function(gulp, config) {
    const OPTIONS = config;

    gulp.task('minifyAirports', () => {
        const jsonmin = require('gulp-jsonmin');
        const path = require('path');

        return gulp.src([
                path.join(OPTIONS.DIR.DIST_AIRPORTS, '**/*.json'),
                path.join(OPTIONS.DIR.DIST_AIRPORTS, '**/*.geojson')
            ])
            .pipe(jsonmin())
            .pipe(gulp.dest(OPTIONS.DIR.DIST_AIRPORTS));
    });

    gulp.task('copy:airports', () => {
        return gulp.src(OPTIONS.GLOB.STATIC_AIRPORTS)
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

        return merge(fonts, images);
    });


    ////////////////////////////////////////////////////////////////////
    // TASKS
    ////////////////////////////////////////////////////////////////////
    const runSequence = require('run-sequence');

    gulp.task('copy:dist', () => {
        runSequence(
            'copy:static',
            'copy:airports',
            'minifyAirports'
        )
    });
}

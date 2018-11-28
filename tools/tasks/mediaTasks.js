/* eslint-disable */
'use strict';

module.exports = function(gulp, config) {
    const jsonmin = require('gulp-jsonmin');
    const path = require('path');
    // const imagemin = require('gulp-imagemin');
    // const cache = require('gulp-cache');
    const merge = require('merge-stream');

    const OPTIONS = config;

    const jsonMinify = () => gulp.src([
            path.join(OPTIONS.DIR.DIST_AIRPORTS, '**/*.json'),
            path.join(OPTIONS.DIR.DIST_AIRPORTS, '**/*.geojson')
        ])
        .pipe(jsonmin())
        .pipe(gulp.dest(OPTIONS.DIR.DIST_AIRPORTS));

    const copyAirportFiles = () => gulp.src(OPTIONS.GLOB.STATIC_AIRPORTS)
        .pipe(gulp.dest(OPTIONS.DIR.DIST_AIRPORTS));;

    const copyStatic = () => {
        const fonts = gulp.src(OPTIONS.GLOB.FONTS).pipe(gulp.dest(OPTIONS.DIR.DIST_FONT));
        const images = gulp.src(OPTIONS.GLOB.IMAGES).pipe(gulp.dest(OPTIONS.DIR.DIST_IMAGES));

        return merge(fonts, images);
    };

    gulp.task('json:minify', gulp.series(jsonMinify));
    gulp.task('copy:airports', gulp.series(copyAirportFiles));
    gulp.task('copy:static', gulp.series(copyStatic));
    gulp.task('copy:dist', gulp.series(
            'copy:static',
            'copy:airports',
            'json:minify'
        )
    );
}

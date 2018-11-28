/* eslint-disable */
'use strict';

module.exports = function(gulp, config) {
    const path = require('path');
    const jsonmin = require('gulp-jsonmin');
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

    gulp.task(OPTIONS.TASKS.JSON.MINIFY, gulp.series(jsonMinify));
    gulp.task(OPTIONS.TASKS.COPY.AIRPORTS, gulp.series(copyAirportFiles));
    gulp.task(OPTIONS.TASKS.COPY.STATIC, gulp.series(copyStatic));
    gulp.task(OPTIONS.TASKS.COPY.DIST, gulp.series(
            OPTIONS.TASKS.COPY.STATIC,
            OPTIONS.TASKS.COPY.AIRPORTS,
            OPTIONS.TASKS.JSON.MINIFY
        )
    );
}

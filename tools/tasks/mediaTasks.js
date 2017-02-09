/* eslint-disable */
'use strict';

module.exports = function(gulp, config) {
    var OPTIONS = config;

    ////////////////////////////////////////////////////////////////////
    // OPTIMIZE AND COPY IMAGES
    ////////////////////////////////////////////////////////////////////
    var imagemin = require('gulp-imagemin');
    var cache = require('gulp-cache');

    gulp.task('minify-images', function(){
        return gulp.src(OPTIONS.GLOB.IMAGES)
            .pipe(cache(
                imagemin({
                    interlaced: true
                })
            ))
            .pipe(gulp.dest(OPTIONS.DIR.BUILD_IMAGES));
    });

    gulp.task('copy:dist', () => {
        gulp.src(OPTIONS.GLOB.STATIC_ASSETS)
            .pipe(gulp.dest(OPTIONS.DIR.DIST_ASSETS));
    });

    ////////////////////////////////////////////////////////////////////
    // TASKS
    ////////////////////////////////////////////////////////////////////

    // gulp.task('media', ['clean:build:styles']);
}

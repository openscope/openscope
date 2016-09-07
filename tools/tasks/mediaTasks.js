'use strict';

module.exports = function(gulp, config) {
    var OPTIONS = config;

    ////////////////////////////////////////////////////////////////////
    // MINIFY / COPY MEDIA FILES
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

    ////////////////////////////////////////////////////////////////////
    // TASKS
    ////////////////////////////////////////////////////////////////////

    // gulp.task('media', ['clean:build:styles']);
}

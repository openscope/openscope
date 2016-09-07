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

    ////////////////////////////////////////////////////////////////////
    // COPY FONTS
    ////////////////////////////////////////////////////////////////////
    gulp.task('fonts', function() {
        return gulp.src(OPTIONS.GLOB.FONTS)
            .pipe(gulp.dest(OPTIONS.DIR.BUILD_FONTS));
    });


    ////////////////////////////////////////////////////////////////////
    // TASKS
    ////////////////////////////////////////////////////////////////////

    // gulp.task('media', ['clean:build:styles']);
}

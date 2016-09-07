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
    // COPY `/aircraft`, `/airlines` and `airports`
    ////////////////////////////////////////////////////////////////////
    var path = require('path');

    gulp.task('json', function() {
        var directoriesToCopy = [
            OPTIONS.DIR.SRC_AIRCRAFT,
            OPTIONS.DIR.SRC_AIRLINES,
            OPTIONS.DIR.SRC_AIRPORTS
        ];

        directoriesToCopy.map(function(dir) {
            return gulp.src(dir + '**/*.json')
                .pipe(gulp.dest(OPTIONS.DIR.BUILD_ASSETS));
        });
    });

    ////////////////////////////////////////////////////////////////////
    // TASKS
    ////////////////////////////////////////////////////////////////////

    // gulp.task('media', ['clean:build:styles']);
}

'use strict';

module.exports = function(gulp, config) {
    var OPTIONS = config;

    ////////////////////////////////////////////////////////////////////
    // CONCAT MINIFY
    //
    // concat all css files imported into main.css, then output minified
    // css file to build/assets/style dir
    ////////////////////////////////////////////////////////////////////
    var cssnano = require('gulp-cssnano');
    var sourcemaps = require('gulp-sourcemaps');

    gulp.task('minify-css', function() {
        return gulp.src(OPTIONS.FILE.CSS_MAIN)
            .pipe(sourcemaps.init())
            .pipe(cssnano())
            .pipe(sourcemaps.write('.'))
            .pipe(gulp.dest(OPTIONS.DIR.BUILD_STYLE));
    });


    ////////////////////////////////////////////////////////////////////
    // TASKS
    ////////////////////////////////////////////////////////////////////
    gulp.task('build:styles', ['minify-css']);

    gulp.task('watch:styles', function() {
        gulp.watch(OPTIONS.GLOB.CSS, ['css',]);
    });
};

'use strict';

module.exports = function(gulp, config) {
    var OPTIONS = config;

    ////////////////////////////////////////////////////////////////////
    // CONCAT MINIFY
    //
    // concat all css files imported into main.css, then output minified
    // css file to build/assets/style dir
    ////////////////////////////////////////////////////////////////////
    var sourcemaps = require('gulp-sourcemaps');
    var minifyCss = require('gulp-minify-css');
    var concat = require('gulp-concat');
    var autoprefixer = require('gulp-autoprefixer');

    gulp.task('minify-css', function() {
        return gulp.src(OPTIONS.FILE.CSS_MAIN)
            .pipe(sourcemaps.init())
            .pipe(minifyCss())
            .pipe(autoprefixer('last 2 version', 'safari 5', 'ie 8', 'ie 9'))
            .pipe(concat('main.min.css'))
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

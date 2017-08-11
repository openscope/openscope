/* eslint-disable */
'use strict';

module.exports = function(gulp, config) {
    const OPTIONS = config;

    ////////////////////////////////////////////////////////////////////
    // CONCAT MINIFY
    //
    // concat all css files imported into main.css, then output
    // minified css file
    ////////////////////////////////////////////////////////////////////
    function buildStyles() {
        const sourcemaps = require('gulp-sourcemaps');
        const minifyCss = require('gulp-minify-css');
        const concat = require('gulp-concat');
        const autoprefixer = require('gulp-autoprefixer');

        return gulp.src(OPTIONS.FILE.CSS_MAIN)
            .pipe(sourcemaps.init())
            .pipe(minifyCss())
            .pipe(autoprefixer(
                'last 2 version',
                'safari 5',
                'ie 8',
                'ie 9'
            ))
            .pipe(concat('main.min.css'))
            .pipe(sourcemaps.write('.'))
            .pipe(gulp.dest(OPTIONS.DIR.DIST_STYLE));
    }

    gulp.task('minify-css', () => buildStyles());


    ////////////////////////////////////////////////////////////////////
    // TASKS
    ////////////////////////////////////////////////////////////////////
    gulp.task('build:styles', ['minify-css']);

    gulp.task('watch:styles', function() {
        gulp.watch(OPTIONS.GLOB.CSS, ['build:styles',]);
    });
};

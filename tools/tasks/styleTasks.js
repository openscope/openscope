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
        const less = require('gulp-less');
        const sourcemaps = require('gulp-sourcemaps');
        const minifyCss = require('gulp-minify-css');
        const concat = require('gulp-concat');
        const autoprefixer = require('gulp-autoprefixer');

        return gulp.src(OPTIONS.FILE.CSS_MAIN)
            .pipe(sourcemaps.init())
            .pipe(less())
            .pipe(autoprefixer(
                'last 2 version',
                'safari 5',
                'ie 8',
                'ie 9'
            ))
            .pipe(minifyCss())
            .pipe(concat('main.min.css'))
            .pipe(sourcemaps.write('.'))
            .pipe(gulp.dest(OPTIONS.DIR.DIST_STYLE));
    }

    ////////////////////////////////////////////////////////////////////
    // TASKS
    ////////////////////////////////////////////////////////////////////
    gulp.task('build:styles', () => buildStyles());

    gulp.task('watch:styles', () => {
        gulp.watch(OPTIONS.GLOB.LESS, ['build:styles',]);
    });
};

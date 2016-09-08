'use strict';

module.exports = function(gulp, config) {
    var OPTIONS = config;

    var browserify = require('gulp-browserify');
    var rename = require('gulp-rename');
    gulp.task('browserify', function() {
        return gulp.src(OPTIONS.FILE.JS_ENTRY)
            .pipe(browserify())
            .pipe(rename('bundle.js'))
            .pipe(gulp.dest(OPTIONS.DIR.BUILD_SCRIPTS));
    });

    ////////////////////////////////////////////////////////////////////
    // COPY SCRIPTS
    ////////////////////////////////////////////////////////////////////
    gulp.task('build:scripts:copy', function() {
        return gulp.src(OPTIONS.GLOB.JS)
            .pipe(gulp.dest(OPTIONS.DIR.BUILD_SCRIPTS));
    });

    ////////////////////////////////////////////////////////////////////
    // TASKS
    ////////////////////////////////////////////////////////////////////

    gulp.task('build:scripts', ['clean:build:scripts', 'browserify', 'build:scripts:copy']);
};

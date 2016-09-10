/* eslint-disable */
'use strict';

module.exports = function(gulp, config) {
    var OPTIONS = config;

    var browserify = require('browserify');
    var babelify = require('babelify');
    var sourcemaps = require('gulp-sourcemaps');
    var source = require('vinyl-source-stream');
    var buffer = require('vinyl-buffer');

    ////////////////////////////////////////////////////////////////////
    // BABEL
    ////////////////////////////////////////////////////////////////////
    gulp.task('babel', function () {
        browserify({
            entries: OPTIONS.FILE.JS_ENTRY,
            extensions: ['.js'],
            debug: true
        })
        .transform(babelify, {
            presets: ['es2015', 'react', 'stage-0']
        })
        .bundle()
        .pipe(source('bundle.js'))
        .pipe(buffer())
        .pipe(sourcemaps.init({ loadMaps: true }))
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest(OPTIONS.DIR.BUILD_SCRIPTS));
    });

    ////////////////////////////////////////////////////////////////////
    // ESLINT
    ////////////////////////////////////////////////////////////////////
    var gutil = require('gulp-util');
    var eslint = require('gulp-eslint');

    gulp.task('lint:scripts', function() {
        gulp.src([OPTIONS.GLOB.JS])
            .pipe(eslint({
                useEslintrc: true
            }))
            .pipe(eslint.results(results => {
                // Called once for all ESLint results.
                gutil.log('\n');
                gutil.log(gutil.colors.cyan('ESLint result: '));
                gutil.log(gutil.colors.cyan(`Total Files: ${results.length}`));
                gutil.log(gutil.colors.yellow(`Total Warnings: ${results.warningCount}`));
                gutil.log(gutil.colors.red(`Total Errors: ${results.errorCount}`));
            }))
            .pipe(eslint.format());
    });

    ////////////////////////////////////////////////////////////////////
    // TASKS
    ////////////////////////////////////////////////////////////////////

    gulp.task('build:scripts', ['clean:build:scripts', 'babel']);

    gulp.task('watch:scripts', function() {
        gulp.watch(OPTIONS.GLOB.JS, ['clean:build:scripts', 'babel']);
    });
};

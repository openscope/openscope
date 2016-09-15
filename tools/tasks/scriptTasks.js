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
    var Table = require('cli-table');
    var t = new Table({
        head: ['Filename', 'Errors', 'Wranings']
    });

    gulp.task('lint:scripts', function() {
        gulp.src([OPTIONS.GLOB.JS])
            .pipe(eslint({
                useEslintrc: true
            }))
            .pipe(eslint.result(function (result) {
                    t.push([
                        result.filePath.split('scripts')[1],
                        gutil.colors.red(result.errorCount),
                        gutil.colors.yellow(result.warningCount)
                    ]);
                })
            )
            .pipe(eslint.results(results => {
                // Add a footer to the results table
                t.push([
                    gutil.colors.cyan(`Total: ${results.length}`),
                    gutil.colors.red(results.errorCount),
                    gutil.colors.yellow(results.warningCount)
                ])

                gutil.log(gutil.colors.cyan('--- ---- --- ESLint Results --- ---- --- '));
                console.log('\n' + t);
                // // Called once for all ESLint results.
                // gutil.log('\n');
                // gutil.log(gutil.colors.cyan(`Total Files: ${results.length}`));
                // gutil.log(gutil.colors.yellow(`Total Warnings: ${results.warningCount}`));
                // gutil.log(gutil.colors.red(`Total Errors: ${results.errorCount}`));
            }))
            .pipe(eslint.format('checkstyle'));
    });

    ////////////////////////////////////////////////////////////////////
    // TASKS
    ////////////////////////////////////////////////////////////////////

    gulp.task('build:scripts', ['clean:build:scripts', 'babel']);

    gulp.task('watch:scripts', function() {
        gulp.watch(OPTIONS.GLOB.JS, ['clean:build:scripts', 'babel']);
    });
};

/* eslint-disable */

module.exports = function(gulp, config) {
    const OPTIONS = config;

    const browserify = require('browserify');
    const babelify = require('babelify');
    const babel = require('gulp-babel');
    const uglify = require('gulp-uglify');
    const gulpif = require('gulp-if');
    const sourcemaps = require('gulp-sourcemaps');
    const path = require('path');
    const source = require('vinyl-source-stream');
    const buffer = require('vinyl-buffer');

    const cli = require('../cli');

    ////////////////////////////////////////////////////////////////////
    // BABEL
    ////////////////////////////////////////////////////////////////////
    gulp.task('babel', function () {
        browserify({
            entries: OPTIONS.FILE.JS_ENTRY_CLIENT,
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
        // .pipe(gulpif(cli.argv.isProd, uglify()))
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest(OPTIONS.DIR.BUILD_SCRIPTS_CLIENT));
    });

    gulp.task('babel-server', function () {
        gulp.src([path.join(OPTIONS.DIR.SRC_SCRIPTS_SERVER, '**/*.js')])
            .pipe(babel({
                presets: ['es2015']
            }))
            .pipe(gulp.dest(OPTIONS.DIR.BUILD_SCRIPTS_SERVER))
    });

    ////////////////////////////////////////////////////////////////////
    // ESLINT
    ////////////////////////////////////////////////////////////////////
    const gutil = require('gulp-util');
    const eslint = require('gulp-eslint');
    const Table = require('cli-table');
    const t = new Table({
        head: ['Filename', 'Errors', 'Wranings']
    });

    gulp.task('lint:scripts', function() {
        gulp.src([OPTIONS.GLOB.JS])
            .pipe(eslint({
                useEslintrc: true
            }))
            .pipe(eslint.result((result) => {
                t.push([
                    result.filePath.split('scripts')[1],
                    gutil.colors.red(result.errorCount),
                    gutil.colors.yellow(result.warningCount)
                ]);
            }))
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
    gulp.task('build:scripts', ['babel']);
    gulp.task('build:server', ['babel-server']);

    gulp.task('watch:scripts', function() {
        gulp.watch(OPTIONS.GLOB.JS, ['babel-server', 'babel']);
    });
};

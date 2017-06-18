/* eslint-disable */

module.exports = function(gulp, config) {
    const OPTIONS = config;
    const cli = require('../cli');

    ////////////////////////////////////////////////////////////////////
    // TYPESCRIPT
    ////////////////////////////////////////////////////////////////////

    function buildTsScripts() {
        const browserify = require('browserify');
        const uglify = require('gulp-uglify');
        const gulpif = require('gulp-if');
        const sourcemaps = require('gulp-sourcemaps');
        const rename = require('gulp-rename');
        const source = require('vinyl-source-stream');
        const buffer = require('vinyl-buffer');
        const tsify = require('tsify');

        return browserify({
            baseDir: '.',
            debug: !cli.argv.isProd,
            entries: OPTIONS.FILE.TS_ENTRY_CLIENT,
            cache: {},
            packageCache: {}
        })
        .plugin(tsify)
        .bundle()
        .pipe(source('bundle.js'))
            .pipe(buffer())
            .pipe(sourcemaps.init({ loadMaps: true }))
            .pipe(gulpif(cli.argv.isProd, uglify({
                mangle: false
            })))
            .pipe(rename({ suffix: '.min' }))
            .pipe(sourcemaps.write('./'))
            .pipe(gulp.dest(OPTIONS.DIR.DIST_SCRIPTS_CLIENT));
    }

    gulp.task('ts', () => buildTsScripts());

    ////////////////////////////////////////////////////////////////////
    // BABEL
    ////////////////////////////////////////////////////////////////////

    gulp.task('babel-server', () => {
        const babel = require('gulp-babel');
        const path = require('path');

        return gulp.src([path.join(OPTIONS.DIR.SRC_SCRIPTS_SERVER, '**/*.js')])
            .pipe(babel({
                presets: ['es2015']
            }))
            .pipe(gulp.dest(OPTIONS.DIR.DIST_SCRIPTS_SERVER))
    });

    ////////////////////////////////////////////////////////////////////
    // TASKS
    ////////////////////////////////////////////////////////////////////
    gulp.task('build:scripts', ['ts']);
    // TODO: replace with TS task some point in the future
    gulp.task('build:server', ['babel-server']);

    gulp.task('watch:scripts', () => {
        gulp.watch(OPTIONS.GLOB.JS, ['babel-server', 'babel']);
    });
};

/* eslint-disable */

module.exports = function(gulp, config) {
    const path = require('path');
    const browserify = require('browserify');
    const babelify = require('babelify');
    const source = require('vinyl-source-stream');
    const buffer = require('vinyl-buffer');
    const sourcemaps = require('gulp-sourcemaps');
    const gulpif = require('gulp-if');
    const uglify = require('gulp-uglify');
    const rename = require('gulp-rename');
    const cli = require('../cli');
    const OPTIONS = config;

    const buildScripts = () => {
        const b = browserify({
            entries: OPTIONS.FILE.JS_ENTRY_CLIENT,
            extensions: ['.js'],
            debug: true,
            transform: [babelify]
        });

        return b.bundle()
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

    const buildServer = () => gulp.src('**/*.js', {cwd: OPTIONS.DIR.SRC_SCRIPTS_SERVER})
        .pipe(gulp.dest(OPTIONS.DIR.DIST_SCRIPTS_SERVER));

    gulp.task(OPTIONS.TASKS.BUILD.SCRIPTS, gulp.series(buildScripts));
    gulp.task(OPTIONS.TASKS.BUILD.SERVER, gulp.series(buildServer));
    gulp.task(OPTIONS.TASKS.WATCH.SCRIPTS, () => {
        gulp.watch(OPTIONS.GLOB.JS).on('change', () => buildScripts());
    });
};

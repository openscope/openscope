const gulp = require('gulp');

const paths = require('../paths');
const cli = require('../cli');
const pkg = require('../../package.json');

function buildMarkup() {
    const handlebarsHelpers = require('handlebars-helpers');
    const handlebarsLayouts = require('handlebars-layouts');
    const hb = require('gulp-hb');
    const rename = require('gulp-rename');

    const src = [
        `${paths.DIR.SRC}/**/*.hbs`,
        `!${paths.DIR.SRC}/assets/**`,
        `!${paths.DIR.SRC}/templates/**`
    ];

    // const versionStr = cli.argv.isProd
    //     ? pkg.version
    //     : new Date().getTime();

    return gulp.src(src)
        .pipe(hb()
            .partials(`${paths.DIR.SRC}/templates/**/*.hbs`)
            .helpers(handlebarsHelpers)
            .helpers(handlebarsLayouts)
            .data({
                version: pkg.version,
                date: new Date().toISOString()
            })
        )
        .pipe(rename(path => { path.extname = '.html'; }))
        .pipe(gulp.dest(paths.DIR.DIST));
}

module.exports = buildMarkup;

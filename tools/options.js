const path = require('path');

const ROOT = path.join(__dirname, '../');
const src = './src';
const srcAssetsDir = path.join(src, 'assets');
const srcDocumentationDir = path.join(ROOT, 'documentation/airport-guides');
const srcMarkup = path.join(src, 'templates');
const scrScriptsFonts = path.join(srcAssetsDir, 'fonts');
const srcScriptsDir = path.join(srcAssetsDir, 'scripts');
const srcScriptsServerDir = path.join(srcScriptsDir, 'server');
const srcScriptsClientDir = path.join(srcScriptsDir, 'client');
const srcStylesDir = path.join(srcAssetsDir, 'style');
const srcImagesDir = path.join(srcAssetsDir, 'images');
const build = ROOT;
const buildAssetsDir = path.join(ROOT, 'assets');
const dist = path.join(ROOT, 'public');
const distAssets = path.join(dist, 'assets');

// configuration object that wraps all path/file/glob instructions
const options = {};

options.ROOT = ROOT;
options.DIR = {
    SRC: src,
    SRC_ASSETS: srcAssetsDir,
    SRC_FONTS: scrScriptsFonts,
    SRC_GUIDES: srcDocumentationDir,
    SRC_MARKUP: srcMarkup,
    SRC_SCRIPTS: srcScriptsDir,

    SRC_SCRIPTS_SERVER: srcScriptsServerDir,
    SRC_SCRIPTS_CLIENT: srcScriptsClientDir,
    SRC_STYLE: srcStylesDir,
    SRC_IMAGES: srcImagesDir,

    BUILD: build,
    BUILD_ASSETS: buildAssetsDir,
    ASSETS_AIRCRAFT: path.join(buildAssetsDir, 'aircraft'),
    ASSETS_AIRLINES: path.join(buildAssetsDir, 'airlines'),
    ASSETS_AIRPORTS: path.join(buildAssetsDir, 'airports'),
    BUILD_FONTS: path.join(buildAssetsDir, 'fonts'),
    BUILD_IMAGES: path.join(buildAssetsDir, 'images'),

    DIST: dist,
    DIST_ASSETS: distAssets,
    DIST_AIRCRAFT: path.join(distAssets, 'aircraft'),
    DIST_AIRLINES: path.join(distAssets, 'airlines'),
    DIST_AIRPORTS: path.join(distAssets, 'airports'),
    DIST_GUIDES: path.join(distAssets, 'guides'),
    DIST_FONT: path.join(distAssets, 'fonts'),
    DIST_IMAGES: path.join(distAssets, 'images'),
    DIST_SCRIPTS_CLIENT: path.join(distAssets, 'scripts/client'),
    DIST_SCRIPTS_SERVER: path.join(distAssets, 'scripts/server'),
    DIST_STYLE: path.join(distAssets, 'style')
};

// for specific files
options.FILE = {
    JS_ENTRY_CLIENT: path.join(options.DIR.SRC_SCRIPTS_CLIENT, 'index.js'),
    JS_ENTRY_SERVER: path.join(options.DIR.SRC_SCRIPTS_SERVER, 'index.js'),
    CSS_MAIN: path.join(options.DIR.SRC_STYLE, 'main.less'),
    PKG_JSON: path.join(options.ROOT, 'package.json'),
    AIRCRAFT_JSON: path.join(options.DIR.ASSETS_AIRCRAFT, 'aircraft.json'),
    AIRLINES_JSON: path.join(options.DIR.ASSETS_AIRLINES, 'airlines.json'),
    CHANGELOG_SOURCE: path.join(options.ROOT, 'CHANGELOG.md'),
    CHANGELOG_DEST: path.join(options.DIR.DIST_ASSETS, 'changelog.json')
};

options.GLOB = {
    STATIC_ASSETS: path.join(options.DIR.BUILD_ASSETS, '**/*'),
    STATIC_JSON: path.join(options.DIR.BUILD_ASSETS, '**/*.json'),
    STATIC_AIRPORTS: path.join(options.DIR.BUILD_ASSETS, 'airports/**/*'),
    FONTS: path.join(options.DIR.BUILD_ASSETS, 'fonts/**/*'),
    IMAGES: path.join(options.DIR.BUILD_ASSETS, 'images/**/*'),
    SRC: path.join(options.DIR.SRC, '**/*'),
    BUILD: path.join(options.DIR.BUILD, '**/*'),
    JS: path.join(options.DIR.SRC_SCRIPTS, '**/*.js'),
    LESS: path.join(options.DIR.SRC_STYLE, '**/*.less'),
    MARKUP: path.join(options.DIR.SRC_MARKUP, '**/*.hbs')
};

options.TASKS = {
    BUILD: {
        SCRIPTS: 'build:scripts',
        SERVER: 'build:server',
        STYLES: 'build:styles',
        DEFAULT: 'build'
    },
    CLEAN: {
        DEFAULT: 'clean'
    },
    COPY: {
        AIRPORTS: 'copy:airports',
        STATIC: 'copy:static',
        DIST: 'copy:dist'
    },
    DEFAULT: 'default',
    MARKUP: 'markup',
    MARKDOWN: {
        ASSEMBLE: 'markdown:assemble',
        CHANGELOG: 'markdown:changelog'
    },
    JSON: {
        ASSEMBLE: 'json:assemble',
        MINIFY: 'json:minify'
    },
    WATCH: {
        DEFAULT: 'watch',
        SCRIPTS: 'watch:scripts',
        STYLES: 'watch:styles'
    }
}

module.exports = options;

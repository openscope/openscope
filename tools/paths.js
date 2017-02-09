/* eslint-disable */
'use strict';

const path = require('path');

const ROOT = path.join(__dirname, '../');

const src = './src';
const srcAssetsDir = path.join(src, 'assets');
const srcMarkup = path.join(src, 'templates');
const scrScriptsFonts = path.join(srcAssetsDir, 'fonts');
const srcScriptsDir = path.join(srcAssetsDir, 'scripts');
const srcScriptsServerDir = path.join(srcScriptsDir, 'server');
const srcScriptsClientDir = path.join(srcScriptsDir, 'client');
const srcStylesDir = path.join(srcAssetsDir, 'style');
const srcImagesDir = path.join(srcAssetsDir, 'images');

const build = ROOT;
const buildAssetsDir = path.join(ROOT, 'assets');
const buildFontsDir = path.join(buildAssetsDir, 'fonts');
const buildScriptsDir = path.join(buildAssetsDir, 'scripts');
const buildScriptsServerDir = path.join(buildScriptsDir, 'server');
const buildScriptsClientDir = path.join(buildScriptsDir, 'client');
const buildStylesDir = path.join(buildAssetsDir, 'style');
const buildImagesDir = path.join(buildAssetsDir, 'images');

const dist = path.join(ROOT, 'public');

// configuration object that wraps all path/file/glob
const options = {};
options.ROOT = ROOT;
options.DIR = {
    SRC: src,
    SRC_ASSETS: srcAssetsDir,
    SRC_FONTS: scrScriptsFonts,
    SRC_MARKUP: srcMarkup,
    SRC_SCRIPTS: srcScriptsDir,
    SRC_SCRIPTS_SERVER: srcScriptsServerDir,
    SRC_SCRIPTS_CLIENT: srcScriptsClientDir,
    SRC_STYLE: srcStylesDir,
    SRC_IMAGES: srcImagesDir,

    BUILD: build,
    BUILD_ASSETS: buildAssetsDir,
    BUILD_FONTS: buildFontsDir,
    BUILD_SCRIPTS: buildScriptsDir,
    BUILD_SCRIPTS_SERVER: buildScriptsServerDir,
    BUILD_SCRIPTS_CLIENT: buildScriptsClientDir,
    BUILD_STYLE: buildStylesDir,
    BUILD_IMAGES: buildImagesDir,

    DIST: dist
};

// for specific files
options.FILE = {
    JS_ENTRY_CLIENT: path.join(options.DIR.SRC_SCRIPTS_CLIENT, 'index.js'),
    JS_ENTRY_SERVER: path.join(options.DIR.SRC_SCRIPTS_SERVER, 'index.js'),
    CSS_MAIN: path.join(options.DIR.SRC_STYLE, 'main.css'),
    PKG_JSON: path.join(options.ROOT, 'package.json')
};

options.GLOB = {
    SRC: path.join(options.DIR.SRC, '**/*'),
    BUILD: path.join(options.DIR.BUILD, '**/*'),
    JS: path.join(options.DIR.SRC_SCRIPTS, '**/*.js'),
    CSS: path.join(options.DIR.SRC_STYLE, '**/*.css'),
    FONTS: path.join(options.DIR.SRC_ASSETS, 'fonts/**/*'),
    IMAGES: path.join(options.DIR.SRC_IMAGES, '**/*.+(png|jpg|gif|svg)'),
    MARKUP: path.join(options.DIR.SRC_MARKUP, '**/*.hbs')
};

module.exports = options;

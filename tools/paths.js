/* eslint-disable */
'use strict';

var path = require('path');
var ROOT = path.join(__dirname, '../');

var src = './src';
var srcAssetsDir = path.join(src, 'assets');
var scrScriptsFonts = path.join(srcAssetsDir, 'fonts');
var srcScriptsDir = path.join(srcAssetsDir, 'scripts');
var srcScriptsServerDir = path.join(srcScriptsDir, 'server');
var srcScriptsClientDir = path.join(srcScriptsDir, 'client');
var srcStylesDir = path.join(srcAssetsDir, 'style');
var srcImagesDir = path.join(srcAssetsDir, 'images');

var build = ROOT;
var buildAssetsDir = path.join(ROOT, 'assets');
var buildFontsDir = path.join(buildAssetsDir, 'fonts');
var buildScriptsDir = path.join(buildAssetsDir, 'scripts');
var buildScriptsServerDir = path.join(buildScriptsDir, 'server');
var buildScriptsClientDir = path.join(buildScriptsDir, 'client');
var buildStylesDir = path.join(buildAssetsDir, 'style');
var buildImagesDir = path.join(buildAssetsDir, 'images');

// configuration object that wraps all path/file/glob
var options = {};
options.ROOT = ROOT;
options.DIR = {
    SRC: src,
    SRC_ASSETS: srcAssetsDir,
    SRC_FONTS: scrScriptsFonts,
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
    IMAGES: path.join(options.DIR.SRC_IMAGES, '**/*.+(png|jpg|gif|svg)')
};

module.exports = options;

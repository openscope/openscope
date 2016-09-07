'use strict';

var path = require('path');

var ROOT = path.join(__dirname, './');


var src = './src';
var srcAssetsDir = path.join(src, 'assets');
var srcScriptsDir = path.join(srcAssetsDir, 'scripts');
var srcStylesDir = path.join(srcAssetsDir, 'style');
var srcImagesDir = path.join(srcAssetsDir, 'images');

var build = './build';
var buildAssetsDir = path.join(build, 'assets');
var buildScriptsDir = path.join(buildAssetsDir, 'scripts');
var buildStylesDir = path.join(buildAssetsDir, 'style');
var buildImagesDir = path.join(buildAssetsDir, 'images');


// configuration object that wraps all path/file/glob
var options = {};
options.ROOT = ROOT;
options.DIR = {
    SRC: src,
    SRC_ASSETS: srcAssetsDir,
    SRC_SCRIPTS: srcScriptsDir,
    SRC_STYLE: srcStylesDir,
    SRC_IMAGES: srcImagesDir,

    BUILD: build,
    BUILD_ASSETS: buildAssetsDir,
    BUILD_SCRIPTS: buildScriptsDir,
    BUILD_STYLE: buildStylesDir,
    BUILD_IMAGES: buildImagesDir
};

// for specific files
options.FILE = {
    CSS_MAIN: path.join(options.DIR.SRC_STYLE, 'main.css'),
    PKG_JSON: path.join(options.ROOT, 'package.json')
};

options.GLOB = {
    SRC: path.join(options.DIR.SRC, '**/*'),
    BUILD: path.join(options.DIR.BUILD, '**/*'),
    JS: path.join(options.DIR.SRC, '**/*.js'),
    CSS: path.join(options.DIR.SRC, '**/*.css'),
    IMAGES: path.join(options.DIR.SRC_IMAGES, '**/*.+(png|jpg|gif|svg)')
};


module.exports = options;

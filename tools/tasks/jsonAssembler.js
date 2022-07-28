const fs = require('fs');
const path = require('path');
const mkdirp = require('mkdirp');
const fancyLog = require('fancy-log');
const colors = require('ansi-colors');
const OPTIONS = require('../options');

const BUILD_CONFIG = [
    [OPTIONS.DIR.ASSETS_AIRCRAFT, 'aircraft.json', OPTIONS.DIR.DIST_AIRCRAFT],
    [OPTIONS.DIR.ASSETS_AIRLINES, 'airlines.json', OPTIONS.DIR.DIST_AIRLINES]
];

/**
 * Read `source` and build object in memory of contents.
 *
 * Gets called before attempting to write single file
 * to destination directory
 *
 * @function _buildResultList
 * @param  source {string}
 * @param  outputFilename {string}
 * @return {array<object>}
 */
function _buildResultList(source, outputFilename) {
    const result = [];

    // read the directory and loop through each file found
    fs.readdirSync(source).forEach((filename) => {
        // build a source path that can be used to open the file
        const fileSource = path.join(source, filename);

        // if the file contains the outputFilename, we don't want to add it to our list
        if (fileSource.indexOf(outputFilename) !== -1) {
            fancyLog(colors.yellow(`--- Skipping ${outputFilename}`));

            return;
        }

        // read the file as a string and JSON.parse() the contents.
        const fileData = JSON.parse(fs.readFileSync(fileSource, 'utf8'));

        result.push(fileData);
    });

    return result;
}

/**
 * Create a `destination` dir if one does not exist then attempt to
 * write `outputFilename` to that directory
 *
 * @function _createDestinationDirAndFile
 * @param  destination {string}     destination directory name
 * @param  outputFilename {string}
 * @param  data {array<object>}     object in memory to write to file
 * @returns {void|Promise.reject}
 */
function _createDestinationDirAndFile(destination, outputFilename, data) {
    const rootKey = outputFilename.split('.')[0];
    const outFilenameWithPath = path.join(destination, outputFilename);
    // create an object with a dynamic key and add the result list to it
    const jsonOutput = JSON.stringify({ [rootKey]: data });

    // create `destination` directory, with parents, if it doesnt exist
    mkdirp(destination, (error) => {
        if (error) {
            return Promise.reject(error);
        }

        // write the new file
        fs.writeFile(outFilenameWithPath, jsonOutput, (error) => {
            if (error) {
                return Promise.reject(error);
            }
        });
    });
}

/**
 * Crawl a `source` dir for json files, create a `destination` dir
 * and write a single json file with `outputFilename`
 *
 * @function jsonAssembler
 * @param source {string}
 * @param outputFilename {string}
 * @param destination {string}
 */
function _jsonAssembler(source, outputFilename, destination) {
    fancyLog(colors.cyan(`--- Preparing ${outputFilename}`));

    const result = _buildResultList(source, outputFilename);

    _createDestinationDirAndFile(destination, outputFilename, result);
    fancyLog(colors.green(`--- ${result.length} items written sucessfully to ${outputFilename}`));
}

/**
 * Combines multiple json files into single, minified json file
 *
 * Used to combine small airlines and aircraft files into single
 * json file that can be consumed in production
 *
 * @public
 * @function jsonAssembler
 * @returns {Promise.resolve}
 */
function jsonAssembler() {
    for (let i = 0; i < BUILD_CONFIG.length; i++) {
        _jsonAssembler(...BUILD_CONFIG[i]);
    }

    return Promise.resolve();
}

module.exports = jsonAssembler;

const fs = require('fs');
const path = require('path');
const mkdirp = require('mkdirp');
const paths = require('../options');

const BUILD_CONFIG = [
    [paths.DIR.ASSETS_AIRCRAFT, 'aircraft.json', paths.DIR.DIST_AIRCRAFT],
    [paths.DIR.ASSETS_AIRLINES, 'airlines.json', paths.DIR.DIST_AIRLINES]
];

/**
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
            console.log(`--- Skipping ${outputFilename}`);

            return;
        }

        // read the file as a string and JSON.parse() the contents.
        const fileData = JSON.parse(fs.readFileSync(fileSource, 'utf8'));

        result.push(fileData);
    });

    return result;
}

/**
 *
 * @function _createDestinationDirAndFile
 * @param  destination {string}
 * @param  outputFilename {string}
 * @param  data {array<object>}
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
 *
 * @function jsonAssembler
 * @param source {string}
 * @param outputFilename {string}
 * @param destination {string}
 */
function _jsonAssembler(source, outputFilename, destination) {
    console.log(`--- Preparing ${outputFilename}`);

    const result = _buildResultList(source, outputFilename);

    _createDestinationDirAndFile(destination, outputFilename, result);

    console.log(`--- ${result.length} items written sucessfully to ${outputFilename}`);
}

/**
 *
 *
 * @function jsonAssembler
 * @public
 */
function jsonAssembler() {
    for (let i = 0; i < BUILD_CONFIG.length; i++) {
        _jsonAssembler(...BUILD_CONFIG[i]);
    }

    return Promise.resolve();
}

module.exports = jsonAssembler;

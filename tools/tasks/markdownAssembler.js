const fs = require('fs');
const fancyLog = require('fancy-log');
const colors = require('ansi-colors');
const path = require('path');
const mkdirp = require('mkdirp');
const showdown = require('showdown');
const options = require('../options');

/**
 * Encapsulates the `makeHtml` method from `showdownjs`.
 *
 * @method _generateHtmlFromMarkdown
 * @param {string} markdown
 * @returns {string} html
 */
function _generateHtmlFromMarkdown(markdown) {
    const converterOptions = {
        tables: true,
        simpleLineBreaks: true
    };
    const converter = new showdown.Converter(converterOptions);

    return converter.makeHtml(markdown);
}

/**
 * Grabs the markdown files and returns the data and icao in an object
 *
 * @method _generateAirportGuideDict
 * @returns {[key: string]: string}  object with airport icao as key and markdown as values
 */
function _generateAirportGuideDict() {
    const airportGuideDict = {};

    fs.readdirSync(options.DIR.SRC_GUIDES).forEach((filename) => {
        if (filename.includes('airport-guide-directory')) {
            fancyLog(colors.yellow('--- skipping airport-guide-directory, its not an airport file'));

            return;
        }

        const pathToGuideFile = path.join(options.DIR.SRC_GUIDES, filename);
        const fileData = fs.readFileSync(pathToGuideFile, { encoding: 'utf8' });
        const icao = filename.split('.')[0];

        // If the file is empty, there is no guide, so we do not need to write it
        if (!fileData) {
            fancyLog(colors.yellow(`--- skipping airport: ${icao.toUpperCase()}, no airport guide found `));

            return;
        }

        airportGuideDict[icao] = fileData;
    });

    return airportGuideDict;
}

/**
 * Iterates through each airport, converting the markdown to HTML.
 * Returns a similar object, with ICAO keys and HTML values.
 *
 * @param {object} airportGuideDict
 * @returns {object} the object, with markdown parsed to HTML.
 */
function parseFiles(airportGuideDict) {
    const airportGuideJson = {};

    for (const key in airportGuideDict) {
        airportGuideJson[key] = _generateHtmlFromMarkdown(airportGuideDict[key]);
    }

    return airportGuideJson;
}

/**
 * Asynchronously creates the `public/assets/guides` directory, if needed,
 * then writes the airport guides to a single file, `guides.json`.
 *
 * Will throw a `Promise.reject()`, should directory creation or file writing fail.
 *
 * @param {object} input
 */
function _writeFileOutput(input) {
    const filePathToWrite = path.join(options.DIR.DIST_GUIDES, 'guides.json');
    const jsonOutput = JSON.stringify(input);

    mkdirp(options.DIR.DIST_GUIDES, (err) => {
        if (err) {
            fancyLog(colors.red(`--- Failed to create ${options.DIR.DIST_GUIDES}`));

            return Promise.reject(err);
        }

        fs.writeFile(filePathToWrite, jsonOutput, (writeFileError) => {
            if (writeFileError) {
                fancyLog(colors.red('--- Failed to write guidefile guides.json'));

                return Promise.reject(writeFileError);
            }

            fancyLog(colors.green('--- sucessfully created guides.json'));
        });
    });
}

/**
 * Assembles the airport guide markdown into readable JSON, which
 * is itself a string of HTML.
 *
 * @returns {Promise} promise
 */
function markdownAssembler() {
    fancyLog(colors.cyan('--- preparing guides.json'));

    const airportGuideDict = _generateAirportGuideDict();
    const markdown = parseFiles(airportGuideDict);

    _writeFileOutput(markdown);

    return Promise.resolve();
}

module.exports = markdownAssembler;

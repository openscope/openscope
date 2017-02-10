const fs = require('fs');
const path = require('path');
const gutil = require('gulp-util');

const paths = require('../paths');

const MERGE_CONFIG = [
    [paths.DIR.BUILD_ASSETS_AIRCRAFT, 'aircraft.json', paths.DIR.BUILD_ASSETS_AIRCRAFT],
    [paths.DIR.BUILD_ASSETS_AIRLINES, 'airlines.json', paths.DIR.BUILD_ASSETS_AIRLINES]
];

function jsonAssembler(source, outputFilename, destination) {
    const result = [];
    const rootKey = outputFilename.split('.')[0];
    const outFilenameWithPath = path.join(destination, outputFilename);
    const shortOutputPath = outFilenameWithPath.split('openscope')[1];

    gutil.log(gutil.colors.cyan(`::: Preparing ${outputFilename}`));

    // read the directory and loop through each file found
    fs.readdirSync(source).forEach((filename) => {
        // build a source path that can be used to open the file
        const fileSource = path.join(source, filename);

        // if the file contains the outputFilename, we don't want to add it to our list
        if (fileSource.indexOf(outputFilename) !== -1) {
            gutil.log(gutil.colors.yellow(`::: Skipping ${outputFilename}`));

            return;
        }

        // read the file as a string and JSON.parse() the contents.
        const fileData = JSON.parse(fs.readFileSync(fileSource, 'utf8'));

        result.push(fileData);
    });

    // create an object with a dynamic key and add the result list to it
    const jsonOutput = JSON.stringify({ [rootKey]: result });

    // write the new file
    fs.writeFile(outFilenameWithPath, jsonOutput, (error) => {
        if (error) {
            throw error;
        }

        gutil.log(gutil.colors.green(`::: ${result.length} items written sucessfully to ${shortOutputPath}`));
    });
}

module.exports = () => {
    for (let i = 0; i < MERGE_CONFIG.length; i++) {
        jsonAssembler(...MERGE_CONFIG[i]);
    }
};

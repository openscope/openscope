import ava from 'ava';
import fs from 'fs';
import path from 'path';
import _forEach from 'lodash/forEach';

const airportAssetsPath = path.join(__dirname, '..', '..', 'assets', 'airports');
const erroringFileNames = [];
const fileNames = fs.readdirSync(airportAssetsPath);

ava('All airport JSON files contain valid JSON data', (t) => {
    _forEach(fileNames, (fileName) => {
        if (fileName.indexOf('.json') === -1) {
            return;
        }

        const filePath = airportAssetsPath.concat('/', fileName);
        const airportJson = fs.readFileSync(filePath, 'utf-8');

        try {
            JSON.parse(airportJson);
        } catch (e) {
            erroringFileNames.push(fileName);
            console.error(e);
        }

        t.deepEqual(erroringFileNames, []);
    });
});

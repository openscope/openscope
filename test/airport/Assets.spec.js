import ava from 'ava';
import fs from 'fs';
import path from 'path';

const AirportAssetsPath = path.join(__dirname, '..', '..', 'assets', 'airports');
let error = [];
const files = fs.readdirSync(AirportAssetsPath);

ava('Airport JSON  file does not throw', (t) => {
    files.forEach((file) => {
        if (file.indexOf('.json') !== -1) {
            const PathFile = AirportAssetsPath.concat('/', file);
            const AirportJson = fs.readFileSync(PathFile, 'utf-8');
            t.notThrows(() => JSON.parse(AirportJson));
            try {
                JSON.parse(AirportJson);
            } catch (e) {
                error.push(file);
            }
        }
    });
    console.log('There is Error in : ' + error);
});

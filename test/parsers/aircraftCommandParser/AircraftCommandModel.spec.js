/* eslint-disable arrow-parens, max-len, import/no-extraneous-dependencies */
import ava from 'ava';

import AircraftCommandModel from '../../../src/assets/scripts/client/parsers/aircraftCommandParser/AircraftCommandModel';


ava('does not thow when instantiated without parameters', t => {
    t.notThrows(() => new AircraftCommandModel());
});

// ava('#parsedArgs returns a string if the arg is a string', t => {
//     const model = new AircraftCommandModel('heading');
//     model.args.push('right');
//
//     t.true(typeof model.parsedArgs[0] === 'string');
// });
//
// ava('#parsedArgs returns a number if the arg is a number', t => {
//     const model = new AircraftCommandModel('heading');
//     model.args.push('180');
//
//     t.true(typeof model.parsedArgs[0] === 'number');
// });
//
// ava('#parsedArgs returns a string padded by 0 if original arg is padded by 0', t => {
//     const model = new AircraftCommandModel('heading');
//     model.args.push('090');
//
//     t.true(model.parsedArgs[0] === '090');
// });

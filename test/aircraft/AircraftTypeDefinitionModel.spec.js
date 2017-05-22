import ava from 'ava';

import AircraftTypeDefinitionModel from '../../src/assets/scripts/client/aircraft/AircraftTypeDefinitionModel';
import { AIRCRAFT_DEFINITION_MOCK } from './_mocks/aircraftMocks';

ava('throws when passed invalid parameters', (t) => {
    t.throws(() => new AircraftTypeDefinitionModel());
    t.throws(() => new AircraftTypeDefinitionModel([]));
    t.throws(() => new AircraftTypeDefinitionModel({}));
    t.throws(() => new AircraftTypeDefinitionModel(42));
    t.throws(() => new AircraftTypeDefinitionModel('threeve'));
    t.throws(() => new AircraftTypeDefinitionModel(false));
});

ava('does not throw when passed valid parameters', (t) => {
    t.notThrows(() => new AircraftTypeDefinitionModel(AIRCRAFT_DEFINITION_MOCK));
});

ava('._buildIcaoWithWeightClass() returns the icao when not a heavy/super weightclass', (t) => {
    const model = new AircraftTypeDefinitionModel(AIRCRAFT_DEFINITION_MOCK);
    const result = model._buildIcaoWithWeightClass();

    t.true(result === 'B737');
});

ava('._buildIcaoWithWeightClass() returns the correct string for H weightclass', (t) => {
    const model = new AircraftTypeDefinitionModel(AIRCRAFT_DEFINITION_MOCK);
    model.weightclass = 'H';
    const result = model._buildIcaoWithWeightClass();

    t.true(result === 'H/B737');
});

ava('._buildIcaoWithWeightClass() returns the correct string for S weightclass', (t) => {
    const model = new AircraftTypeDefinitionModel(AIRCRAFT_DEFINITION_MOCK);
    model.weightclass = 'U';
    const result = model._buildIcaoWithWeightClass();

    t.true(result === 'U/B737');
});

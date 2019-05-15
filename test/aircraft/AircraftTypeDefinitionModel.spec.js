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

ava('._buildTypeForStripView() returns the icao when not a heavy/super weightClass', (t) => {
    const model = new AircraftTypeDefinitionModel(AIRCRAFT_DEFINITION_MOCK);
    const result = model._buildTypeForStripView();

    t.true(result === 'B737/L');
});

ava('._buildTypeForStripView() returns the correct string for H weightClass', (t) => {
    const model = new AircraftTypeDefinitionModel(AIRCRAFT_DEFINITION_MOCK);
    model.weightClass = 'H';
    const result = model._buildTypeForStripView();

    t.true(result === 'H/B737/L');
});

ava('._buildTypeForStripView() returns the correct string for J weightClass', (t) => {
    const model = new AircraftTypeDefinitionModel(AIRCRAFT_DEFINITION_MOCK);
    model.weightClass = 'J';
    const result = model._buildTypeForStripView();

    t.true(result === 'J/B737/L');
});

ava('.isHeavyOrSuper() returns true when `#weightClass` is `H`', (t) => {
    const model = new AircraftTypeDefinitionModel(AIRCRAFT_DEFINITION_MOCK);
    model.weightClass = 'H';

    t.true(model.isHeavyOrSuper());
});

ava('.isHeavyOrSuper() returns true when `#weightClass` is `J`', (t) => {
    const model = new AircraftTypeDefinitionModel(AIRCRAFT_DEFINITION_MOCK);
    model.weightClass = 'J';

    t.true(model.isHeavyOrSuper());
});

ava('.isHeavyOrSuper() returns false when `#weightClass` is not `H` or `J`', (t) => {
    const model = new AircraftTypeDefinitionModel(AIRCRAFT_DEFINITION_MOCK);
    model.weightClass = 'L';

    t.false(model.isHeavyOrSuper());
});

ava('.calculateSameRunwaySeparationDistanceInFeet() returns the correct distance as long as the previous aircraft is not a srs category 3', (t) => {
    const model = new AircraftTypeDefinitionModel(AIRCRAFT_DEFINITION_MOCK);
    const previousModel = new AircraftTypeDefinitionModel(AIRCRAFT_DEFINITION_MOCK);
    previousModel.category.srs = 1;
    model.category.srs = 1;

    let distance = model.calculateSameRunwaySeparationDistanceInFeet(previousModel);

    t.true(distance === 3000);

    model.category.srs = 2;
    distance = model.calculateSameRunwaySeparationDistanceInFeet(previousModel);

    t.true(distance === 4500);

    model.category.srs = 3;
    distance = model.calculateSameRunwaySeparationDistanceInFeet(previousModel);

    t.true(distance === 6000);
});

ava('.calculateSameRunwaySeparationDistanceInFeet() returns 6000ft when the previous aircraft has no srs category or is srs category 3', (t) => {
    const model = new AircraftTypeDefinitionModel(AIRCRAFT_DEFINITION_MOCK);
    const previousModel = new AircraftTypeDefinitionModel(AIRCRAFT_DEFINITION_MOCK);
    model.category.srs = undefined;
    previousModel.category.srs = undefined;

    let distance = model.calculateSameRunwaySeparationDistanceInFeet(previousModel);

    t.true(distance === 6000);

    previousModel.category.srs = 3;
    distance = model.calculateSameRunwaySeparationDistanceInFeet(previousModel);

    t.true(distance === 6000);
});

ava('.getRadioWeightClass() returns heavy for heavy aircrafts', (t) => {
    const model = new AircraftTypeDefinitionModel(AIRCRAFT_DEFINITION_MOCK);
    model.weightClass = 'H';

    t.true(model.getRadioWeightClass() === 'heavy');
});

ava('.getRadioWeightClass() returns super for super aircrafts', (t) => {
    const model = new AircraftTypeDefinitionModel(AIRCRAFT_DEFINITION_MOCK);
    model.weightClass = 'J';

    t.true(model.getRadioWeightClass() === 'super');
});

ava('.getRadioWeightClass() returns empty string if aircraft is neither super nor heavy', (t) => {
    const model = new AircraftTypeDefinitionModel(AIRCRAFT_DEFINITION_MOCK);
    model.weightClass = 'L';

    t.true(model.getRadioWeightClass() === '');
});

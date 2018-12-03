import ava from 'ava';
import AircraftCollection from '../../src/assets/scripts/client/aircraft/AircraftCollection';
import { ARRIVAL_AIRCRAFT_MODEL_MOCK, DEPARTURE_AIRCRAFT_MODEL_MOCK } from './_mocks/aircraftMocks';

ava('does not throw with valid parameters', (t) => {
    t.notThrows(() => new AircraftCollection());
});

ava('.add() throws when passed invalid params', (t) => {
    const collection = new AircraftCollection();

    t.throws(() => collection.add(null));
});

ava('.add() increases the `#_items` length by 1', (t) => {
    const collection = new AircraftCollection();

    collection.add(ARRIVAL_AIRCRAFT_MODEL_MOCK);

    t.true(collection.length === 1);
});

ava('.remove() throws when the itemToRemove does not exist in `#_items`', (t) => {
    const collection = new AircraftCollection();

    collection.add(DEPARTURE_AIRCRAFT_MODEL_MOCK);

    t.throws(() => collection.remove(123456789));
});

ava('.remove() decreases the `#_items` length by 1', (t) => {
    const collection = new AircraftCollection();

    collection.add(DEPARTURE_AIRCRAFT_MODEL_MOCK);

    t.true(collection.length === 1);

    collection.remove(DEPARTURE_AIRCRAFT_MODEL_MOCK);

    t.true(collection.length === 0);
});

ava('.findAircraftByCallsign() returns null when no callsign is passed', (t) => {
    const collection = new AircraftCollection();
    const result = collection.findAircraftByCallsign();

    t.true(result === null);
});

ava('.findAircraftByCallsign() returns null when an aircraftModel with the passed callsign cannot be found', (t) => {
    const collection = new AircraftCollection();
    const result = collection.findAircraftByCallsign(ARRIVAL_AIRCRAFT_MODEL_MOCK.callsign);

    t.true(result === null);
});

ava('.findAircraftByCallsign() returns an `AircraftModel` with the passed callsign', (t) => {
    const collection = new AircraftCollection();
    const callsignMock = ARRIVAL_AIRCRAFT_MODEL_MOCK.callsign;

    collection.add(ARRIVAL_AIRCRAFT_MODEL_MOCK);

    const result = collection.findAircraftByCallsign(callsignMock);

    t.true(ARRIVAL_AIRCRAFT_MODEL_MOCK.id === result.id);
});

ava('.findAircraftByCallsign() returns an `AircraftModel` when the passed callsign is UPPERCASE', (t) => {
    const collection = new AircraftCollection();
    const callsignMock = 'aAl432';

    collection.add(ARRIVAL_AIRCRAFT_MODEL_MOCK);

    const result = collection.findAircraftByCallsign(callsignMock);

    t.true(ARRIVAL_AIRCRAFT_MODEL_MOCK.id === result.id);
});

ava.todo('.findAircraftNearPosition() ');

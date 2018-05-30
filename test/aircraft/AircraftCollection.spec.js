import ava from 'ava';
import AircraftCollection from '../../src/assets/scripts/client/aircraft/AircraftCollection';
import { arrivalAircraftFixture, departureAircraftFixture } from './_mocks/aircraftMocks';

ava('does not throw with valid parameters', (t) => {
    t.notThrows(() => new AircraftCollection());
});

ava('.add() throws when passed invalid params', (t) => {
    const collection = new AircraftCollection();

    t.throws(() => collection.add(null));
});

ava('.add() increases the `#_items` length by 1', (t) => {
    const collection = new AircraftCollection();

    collection.add(arrivalAircraftFixture);

    t.true(collection.length === 1);
});

ava('.remove() throws when the itemToRemove does not exist in `#_items`', (t) => {
    const collection = new AircraftCollection();

    collection.add(departureAircraftFixture);

    t.throws(() => collection.remove(123456789));
});

ava('.remove() decreases the `#_items` length by 1', (t) => {
    const collection = new AircraftCollection();

    collection.add(departureAircraftFixture);

    t.true(collection.length === 1);

    collection.remove(departureAircraftFixture);

    t.true(collection.length === 0);
});

ava.todo('.findAircraftByCallsign() ');
ava.todo('.findAircraftNearPosition() ');

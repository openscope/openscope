import ava from 'ava';

import RunwayRelationshipModel from '../../../src/assets/scripts/client/airport/runway/RunwayRelationshipModel';
import {
    runwayModel07lFixture,
    runwayModel07rFixture
} from '../../fixtures/runwayFixtures';

ava('throws when passed invalid parameters', (t) => {
    t.throws(() => new RunwayRelationshipModel());
    t.throws(() => new RunwayRelationshipModel(runwayModel07lFixture, null));
    t.throws(() => new RunwayRelationshipModel(null, runwayModel07rFixture));
});

ava('does not throws when passed valid parameters', (t) => {
    t.notThrows(() => new RunwayRelationshipModel(runwayModel07lFixture, runwayModel07rFixture));
});

ava('.calculateSeparationMinimums() returns 5.556 when #lateral_dist is <= 2500', (t) => {
    const model = new RunwayRelationshipModel(runwayModel07lFixture, runwayModel07rFixture);
    const result = model.calculateSeparationMinimums();

    t.true(result === 5.556);
});

ava('.calculateSeparationMinimums() returns 1.852 when #lateral_dist is between 2500 and 3600', (t) => {
    const model = new RunwayRelationshipModel(runwayModel07lFixture, runwayModel07rFixture);
    model.lateral_dist = 1;
    const result = model.calculateSeparationMinimums();

    t.true(result === 1.852);
});

ava('.calculateSeparationMinimums() returns 2.778 when #lateral_dist is between 3601 and 4300', (t) => {
    const model = new RunwayRelationshipModel(runwayModel07lFixture, runwayModel07rFixture);
    model.lateral_dist = 1.1;
    const result = model.calculateSeparationMinimums();

    t.true(result === 2.778);
});

ava('.calculateSeparationMinimums() returns 3.704 when #lateral_dist is between 4301 and 9000', (t) => {
    const model = new RunwayRelationshipModel(runwayModel07lFixture, runwayModel07rFixture);
    model.lateral_dist = 2;
    const result = model.calculateSeparationMinimums();

    t.true(result === 3.704);
});

ava('.calculateSeparationMinimums() returns 5.556 when #lateral_dist is grerater than 9001', (t) => {
    const model = new RunwayRelationshipModel(runwayModel07lFixture, runwayModel07rFixture);
    model.lateral_dist = 5;
    const result = model.calculateSeparationMinimums();

    t.true(result === 5.556);
});

import ava from 'ava';

import EventModel from '../../src/assets/scripts/client/lib/EventModel';

ava('does not thow when called to instantiate', (t) => {
    t.notThrows(() => new EventModel());
});

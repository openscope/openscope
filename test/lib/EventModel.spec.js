import ava from 'ava';

import EventModel from '../../src/assets/scripts/client/lib/EventModel';

const eventNameMock = 'click';
const observerMock = function doSomething() {
    return true;
};
const anonymousObserverMock = function() {
    return true;
};

ava('does not thow when called to instantiate', (t) => {
    t.notThrows(() => new EventModel());
});

ava('.addObserver() returns early when an observer exists in #observers', (t) => {
    const model = new EventModel(eventNameMock);
    model.observers.push(observerMock);

    model.addObserver(observerMock);

    t.true(model.observers.length === 1);
});

ava('.addObserver() adds an observer to #observers', (t) => {
    const model = new EventModel(eventNameMock);

    model.addObserver(observerMock);

    t.true(model.observers.length === 1);
});

ava('.removeObserver() returns early when an observer does not exist in #observers', (t) => {
    const model = new EventModel(eventNameMock);
    model.observers.push(anonymousObserverMock);

    model.removeObserver(observerMock);

    t.true(model.observers.length === 1);
});

ava('.removeObserver() removes an observer from #observers', (t) => {
    const model = new EventModel(eventNameMock);
    model.observers.push(observerMock);
    model.observers.push(anonymousObserverMock);

    model.removeObserver(observerMock);

    t.true(model.observers.length === 1);
});

import ava from 'ava';

import EventBus from '../../src/assets/scripts/client/lib/EventBus';

const eventNameMock = 'click';
const callbackMock = function doSomething(v) {
    return v + 1;
};
const anonymousCallbackMock = function(v) {
    return v + 1;
};

ava.afterEach(() => {
    EventBus.destroy();
});

ava.serial('throws when attempting to instantiate', (t) => {
    t.throws(() => new EventBus());
});

ava.serial('.on() adds an eventName with a callback to #_events', (t) => {
    EventBus.on(eventNameMock, callbackMock);

    t.true(typeof EventBus._events[eventNameMock] !== 'undefined');
});

ava.serial('.on() adds an additional callback to #_events when an eventName already exists', (t) => {
    EventBus.on(eventNameMock, callbackMock);
    EventBus.on(eventNameMock, anonymousCallbackMock);

    t.true(EventBus._events[eventNameMock].observers.length === 2);
});

ava.serial('.off() returns early when passed an eventName that doesnt exist in the list', (t) => {
    EventBus.on(eventNameMock, callbackMock);
    EventBus.on(eventNameMock, anonymousCallbackMock);

    EventBus.off('threeve', callbackMock);

    t.true(EventBus._events.click.observers.length === 2);
});

ava.serial('.off() removes an observer from an eventName', (t) => {
    EventBus.on(eventNameMock, callbackMock);
    EventBus.on(eventNameMock, anonymousCallbackMock);

    EventBus.off(eventNameMock, callbackMock);

    t.true(EventBus._events.click.observers.length === 1);
});

ava.serial('.off() removes the event from #_events when no other observers exist', (t) => {
    EventBus.on(eventNameMock, callbackMock);

    EventBus.off(eventNameMock, callbackMock);

    t.true(typeof EventBus._events.click === 'undefined');
});

ava.serial('.trigger() does not throw when an event does not exist', (t) => {
    t.notThrows(() => EventBus.trigger(eventNameMock, 11, 3));
});


ava.serial('.trigger() calls each observer with #args', (t) => {
    let val = 0;
    const triggerFnMock = (plus, minus = 0) => {
        val += plus;
        val -= minus;
    };
    EventBus.on(eventNameMock, triggerFnMock);

    EventBus.trigger(eventNameMock, 11, 3);

    t.true(val === 8);
});

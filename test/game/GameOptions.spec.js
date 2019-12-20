import ava from 'ava';
import sinon from 'sinon';
import _isNil from 'lodash/isNil';
import GameOptions from '../../src/assets/scripts/client/game/GameOptions';
import EventBus from '../../src/assets/scripts/client/lib/EventBus';
import { GAME_OPTION_LIST_MOCK } from './_mocks/gameOptionMocks';

ava('does not throw on instantiation', (t) => {
    t.notThrows(() => new GameOptions());
});

ava('sets #_options on instantiation', (t) => {
    const expectedResult = [
        'theme',
        'controlMethod',
        'drawIlsDistanceSeparator',
        'ptlLengths',
        'drawProjectedPaths',
        'softCeiling',
        'mouseClickDrag',
        'rangeRings',
        'measureToolPath'
    ];

    const model = new GameOptions();
    const result = Object.keys(model._options);

    t.deepEqual(result, expectedResult);
});

ava('.addGameOptions() calls .addOption() for each available option', (t) => {
    const model = new GameOptions();
    const expectedResult = Object.keys(model._options).length;
    const addOptionSpy = sinon.spy(model, 'addOption');

    model.addGameOptions();

    t.true(addOptionSpy.callCount === expectedResult);
});

ava('.addOption() calls .buildStorageName()', (t) => {
    const storageNameMock = 'threeve';
    const model = new GameOptions();
    const buildStorageNameSpy = sinon.spy(model, 'buildStorageName');

    model.buildStorageName(storageNameMock);

    t.true(buildStorageNameSpy.calledWithExactly(storageNameMock));
});

ava('.addOption() adds option to #_options and creates new property from option.name', (t) => {
    const optionKeyMock = 'threeve';
    const optionValueMock = '$texas';
    const model = new GameOptions();
    model._options = {};
    model.addOption(GAME_OPTION_LIST_MOCK[0]);

    t.false(_isNil(model._options[optionKeyMock]));
    t.false(_isNil(model[optionKeyMock]));
    t.true(model[optionKeyMock] === optionValueMock);
});

ava('.addOption() populates this[OPTION_KEY] with stored value when one exists in localStorage', (t) => {
    const expectedResult = 'ruff';
    const optionKeyMock = 'threeve';
    const optionStorageKeyMock = 'zlsa.atc.option.threeve';
    const model = new GameOptions();

    model._options = {};
    global.localStorage.setItem(optionStorageKeyMock, 'ruff');

    model.addOption(GAME_OPTION_LIST_MOCK[0]);

    t.true(model[optionKeyMock] === expectedResult);
});

ava('.setOptionByName() creates a localStorage item with the correct value', (t) => {
    const expectedResult = 'bow wow';
    const optionNameMock = 'threeve';
    const storageKeyMock = 'zlsa.atc.option.threeve';
    const model = new GameOptions();

    model.addOption(GAME_OPTION_LIST_MOCK[0]);
    model.setOptionByName(optionNameMock, expectedResult);

    t.false(typeof global.localStorage.getItem(storageKeyMock) === 'undefined');
    t.true(global.localStorage.getItem(storageKeyMock) === expectedResult);
});

ava('.setOptionByName() calls EventBus.trigger() when #onChangeEventHandler() is not null', (t) => {
    EventBus.trigger = sinon.stub();
    const optionValueMock = 'bow wow';
    const optionNameMock = 'threeve';
    const model = new GameOptions();

    model.addOption(GAME_OPTION_LIST_MOCK[0]);
    model.setOptionByName(optionNameMock, optionValueMock);

    t.true(EventBus.trigger.callCount === 1);
    t.true(EventBus.trigger.calledWithExactly(
        GAME_OPTION_LIST_MOCK[0].onChangeEventHandler,
        optionValueMock
    ));

    EventBus.trigger = sinon.restore();
});

ava('.setOptionByName() does not call EventBus.trigger() when #onChangeEventHandler() is null', (t) => {
    EventBus.trigger = sinon.stub();
    const optionValueMock = 'bow wow';
    const optionNameMock = 'number';
    const model = new GameOptions();

    model.addOption(GAME_OPTION_LIST_MOCK[1]);
    model.setOptionByName(optionNameMock, optionValueMock);

    t.true(EventBus.trigger.callCount === 0);

    EventBus.trigger = sinon.restore();
});

ava('.buildStorageName() returns a string used for localStorage', (t) => {
    const expectedResult = 'zlsa.atc.option.threeve';
    const model = new GameOptions();
    const result = model.buildStorageName('threeve');

    t.true(result === expectedResult);
});

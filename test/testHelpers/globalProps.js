import $ from 'jquery';
import sinon from 'sinon';
import _noop from 'lodash/noop';

global.window = {
    gameController: {
        game_timeout: sinon.stub()
    }
};

global.done = _noop;
global.fail = _noop;
global.zlsa = {
    atc: {
        loadAsset: (...args) => ({
            done: (failArgs) => ({
                fail: _noop
            })
        })
    }
};

global.prop = {};

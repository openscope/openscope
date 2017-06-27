import sinon from 'sinon';
import _noop from 'lodash/noop';

global.window = {
    // gameController: {
    //     game_timeout: sinon.stub(),
    //     game_reset_score_and_events: sinon.stub(),
    //     game_time: sinon.stub()
    // }
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

global.prop = {
    canvas: {
        draw_labels: true,
        dirty: true
    }
};

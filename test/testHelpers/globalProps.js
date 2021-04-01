import _noop from 'lodash/noop';

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

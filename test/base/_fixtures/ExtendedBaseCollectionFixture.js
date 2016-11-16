import BaseCollection from '../../../src/assets/scripts/base/BaseCollection';

export default class ExtendedBaseCollectionMock extends BaseCollection {
    constructor() {
        super();

        this.name = 'some name';
    }

    _init() {
        return this;
    }

    destroy() {
        return this;
    }

    _addItems() {
        return this;
    }

    _addItem() {
        return this;
    }
}

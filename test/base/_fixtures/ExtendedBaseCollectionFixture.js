import BaseCollection from '../../../src/assets/scripts/client/base/BaseCollection';

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
}

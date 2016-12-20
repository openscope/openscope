import BaseModel from '../../../src/assets/scripts/client/base/BaseModel';

export default class ExtendedBaseModelMock extends BaseModel {
    constructor() {
        super();

        this.name = 'some name';
    }

    _init() {
        return this;
    }

    reset() {
        return this;
    }
}

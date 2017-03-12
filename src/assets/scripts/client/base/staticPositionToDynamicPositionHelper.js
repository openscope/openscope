import DynamicPositionModel from './DynamicPositionModel';

/**
 * Accepts a `StaticPositionModel` and returns a `DynamicPositionModel` with the same location
 *
 * @function convertStaticPositionToDynamic
 * @param StaticPositionModel {StaticPositionModel}
 * @return {DynamicPositionModel}
 */
export const convertStaticPositionToDynamic = (StaticPositionModel) => {
    const dynamicPositionModel = new DynamicPositionModel(StaticPositionModel.gps,
        StaticPositionModel.referencePostion, StaticPositionModel.magnetic_north
    );

    return dynamicPositionModel;
};

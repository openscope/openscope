import DynamicPositionModel from './DynamicPositionModel';

/**
 * Accepts a `StaticPositionModel` and returns a `DynamicPositionModel` with the same location
 *
 * @function convertStaticPositionToDynamic
 * @param staticPositionModel {StaticPositionModel}
 * @return {DynamicPositionModel}
 */
export const convertStaticPositionToDynamic = (staticPositionModel) => {
    return new DynamicPositionModel(
        staticPositionModel.gps,
        staticPositionModel.referencePosition,
        staticPositionModel.magneticNorth
    );
};

import StaticPositionModel from './StaticPositionModel';

/**
 * Accepts a `DynamicPositionModel` and returns a `StaticPositionModel` with the same location
 *
 * @function convertDynamicPositionToStatic
 * @param dynamicPositionModel {DynamicPositionModel}
 * @return {StaticPositionModel}
 */
export const convertDynamicPositionToStatic = (dynamicPositionModel) => {
    const staticPositionModel = new StaticPositionModel(dynamicPositionModel.gps,
        dynamicPositionModel.referencePosition, dynamicPositionModel.magneticNorth);

    return staticPositionModel;
};

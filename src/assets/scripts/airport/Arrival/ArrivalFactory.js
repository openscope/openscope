/* eslint-disable camelcase, no-underscore-dangle, no-mixed-operators, func-names, object-shorthand */
import ArrivalBase from './ArrivalBase';
import ArrivalCyclic from './ArrivalCyclic';
import ArrivalWave from './ArrivalWave';
import ArrivalSurge from './ArrivalSurge';
import { LOG } from '../../constants/logLevel';

/**
 * Calls constructor of the appropriate arrival type
 *
 * @function ArrivalFactory
 * @param airport {AirportModel}
 * @param options {obejct}
 * @return {constructor}
 */
export const arrivalFactory = (airport, options) => {
    if (options.type === '') {
        log(`${airport.icao} arrival stream not given type!`, LOG.WARNING);
        return null;
    }

    switch (options.type) {
        case 'random':
            return new ArrivalBase(airport, options);
        case 'cyclic':
            return new ArrivalCyclic(airport, options);
        case 'wave':
            return new ArrivalWave(airport, options);
        case 'surge':
            return new ArrivalSurge(airport, options);
        default:
            log(`${airport.icao} using unsupported arrival type "${options.type}"`, LOG.WARNING);
            return null;
    }
};

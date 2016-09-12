/* eslint-disable func-names, no-undef */
import DepartureBase from './DepartureBase';
import DepartureCyclic from './DepartureCyclic';
import DepartureWave from './DepartureWave';
import { LOG } from '../../constants/logLevel';

/**
 * Calls constructor of the appropriate arrival type
 *
 * @function DepartureFactory
 * @param airport
 * @param options
 * @return {function}
 */
export const DepartureFactory = function(airport, options) {
    if (options.type === '') {
        return log(`${airport.icao} departure stream not given type!`, LOG.WARNING);
    }

    switch (options.type) {
        case 'random':
            return new DepartureBase(airport, options);
        case 'cyclic':
            return new DepartureCyclic(airport, options);
        case 'wave':
            return new DepartureWave(airport, options);
        default:
            log(`${airport.icao} using unsupported departure type "${options.type}"`, LOG.WARNING);
            return null;
    }
};

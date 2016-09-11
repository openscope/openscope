import DepartureBase from './DepartureBase';
import DepartureCyclic from './DepartureCyclic';
import DepartureWave from './DepartureWave';

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
        return log(airport.icao + " departure stream not given type!", LOG_WARNING);
    }

    switch (options.type) {
        case 'random':
            return new DepartureBase(airport, options);
            break;
        case 'cyclic':
            return new DepartureCyclic(airport, options);
            break;
        case 'wave':
            return new DepartureWave(airport, options);
            break;
        default:
            log(airport.icao + ' using unsupported departure type "'+options.type+'"', LOG_WARNING);
            break;
    }
};

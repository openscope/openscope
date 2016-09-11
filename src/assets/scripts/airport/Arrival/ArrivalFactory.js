import ArrivalBase from './ArrivalBase';
import ArrivalCyclic from './ArrivalCyclic';
import ArrivalWave from './ArrivalWave';
import ArrivalSurge from './ArrivalSurge';


/**
 * Calls constructor of the appropriate arrival type
 *
 * @function ArrivalFactory
 * @param airport
 * @param options
 * @return {function}
 */
export const ArrivalFactory = function(airport, options) {
    if (options.type === '') {
        log(airport.icao + ' arrival stream not given type!', LOG_WARNING);
        return;
    }

    switch (options.type) {
        case 'random':
                return new ArrivalBase(airport, options);
                break;
        case 'cyclic':
            return new ArrivalCyclic(airport, options);
            break;
        case 'wave':
            return new ArrivalWave(airport, options);
            break;
        case 'surge':
            return new ArrivalSurge(airport, options);
            break;
        default:
            log(airport.icao + ' using unsupported arrival type "'+options.type+'"', LOG_WARNING);
            break;
    }
};

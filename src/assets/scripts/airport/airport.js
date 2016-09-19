import _has from 'lodash/has';
import Airport from './AirportInstanceModel';
import { STORAGE_KEY } from '../constants/storageKeys';

/**
 * @function airport_set
 * @param icao {string}
 */
const airport_set = (icao) => {
    if (!icao) {
        if (_has(localStorage, STORAGE_KEY.ATC_LAST_AIRPORT)) {
            icao = localStorage[STORAGE_KEY.ATC_LAST_AIRPORT];
        }
    }

    icao = icao.toLowerCase();

    if (!icao in prop.airport.airports) {
        console.log(`${icao}: no such airport`);

        return;
    }

    if (prop.airport.current) {
        prop.airport.current.unset();
        aircraft_remove_all();
    }

    const newAirport = prop.airport.airports[icao];
    newAirport.set();
};

/**
 * @function airport_ready
 */
const airport_ready = () => {
    let airportName = 'ksfo';

    if (!_has(localStorage, STORAGE_KEY.ATC_LAST_AIRPORT) ||
        !_has(prop.airport.airports, STORAGE_KEY.ATC_LAST_AIRPORT)
    ) {
        airportName = 'ksfo';
    }

    airport_set(airportName);
};

/**
 * @function airport_load
 * @param icao {string}
 * @param level {string}
 * @param name {string}
 * @return airport {AirtportInstance}
 */
const airport_load = (icao, level, name) => {
    icao = icao.toLowerCase();

    if (icao in prop.airport.airports) {
        console.log(`${icao}: already loaded`);
        return null;
    }

    const airport = new Airport({
        icao,
        level,
        name
    });

    airport_add(airport);

    return airport;
};

/**
 * @function airport_add
 * @param airport
 */
const airport_add = (airport) => {
    prop.airport.airports[airport.icao.toLowerCase()] = airport;
};

/**
 * @function airport_get
 * @param icao {string}
 */
const airport_get = (icao) => {
    if (!icao) {
        return prop.airport.current;
    }

    return prop.airport.airports[icao.toLowerCase()];
};

/**
 * @function airport_init_pre
 */
const airport_init_pre = () => {
    prop.airport = {};
    prop.airport.airports = {};
    prop.airport.current = null;
};

/**
 * @function airport_init
 */
const airport_init = () => {
    airport_load('ebbr', 'easy', 'Brussels-National &#9983');
    airport_load('eddf', 'medium', 'Frankfurt Airport');
    airport_load('eddh', 'easy', 'Hamburg Airport');
    airport_load('eddm', 'beginner', 'Franz Josef Strauß International Airport');
    airport_load('eddt', 'medium', 'Berlin Tegel Airport');
    airport_load('egcc', 'hard', 'Manchester Airport');
    airport_load('eggw', 'medium', 'London Luton Airport');
    airport_load('egkk', 'easy', 'London Gatwick Airport');
    airport_load('eglc', 'medium', 'London City Airport');
    airport_load('egll', 'hard', 'London Heathrow Airport');
    airport_load('egnm', 'beginner', 'Leeds Bradford International Airport');
    airport_load('eham', 'medium', 'Amsterdam Airport Schiphol');
    airport_load('eidw', 'easy', 'Dublin Airport');
    airport_load('einn', 'easy', 'Shannon Airport');
    airport_load('ekch', 'medium', 'Copenhagen Kastrup Airport');
    airport_load('engm', 'easy', 'Oslo Gardermoen International Airport');
    airport_load('espa', 'easy', 'Luleå Airport');
    airport_load('gcrr', 'easy', 'Lanzarote Airport');
    airport_load('kbos', 'medium', 'Boston Logan International Airport');
    airport_load('kdca', 'medium', 'Reagan National Airport');
    airport_load('kiad', 'hard', 'Washington-Dulles International Airport');
    airport_load('kjfk', 'hard', 'John F Kennedy International Airport &#9983');
    airport_load('klas', 'medium', 'McCarran International Airport');
    airport_load('klax90', 'medium', 'Los Angeles International Airport 1990');
    airport_load('klax', 'medium', 'Los Angeles International Airport');
    airport_load('kmia', 'hard', 'Miami International Airport &#9983');
    airport_load('kmsp', 'hard', 'Minneapolis/St. Paul International Airport &#9983');
    airport_load('kord', 'hard', 'Chicago O\'Hare International Airport');
    airport_load('kpdx', 'easy', 'Portland International Airport');
    airport_load('kphx', 'easy', 'Phoenix Sky Harbor International Airport');
    airport_load('ksan', 'easy', 'San Diego International Airport');
    airport_load('ksea', 'medium', 'Seattle-Tacoma International Airport &#9983');
    airport_load('ksfo', 'medium', 'San Francisco International Airport &#9983');
    airport_load('lkpr', 'easy', 'Vaclav Havel International Airport');
    airport_load('loww', 'medium', 'Vienna International Airport');
    airport_load('ltba', 'hard', 'Atatürk International Airport &#9983');
    airport_load('omaa', 'medium', 'Abu Dhabi International Airport');
    airport_load('omdb', 'hard', 'Dubai International Airport');
    airport_load('osdi', 'easy', 'Damascus International Airport');
    airport_load('othh', 'hard', 'Doha Hamad International Airport');
    airport_load('rjtt', 'hard', 'Tokyo Haneda International Airport');
    airport_load('rksi', 'hard', 'Incheon International Airport');
    airport_load('saez', 'medium', 'Aeropuerto Internacional Ministro Pistarini');
    airport_load('same', 'medium', 'Aeropuerto Internacional El Plumerillo');
    airport_load('sawh', 'beginner', 'Aeropuerto Internacional Malvinas Argentinas');
    airport_load('sbgl', 'beginner', 'Aeroporto Internacional Tom Jobim');
    airport_load('sbgr', 'beginner', 'Aeroporto Internacional de São Paulo/Guarulhos');
    airport_load('tjsj', 'easy', 'Luis Muñoz Marín International Airport');
    airport_load('tncm', 'easy', 'Princess Juliana International Airport');
    airport_load('uudd', 'easy', 'Moscow Domodedovo Airport');
    airport_load('vabb', 'hard', 'Chhatrapati Shivaji International Airport');
    airport_load('vecc', 'medium', 'Kolkata Netaji Subhas Chandra Bose Int\'l');
    airport_load('vhhh', 'medium', 'Hong Kong Chep Lap Kok International Airport');
    airport_load('vidp', 'hard', 'Indira Gandhi International Airport');
    airport_load('wiii', 'medium', 'Soekarno-Hatta International Airport');
    airport_load('wimm', 'easy', 'Kuala Namu International Airport');
    airport_load('wmkp', 'medium', 'Pulau Pinang International Airport');
    airport_load('wmkk', 'hard', 'Kuala Lumpur International Airport (KLIA)');
    airport_load('wsss', 'hard', 'Singapore Changi International Airport');
    airport_load('zspd', 'hard', 'Shanghai Pudong International Airport');
};

// TODO: temporary add to window.
window.airport_init_pre = airport_init_pre;
window.airport_init = airport_init;
window.airport_ready = airport_ready;
window.airport_load = airport_load;
window.airport_add = airport_add;
window.airport_set = airport_set;
window.airport_get = airport_get;

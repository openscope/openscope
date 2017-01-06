/**
 * This file lives outside of normal javascript bundle. This provides a way for contributors to add or remove
 * airports without the need to re-build the entire app. This means a contributor does not need to have node
 * installed in order to contribute.
 *
 * While not ideal, adding more things to the window, this does get around the need to re-bundle when making changes
 * to the list of airports.
 *
 * This property is used by the `AirportController` and should be used only one time on app instantiation.
 *
 * @property AIRPORT_LOAD_LIST
 * @return {array<object>}
 */
window.AIRPORT_LOAD_LIST = (function() { // eslint-disable-line wrap-iife
    /**
     * List of airports to load.
     *
     * If you are adding a new airport to the game, be sure to include:
     *
     * - the airport json file in `assets/airports/AIRPORT_NAME.json` where `AIRPORT_NAME` is
     *   the airport icao. (ex: KSFO would be `assets/airports/ksfo.json`)
     * - the terrain geojson file (if one exists) in `assets/airports/terrain/AIRPORT_NAME.geojson`
     *   where `AIRPORT_NAME` is the airport icao. (ex: KSFO would be `assets/airports/terrain/ksfo.geojson`)
     * - add a new data block at the bottom of this file in the shape of:
     * ```
     * {
     *   icao: {AIRPORT_ICAO},
     *   level: {AIRPORT_DIFFICULTY},
     *   name: {AIRPORT_NAME}
     * }
     * ```
     * - `AIRPORT_ICAO` is the airport icao in lowercase (ex: ksfo)
     * - `AIRPORT_DIFFICULTY` is the difficulty level (one of: easy, beginner, medium, hard)
     * - `AIRPORT_NAME` is the name of the airport (ex: San Francisco International Airport)
     *   If the airport is a work in progress, please include the icon character `&#9983` after the `name`
     *   (see ebbr, kmsp or ksea):
     *   `name: 'Brussels-National &#9983'`
     *
     * @property AIRPORT_LOAD_LIST
     * @type {Array}
     * @final
     */
    return [
        {
            icao: 'ebbr',
            level: 'easy',
            name: 'Brussels-National',
            wip: true
        },
        {
            icao: 'eddf',
            level: 'medium',
            name: 'Frankfurt Airport',
            wip: false
        },
        {
            icao: 'eddh',
            level: 'easy',
            name: 'Hamburg Airport',
            wip: false
        },
        {
            icao: 'eddm',
            level: 'beginner',
            name: 'Franz Josef Strauß International Airport',
            wip: false
        },
        {
            icao: 'eddt',
            level: 'medium',
            name: 'Berlin Tegel Airport',
            wip: false
        },
        {
            icao: 'egcc',
            level: 'hard',
            name: 'Manchester Airport',
            wip: false
        },
        {
            icao: 'eggw',
            level: 'medium',
            name: 'London Luton Airport',
            wip: false
        },
        {
            icao: 'egkk',
            level: 'easy',
            name: 'London Gatwick Airport',
            wip: false
        },
        {
            icao: 'eglc',
            level: 'medium',
            name: 'London City Airport',
            wip: false
        },
        {
            icao: 'egll',
            level: 'hard',
            name: 'London Heathrow Airport',
            wip: false
        },
        {
            icao: 'egnm',
            level: 'beginner',
            name: 'Leeds Bradford International Airport',
            wip: false
        },
        {
            icao: 'eham',
            level: 'medium',
            name: 'Amsterdam Airport Schiphol',
            wip: false
        },
        {
            icao: 'eidw',
            level: 'easy',
            name: 'Dublin Airport',
            wip: false
        },
        {
            icao: 'einn',
            level: 'easy',
            name: 'Shannon Airport',
            wip: false
        },
        {
            icao: 'ekch',
            level: 'medium',
            name: 'Copenhagen Kastrup Airport',
            wip: false
        },
        {
            icao: 'engm',
            level: 'easy',
            name: 'Oslo Gardermoen International Airport',
            wip: false
        },
        {
            icao: 'espa',
            level: 'easy',
            name: 'Luleå Airport',
            wip: false
        },
        {
            icao: 'gcrr',
            level: 'easy',
            name: 'Lanzarote Airport',
            wip: false
        },
        {
            icao: 'kbos',
            level: 'medium',
            name: 'Boston Logan International Airport',
            wip: false
        },
        {
            icao: 'kdca',
            level: 'medium',
            name: 'Reagan National Airport',
            wip: false
        },
        {
            icao: 'kdfw',
            level: 'hard',
            name: 'Dallas-Fort Worth International Airport',
            wip: false
        },
        {
            icao: 'kiad',
            level: 'hard',
            name: 'Washington-Dulles International Airport',
            wip: false
        },
        {
            icao: 'kjfk',
            level: 'hard',
            name: 'John F Kennedy International Airport',
            wip: true
        },
        {
            icao: 'klas',
            level: 'medium',
            name: 'McCarran International Airport',
            wip: false
        },
        {
            icao: 'klax90',
            level: 'medium',
            name: 'Los Angeles International Airport 1990',
            wip: false
        },
        {
            icao: 'klax',
            level: 'medium',
            name: 'Los Angeles International Airport',
            wip: false
        },
        {
            icao: 'kmia',
            level: 'hard',
            name: 'Miami International Airport',
            wip: true
        },
        {
            icao: 'kmsp',
            level: 'hard',
            name: 'Minneapolis/St. Paul International Airport',
            wip: true
        },
        {
            icao: 'kord',
            level: 'hard',
            name: 'Chicago O\'Hare International Airport',
            wip: false
        },
        {
            icao: 'kpdx',
            level: 'easy',
            name: 'Portland International Airport',
            wip: false
        },
        {
            icao: 'kphx',
            level: 'easy',
            name: 'Phoenix Sky Harbor International Airport',
            wip: false
        },
        {
            icao: 'ksan',
            level: 'easy',
            name: 'San Diego International Airport',
            wip: false
        },
        {
            icao: 'ksea',
            level: 'medium',
            name: 'Seattle-Tacoma International Airport',
            wip: true
        },
        {
            icao: 'ksfo',
            level: 'medium',
            name: 'San Francisco International Airport',
            wip: true
        },
        {
            icao: 'lkpr',
            level: 'easy',
            name: 'Vaclav Havel International Airport',
            wip: false
        },
        {
            icao: 'loww',
            level: 'medium',
            name: 'Vienna International Airport',
            wip: false
        },
        {
            icao: 'ltba',
            level: 'hard',
            name: 'Atatürk International Airport',
            wip: true
        },
        {
            icao: 'omaa',
            level: 'medium',
            name: 'Abu Dhabi International Airport',
            wip: false
        },
        {
            icao: 'omdb',
            level: 'hard',
            name: 'Dubai International Airport',
            wip: false
        },
        {
            icao: 'osdi',
            level: 'easy',
            name: 'Damascus International Airport',
            wip: false
        },
        {
            icao: 'othh',
            level: 'hard',
            name: 'Doha Hamad International Airport',
            wip: false
        },
        {
            icao: 'rjtt',
            level: 'hard',
            name: 'Tokyo Haneda International Airport',
            wip: false
        },
        {
            icao: 'rksi',
            level: 'hard',
            name: 'Incheon International Airport',
            wip: false
        },
        {
            icao: 'saez',
            level: 'medium',
            name: 'Aeropuerto Internacional Ministro Pistarini',
            wip: false
        },
        {
            icao: 'same',
            level: 'medium',
            name: 'Aeropuerto Internacional El Plumerillo',
            wip: false
        },
        {
            icao: 'sawh',
            level: 'beginner',
            name: 'Aeropuerto Internacional Malvinas Argentinas',
            wip: false
        },
        {
            icao: 'sbgl',
            level: 'beginner',
            name: 'Aeroporto Internacional Tom Jobim',
            wip: false
        },
        {
            icao: 'sbgr',
            level: 'beginner',
            name: 'Aeroporto Internacional de São Paulo/Guarulhos',
            wip: false
        },
        {
            icao: 'tjsj',
            level: 'easy',
            name: 'Luis Muñoz Marín International Airport',
            wip: false
        },
        {
            icao: 'tncm',
            level: 'easy',
            name: 'Princess Juliana International Airport',
            wip: false
        },
        {
            icao: 'uudd',
            level: 'easy',
            name: 'Moscow Domodedovo Airport',
            wip: false
        },
        {
            icao: 'vabb',
            level: 'hard',
            name: 'Chhatrapati Shivaji International Airport',
            wip: false
        },
        {
            icao: 'vecc',
            level: 'medium',
            name: 'Kolkata Netaji Subhas Chandra Bose Int\'l',
            wip: false
        },
        {
            icao: 'vobl',
            level: 'medium',
            name: 'Kempegowda International Airport Bengaluru',
            wip: false
        },
        {
            icao: 'vhhh',
            level: 'medium',
            name: 'Hong Kong Chep Lap Kok International Airport',
            wip: false
        },
        {
            icao: 'vidp',
            level: 'hard',
            name: 'Indira Gandhi International Airport',
            wip: false
        },
        {
            icao: 'wiii',
            level: 'medium',
            name: 'Soekarno-Hatta International Airport',
            wip: false
        },
        {
            icao: 'wimm',
            level: 'easy',
            name: 'Kuala Namu International Airport',
            wip: false
        },
        {
            icao: 'wmkp',
            level: 'medium',
            name: 'Pulau Pinang International Airport',
            wip: false
        },
        {
            icao: 'wmkk',
            level: 'hard',
            name: 'Kuala Lumpur International Airport (KLIA)',
            wip: false
        },
        {
            icao: 'wsss',
            level: 'hard',
            name: 'Singapore Changi International Airport',
            wip: false
        },
        {
            icao: 'zspd',
            level: 'hard',
            name: 'Shanghai Pudong International Airport',
            wip: false
        }
    ];
})();

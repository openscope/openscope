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
            wip: true
        },
        {
            icao: 'eddh',
            level: 'easy',
            name: 'Hamburg Airport',
            wip: true
        },
        {
            icao: 'eddm',
            level: 'hard',
            name: 'Franz Josef Strauß International Airport',
            wip: true
        },
        {
            icao: 'eddt',
            level: 'medium',
            name: 'Berlin Tegel Airport',
            wip: true
        },
        // {
        //     icao: 'egcc',
        //     level: 'hard',
        //     name: 'Manchester Airport',
        //     wip: true
        // },
        // {
        //     icao: 'eggw',
        //     level: 'medium',
        //     name: 'London Luton Airport',
        //     wip: true
        // },
        {
            icao: 'egkk',
            level: 'easy',
            name: 'London Gatwick Airport',
            wip: true
        },
        {
            icao: 'eglc',
            level: 'medium',
            name: 'London City Airport',
            wip: true
        },
        {
            icao: 'egll',
            level: 'hard',
            name: 'London Heathrow Airport',
            wip: true
        },
        {
            icao: 'egnm',
            level: 'beginner',
            name: 'Leeds Bradford International Airport',
            wip: true
        },
        {
            icao: 'eham',
            level: 'medium',
            name: 'Amsterdam Airport Schiphol',
            wip: true
        },
        {
            icao: 'eidw',
            level: 'easy',
            name: 'Dublin Airport',
            wip: false
        },
        // {
        //     icao: 'einn',
        //     level: 'easy',
        //     name: 'Shannon Airport',
        //     wip: true
        // },
        {
            icao: 'ekch',
            level: 'medium',
            name: 'Copenhagen Kastrup Airport',
            wip: true
        },
        {
            icao: 'engm',
            level: 'easy',
            name: 'Oslo Gardermoen International Airport',
            wip: true
        },
        // {
        //     icao: 'espa',
        //     level: 'easy',
        //     name: 'Luleå Airport',
        //     wip: true
        // },
        {
            icao: 'gcrr',
            level: 'easy',
            name: 'Lanzarote Airport',
            wip: true
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
            wip: true
        },
        {
            icao: 'kdfw',
            level: 'hard',
            name: 'Dallas-Fort Worth International Airport',
            wip: true
        },
        {
            icao: 'kiad',
            level: 'hard',
            name: 'Washington-Dulles International Airport',
            wip: true
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
            wip: true
        },
        {
            icao: 'klax90',
            level: 'medium',
            name: 'Los Angeles International Airport 1990',
            wip: true
        },
        {
            icao: 'klax',
            level: 'medium',
            name: 'Los Angeles International Airport',
            wip: true
        },
        {
            icao: 'kmia',
            level: 'hard',
            name: 'Miami International Airport',
            wip: true
        },
        // {
        //     icao: 'kmsp',
        //     level: 'hard',
        //     name: 'Minneapolis/St. Paul International Airport',
        //     wip: true
        // },
        {
            icao: 'kord',
            level: 'hard',
            name: 'Chicago O\'Hare International Airport',
            wip: true
        },
        {
            icao: 'kpdx',
            level: 'easy',
            name: 'Portland International Airport',
            wip: true
        },
        {
            icao: 'kphx',
            level: 'easy',
            name: 'Phoenix Sky Harbor International Airport',
            wip: true
        },
        // {
        //     icao: 'ksan',
        //     level: 'easy',
        //     name: 'San Diego International Airport',
        //     wip: true
        // },
        {
            icao: 'ksea',
            level: 'medium',
            name: 'Seattle-Tacoma International Airport',
            wip: false
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
            wip: true
        },
        {
            icao: 'loww',
            level: 'medium',
            name: 'Vienna International Airport',
            wip: true
        },
        // {
        //     icao: 'ltba',
        //     level: 'hard',
        //     name: 'Atatürk International Airport',
        //     wip: true
        // },
        {
            icao: 'mdsd',
            level: 'easy',
            name: 'Aeropuerto Internacional Las Américas',
            wip: false
        },
        // {
        //     icao: 'omaa',
        //     level: 'medium',
        //     name: 'Abu Dhabi International Airport',
        //     wip: true
        // },
        {
            icao: 'omdb',
            level: 'hard',
            name: 'Dubai International Airport',
            wip: true
        },
        // {
        //     icao: 'osdi',
        //     level: 'easy',
        //     name: 'Damascus International Airport',
        //     wip: true
        // },
        // {
        //     icao: 'othh',
        //     level: 'hard',
        //     name: 'Doha Hamad International Airport',
        //     wip: true
        // },
        // {
        //     icao: 'rjbb',
        //     level: 'hard',
        //     name: 'Osaka Kansai International Airport',
        //     wip: true
        // },
        {
            icao: 'rjaa',
            level: 'hard',
            name: 'Tokyo Narita International Airport',
            wip: true
        },
        {
            icao: 'rjtt',
            level: 'hard',
            name: 'Tokyo Haneda International Airport',
            wip: true
        },
        // {
        //     icao: 'rksi',
        //     level: 'hard',
        //     name: 'Incheon International Airport',
        //     wip: true
        // },
        {
            icao: 'saez',
            level: 'medium',
            name: 'Aeropuerto Internacional Ministro Pistarini',
            wip: true
        },
        {
            icao: 'same',
            level: 'medium',
            name: 'Aeropuerto Internacional El Plumerillo',
            wip: true
        },
        {
            icao: 'sawh',
            level: 'beginner',
            name: 'Aeropuerto Internacional Malvinas Argentinas',
            wip: true
        },
        {
            icao: 'sbgl',
            level: 'beginner',
            name: 'Aeroporto Internacional Tom Jobim',
            wip: true
        },
        {
            icao: 'sbgr',
            level: 'beginner',
            name: 'Aeroporto Internacional São Paulo-Guarulhos',
            wip: true
        },
        {
            icao: 'tjsj',
            level: 'easy',
            name: 'Luis Muñoz Marín International Airport',
            wip: true
        },
        {
            icao: 'tncm',
            level: 'easy',
            name: 'Princess Juliana International Airport',
            wip: true
        },
        {
            icao: 'uudd',
            level: 'easy',
            name: 'Moscow Domodedovo Airport',
            wip: true
        },
        // {
        //     icao: 'vabb',
        //     level: 'hard',
        //     name: 'Chhatrapati Shivaji International Airport',
        //     wip: true
        // },
        {
            icao: 'vecc',
            level: 'medium',
            name: 'Kolkata Netaji Subhas Chandra Bose Int\'l',
            wip: true
        },
        // {
        //     icao: 'vobl',
        //     level: 'medium',
        //     name: 'Kempegowda International Airport Bengaluru',
        //     wip: true
        // },
        {
            icao: 'vhhh',
            level: 'medium',
            name: 'Hong Kong Chep Lap Kok International Airport',
            wip: true
        },
        {
            icao: 'vidp',
            level: 'hard',
            name: 'Indira Gandhi International Airport',
            wip: true
        },
        // {
        //     icao: 'wiii',
        //     level: 'medium',
        //     name: 'Soekarno-Hatta International Airport',
        //     wip: true
        // },
        {
            icao: 'wimm',
            level: 'easy',
            name: 'Kuala Namu International Airport',
            wip: true
        },
        {
            icao: 'wmkp',
            level: 'medium',
            name: 'Pulau Pinang International Airport',
            wip: true
        },
        {
            icao: 'wmkk',
            level: 'hard',
            name: 'Kuala Lumpur International Airport (KLIA)',
            wip: true
        },
        {
            icao: 'wsss',
            level: 'hard',
            name: 'Singapore Changi International Airport',
            wip: true
        },
        {
            icao: 'zspd',
            level: 'hard',
            name: 'Shanghai Pudong International Airport',
            wip: true
        }
    ];
})();

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
     *   name: {AIRPORT_NAME},
     *   premium: {MEETS_PREMIUM_STANDARDS},
     *   wip: {IS_WORK_IN_PROGRESS}
     * }
     * ```
     * - `AIRPORT_ICAO` is the airport icao in lowercase (ex: ksfo)
     * - `AIRPORT_DIFFICULTY` is the difficulty level (one of: easy, beginner, medium, hard)
     * - `AIRPORT_NAME` is the name of the airport (ex: San Francisco International Airport)
     * - `MEETS_PREMIUM_STANDARDS` is either `true` or `false`, see the airport standards document
     * - `IS_WORK_IN_PROGRESS` is either `true` or `false`, based on whether the airport is old
     *   and needs to be updated in order to reach full compliance with the airport standards
     *   specifications. Note that all new airports must meet these specifications before being
     *   merged, so you may feel free to start out with `wip: false`, since that will be true by
     *   the time the airport is added to the game.
     *
     * @property AIRPORT_LOAD_LIST
     * @type {Array}
     * @final
     */
    return [
        {
            icao: 'cyow',
            level: 'easy',
            name: 'Ottawa Macdonald-Cartier International Airport',
            premium: false,
            wip: false
        },
        // {
        //     icao: 'ebbr',
        //     level: 'easy',
        //     name: 'Brussels-National',
        //     premium: false,
        //     wip: true
        // },
        {
            icao: 'eddf',
            level: 'medium',
            name: 'Frankfurt Airport',
            premium: false,
            wip: true
        },
        {
            icao: 'eddh',
            level: 'beginner',
            name: 'Hamburg Airport',
            premium: false,
            wip: false
        },
        {
            icao: 'eddm',
            level: 'hard',
            name: 'Franz Josef Strauß International Airport',
            premium: false,
            wip: true
        },
        {
            icao: 'eddt',
            level: 'medium',
            name: 'Berlin Tegel Airport',
            premium: false,
            wip: true
        },
        // {
        //     icao: 'egcc',
        //     level: 'hard',
        //     name: 'Manchester Airport',
        //     premium: false,
        //     wip: true
        // },
        // {
        //     icao: 'eggw',
        //     level: 'medium',
        //     name: 'London Luton Airport',
        //     premium: false,
        //     wip: true
        // },
        {
            icao: 'egkk',
            level: 'easy',
            name: 'London Gatwick Airport',
            premium: false,
            wip: true
        },
        {
            icao: 'eglc',
            level: 'medium',
            name: 'London City Airport',
            premium: false,
            wip: true
        },
        {
            icao: 'egll',
            level: 'hard',
            name: 'London Heathrow Airport',
            premium: false,
            wip: true
        },
        // {
        //     icao: 'egnm',
        //     level: 'beginner',
        //     name: 'Leeds Bradford International Airport',
        //     premium: false,
        //     wip: true
        // },
        // {
        //     icao: 'eham',
        //     level: 'medium',
        //     name: 'Amsterdam Airport Schiphol',
        //     premium: false,
        //     wip: true
        // },
        {
            icao: 'eidw',
            level: 'easy',
            name: 'Dublin Airport',
            premium: false,
            wip: false
        },
        {
            icao: 'einn',
            level: 'beginner',
            name: 'Shannon Airport',
            premium: false,
            wip: false
        },
        {
            icao: 'ekch',
            level: 'medium',
            name: 'Copenhagen Kastrup Airport',
            premium: false,
            wip: true
        },
        {
            icao: 'engm',
            level: 'easy',
            name: 'Oslo Gardermoen International Airport',
            premium: false,
            wip: true
        },
        // {
        //     icao: 'espa',
        //     level: 'easy',
        //     name: 'Luleå Airport',
        //     premium: false,
        //     wip: true
        // },
        {
            icao: 'gcrr',
            level: 'easy',
            name: 'Lanzarote Airport',
            premium: false,
            wip: true
        },
        {
            icao: 'kabq',
            level: 'easy',
            name: 'Albuquerque International Sunport',
            premium: false,
            wip: false
        },
        {
            icao: 'katl',
            level: 'hard',
            name: 'Hartsfield–Jackson Atlanta Int\'l',
            premium: false,
            wip: false
        },
        {
            icao: 'kbos',
            level: 'medium',
            name: 'Boston Logan International Airport',
            premium: false,
            wip: false
        },
        // {
        //     icao: 'kdca',
        //     level: 'medium',
        //     name: 'Reagan National Airport',
        //     premium: false,
        //     wip: true
        // },
        // {
        //     icao: 'kdfw',
        //     level: 'hard',
        //     name: 'Dallas-Fort Worth International Airport',
        //     premium: false,
        //     wip: true
        // },
        {
            icao: 'kdtw',
            level: 'medium',
            name: 'Detroit Metropolitan Wayne County Airport',
            premium: false,
            wip: false
        },
        {
            icao: 'kelp',
            level: 'beginner',
            name: 'El Paso International Airport',
            premium: false,
            wip: false
        },
        {
            icao: 'kjax',
            level: 'easy',
            name: 'Jacksonville International Airport',
            wip: false
        },
        // {
        //     icao: 'kiad',
        //     level: 'hard',
        //     name: 'Washington-Dulles International Airport',
        //     premium: false,
        //     wip: true
        // },
        // {
        //     icao: 'kjfk',
        //     level: 'hard',
        //     name: 'John F Kennedy International Airport',
        //     premium: false,
        //     wip: true
        // },
        {
            icao: 'klas',
            level: 'hard',
            name: 'McCarran International Airport',
            premium: false,
            wip: false
        },
        // {
        //     icao: 'klax90',
        //     level: 'medium',
        //     name: 'Los Angeles International Airport 1990',
        //     premium: false,
        //     wip: true
        // },
        // {
        //     icao: 'klax',
        //     level: 'medium',
        //     name: 'Los Angeles International Airport',
        //     premium: false,
        //     wip: true
        // },
        // {
        //     icao: 'kmia',
        //     level: 'hard',
        //     name: 'Miami International Airport',
        //     premium: false,
        //     wip: true
        // },
        // {
        //     icao: 'kmsp',
        //     level: 'hard',
        //     name: 'Minneapolis/St. Paul International Airport',
        //     premium: false,
        //     wip: true
        // },
        // {
        //     icao: 'kord',
        //     level: 'hard',
        //     name: 'Chicago O\'Hare International Airport',
        //     premium: false,
        //     wip: true
        // },
        {
            icao: 'kpdx',
            level: 'beginner',
            name: 'Portland International Airport',
            premium: false,
            wip: false
        },
        {
            icao: 'kphx',
            level: 'easy',
            name: 'Phoenix Sky Harbor International Airport',
            premium: false,
            wip: true
        },
        {
            icao: 'kpvd',
            level: 'easy',
            name: 'Theodore Francis Green Memorial State Airport',
            premium: false,
            wip: false
        },
        {
            icao: 'ksdf',
            level: 'medium',
            name: 'Louisville International Airport',
            premium: false,
            wip: false
        },
        // {
        //     icao: 'ksan',
        //     level: 'easy',
        //     name: 'San Diego International Airport',
        //     premium: false,
        //     wip: true
        // },
        {
            icao: 'ksea',
            level: 'medium',
            name: 'Seattle-Tacoma International Airport',
            premium: false,
            wip: false
        },
        {
            icao: 'ksfo',
            level: 'medium',
            name: 'San Francisco International Airport',
            premium: false,
            wip: false
        },
        {
            icao: 'kstl',
            level: 'medium',
            name: 'St. Louis Lambert International Airport',
            premium: false,
            wip: false
        },
        {
            icao: 'ktpa',
            level: 'easy',
            name: 'Tampa International Airport',
            premium: false,
            wip: false
        },
        {
            icao: 'ktus',
            level: 'easy',
            name: 'Tucson International Airport',
            premium: false,
            wip: false
        },
        // {
        //     icao: 'lkpr',
        //     level: 'easy',
        //     name: 'Vaclav Havel International Airport',
        //     premium: false,
        //     wip: true
        // },
        {
            icao: 'loww',
            level: 'medium',
            name: 'Vienna International Airport',
            premium: false,
            wip: true
        },
        // {
        //     icao: 'ltba',
        //     level: 'hard',
        //     name: 'Atatürk International Airport',
        //     premium: false,
        //     wip: true
        // },
        {
            icao: 'mdsd',
            level: 'easy',
            name: 'Aeropuerto Internacional Las Américas',
            premium: false,
            wip: false
        },
        // {
        //     icao: 'omaa',
        //     level: 'medium',
        //     name: 'Abu Dhabi International Airport',
        //     premium: false,
        //     wip: true
        // },
        {
            icao: 'omdb',
            level: 'hard',
            name: 'Dubai International Airport',
            premium: false,
            wip: true
        },
        // {
        //     icao: 'osdi',
        //     level: 'easy',
        //     name: 'Damascus International Airport',
        //     premium: false,
        //     wip: true
        // },
        // {
        //     icao: 'othh',
        //     level: 'hard',
        //     name: 'Doha Hamad International Airport',
        //     premium: false,
        //     wip: true
        // },
        {
            icao: 'panc',
            level: 'medium',
            name: 'Ted Stevens Anchorage International Airport',
            premium: false,
            wip: false
        },
        // {
        //     icao: 'rjbb',
        //     level: 'hard',
        //     name: 'Osaka Kansai International Airport',
        //     premium: false,
        //     wip: true
        // },
        // {
        //     icao: 'rjaa',
        //     level: 'hard',
        //     name: 'Tokyo Narita International Airport',
        //     premium: false,
        //     wip: true
        // },
        // {
        //     icao: 'rjtt',
        //     level: 'hard',
        //     name: 'Tokyo Haneda International Airport',
        //     premium: false,
        //     wip: true
        // },
        // {
        //     icao: 'rksi',
        //     level: 'hard',
        //     name: 'Incheon International Airport',
        //     premium: false,
        //     wip: true
        // },
        // {
        //     icao: 'saez',
        //     level: 'medium',
        //     name: 'Aeropuerto Internacional Ministro Pistarini',
        //     premium: false,
        //     wip: true
        // },
        {
            icao: 'saez',
            level: 'easy',
            name: 'Aeropuerto Internacional Ministro Pistarini',
            premium: false,
            wip: false
        },
        // {
        //     icao: 'same',
        //     level: 'medium',
        //     name: 'Aeropuerto Internacional El Plumerillo',
        //     premium: false,
        //     wip: true
        // },
        // {
        //     icao: 'sawh',
        //     level: 'beginner',
        //     name: 'Aeropuerto Internacional Malvinas Argentinas',
        //     premium: false,
        //     wip: true
        // },
        // {
        //     icao: 'sbgl',
        //     level: 'beginner',
        //     name: 'Aeroporto Internacional Tom Jobim',
        //     premium: false,
        //     wip: true
        // },
        // {
        //     icao: 'sbgr',
        //     level: 'beginner',
        //     name: 'Aeroporto Internacional São Paulo-Guarulhos',
        //     premium: false,
        //     wip: true
        // },
        // {
        //     icao: 'tjsj',
        //     level: 'easy',
        //     name: 'Luis Muñoz Marín International Airport',
        //     premium: false,
        //     wip: true
        // },
        {
            icao: 'tncm',
            level: 'easy',
            name: 'Princess Juliana International Airport',
            premium: false,
            wip: true
        // },
        // {
        //     icao: 'uudd',
        //     level: 'easy',
        //     name: 'Moscow Domodedovo Airport',
        //     premium: false,
        //     wip: true
        // },
        // {
        //     icao: 'vabb',
        //     level: 'hard',
        //     name: 'Chhatrapati Shivaji International Airport',
        //     premium: false,
        //     wip: true
        // },
        // {
        //     icao: 'vecc',
        //     level: 'medium',
        //     name: 'Kolkata Netaji Subhas Chandra Bose Int\'l',
        //     premium: false,
        //     wip: true
        // },
        // {
        //     icao: 'vobl',
        //     level: 'medium',
        //     name: 'Kempegowda International Airport Bengaluru',
        //     premium: false,
        //     wip: true
        // },
        // {
        //     icao: 'vhhh',
        //     level: 'medium',
        //     name: 'Hong Kong Chep Lap Kok International Airport',
        //     premium: false,
        //     wip: true
        // },
        // {
        //     icao: 'vidp',
        //     level: 'hard',
        //     name: 'Indira Gandhi International Airport',
        //     premium: false,
        //     wip: true
        // },
        // {
        //     icao: 'wiii',
        //     level: 'medium',
        //     name: 'Soekarno-Hatta International Airport',
        //     premium: false,
        //     wip: true
        // },
        // {
        //     icao: 'wimm',
        //     level: 'easy',
        //     name: 'Kuala Namu International Airport',
        //     premium: false,
        //     wip: true
        // },
        // {
        //     icao: 'wmkp',
        //     level: 'medium',
        //     name: 'Pulau Pinang International Airport',
        //     premium: false,
        //     wip: true
        // },
        // {
        //     icao: 'wmkk',
        //     level: 'hard',
        //     name: 'Kuala Lumpur International Airport (KLIA)',
        //     premium: false,
        //     wip: true
        // },
        // {
        //     icao: 'wsss',
        //     level: 'hard',
        //     name: 'Singapore Changi International Airport',
        //     premium: false,
        //     wip: true
        // },
        // {
        //     icao: 'zspd',
        //     level: 'hard',
        //     name: 'Shanghai Pudong International Airport',
        //     premium: false,
        //     wip: true
        }
    ];
})();

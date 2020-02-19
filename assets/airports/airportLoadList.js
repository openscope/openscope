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
     *   premium: {MEETS_PREMIUM_STANDARDS}
     * }
     * ```
     * - `AIRPORT_ICAO` is the airport icao in lowercase (ex: ksfo)
     *
     * - `AIRPORT_DIFFICULTY` is the difficulty level based on the traffic volume (in Aircraft per Hour):
     *    +----------+------------------------+
     *    |   Level  |     Traffic Volume     |
     *    +----------+------------------------+
     *    | Beginner |    Less than 20 AcpH   |
     *    +----------+------------------------+
     *    |   Easy   | Between 20 and 40 AcpH |
     *    +----------+------------------------+
     *    |  Medium  | Between 40 and 60 AcpH |
     *    +----------+------------------------+
     *    |   Hard   |    More than 60 AcpH   |
     *    +----------+------------------------+
     * - `AIRPORT_NAME` is the official English name of the airport, according to Jeppesen charts
     *       --> for example, KSFO = "San Francisco International Airport"
     *
     * - `MEETS_PREMIUM_STANDARDS` is either `true` or `false`, see the airport standards document
     *
     * @property AIRPORT_LOAD_LIST
     * @type {Array}
     * @final
     */
    return [
        {
            icao: 'cyhz',
            level: 'beginner',
            name: 'Halifax Stanfield International Airport',
            premium: false
        },
        {
            icao: 'cyow',
            level: 'easy',
            name: 'Ottawa Macdonald-Cartier International Airport',
            premium: false
        },
        // {
        //     icao: 'ebbr',
        //     level: 'easy',
        //     name: 'Brussels-National',
        //     premium: false
        // },
        {
            icao: 'eddf',
            level: 'hard',
            name: 'Frankfurt Main Airport',
            premium: false
        },
        {
            icao: 'eddh',
            level: 'beginner',
            name: 'Hamburg Airport',
            premium: false
        },
        {
            icao: 'eddl',
            level: 'hard',
            name: 'Düsseldorf Airport',
            premium: false
        },
        {
            icao: 'eddm',
            level: 'hard',
            name: 'Munich Airport',
            premium: false
        },
        // {
        //     icao: 'eddt',
        //     level: 'medium',
        //     name: 'Berlin Tegel Airport',
        //     premium: false
        // },
        {
            icao: 'egcc',
            level: 'easy',
            name: 'Manchester Airport',
            premium: false
        },
        {
            icao: 'eggw',
            level: 'easy',
            name: 'London Luton Airport',
            premium: false
        },
        // {
        //     icao: 'egkk',
        //     level: 'easy',
        //     name: 'London Gatwick Airport',
        //     premium: false
        // },
        // {
        //     icao: 'eglc',
        //     level: 'medium',
        //     name: 'London City Airport',
        //     premium: false
        // },
        // {
        //     icao: 'egll',
        //     level: 'hard',
        //     name: 'London Heathrow Airport',
        //     premium: false
        // },
        {
            icao: 'egnm',
            level: 'beginner',
            name: 'Leeds Bradford Airport',
            premium: false
        },
        // {
        //     icao: 'eham',
        //     level: 'medium',
        //     name: 'Amsterdam Airport Schiphol',
        //     premium: false
        // },
        {
            icao: 'eidw',
            level: 'medium',
            name: 'Dublin Airport',
            premium: false
        },
        {
            icao: 'einn',
            level: 'beginner',
            name: 'Shannon Airport',
            premium: false
        },
        // {
        //     icao: 'ekch',
        //     level: 'medium',
        //     name: 'Copenhagen Kastrup Airport',
        //     premium: false
        // },
        {
            icao: 'engm',
            level: 'easy',
            name: 'Oslo Gardermoen Airport',
            premium: false
        },
        // {
        //     icao: 'espa',
        //     level: 'easy',
        //     name: 'Luleå Airport',
        //     premium: false
        // },
        // {
        //     icao: 'gcrr',
        //     level: 'easy',
        //     name: 'Lanzarote Airport',
        //     premium: false
        // },
        {
            icao: 'kabq',
            level: 'beginner',
            name: 'Albuquerque International Sunport',
            premium: false
        },
        {
            icao: 'katl',
            level: 'hard',
            name: 'Hartsfield–Jackson Atlanta International Airport',
            premium: false
        },
        {
            icao: 'kaus',
            level: 'easy',
            name: 'Austin-Bergstrom International Airport',
            premium: false
        },
        {
            icao: 'kbos',
            level: 'hard',
            name: 'Boston Logan International Airport',
            premium: false
        },
        {
            icao: 'kcvg',
            level: 'beginner',
            name: 'Cincinnati-Northern Kentucky International Airport',
            premium: false
        },
        {
            icao: 'kdca',
            level: 'easy',
            name: 'Ronald Reagan Washington National Airport',
            premium: false
        },
        // {
        //     icao: 'kdfw',
        //     level: 'hard',
        //     name: 'Dallas-Fort Worth International Airport',
        //     premium: false
        // },
        // {
        //     icao: 'kdtw',
        //     level: 'medium',
        //     name: 'Detroit Metropolitan Wayne County Airport',
        //     premium: false
        // },
        {
            icao: 'kelp',
            level: 'easy',
            name: 'El Paso International Airport',
            premium: false
        },
        // {
        //     icao: 'kiad',
        //     level: 'hard',
        //     name: 'Washington-Dulles International Airport',
        //     premium: false
        // },
        // {
        //     icao: 'kjax',
        //     level: 'easy',
        //     name: 'Jacksonville International Airport',
        //     premium: false
        // },
        {
            icao: 'kjfk',
            level: 'hard',
            name: 'John F. Kennedy International Airport',
            premium: false
        },
        {
            icao: 'klas',
            level: 'hard',
            name: 'Las Vegas McCarran International Airport',
            premium: false
        },
        {
            icao: 'klax',
            level: 'hard',
            name: 'Los Angeles International Airport',
            premium: false
        },
        {
            icao: 'kmci',
            level: 'beginner',
            name: 'Kansas City International Airport',
            premium: false
        },
        {
            icao: 'kmia',
            level: 'hard',
            name: 'Miami International Airport',
            premium: false
        },
        // {
        //     icao: 'kmsp',
        //     level: 'hard',
        //     name: 'Minneapolis/St. Paul International Airport',
        //     premium: false
        // },
        // {
        //     icao: 'kord',
        //     level: 'hard',
        //     name: 'Chicago O\'Hare International Airport',
        //     premium: false
        // },
        {
            icao: 'kpdx',
            level: 'easy',
            name: 'Portland International Airport',
            premium: false
        },
        // {
        //     icao: 'kphx',
        //     level: 'easy',
        //     name: 'Phoenix Sky Harbor International Airport',
        //     premium: false
        // },
        {
            icao: 'kpit',
            level: 'beginner',
            name: 'Pittsburgh International Airport',
            premium: false
        },
        // {
        //     icao: 'kpvd',
        //     level: 'beginner',
        //     name: 'Theodore Francis Green Memorial State Airport',
        //     premium: false
        // },
        {
            icao: 'krdu',
            level: 'easy',
            name: 'Raleigh–Durham International Airport',
            premium: false
        },
        // {
        //     icao: 'ksdf',
        //     level: 'easy',
        //     name: 'Louisville International Airport',
        //     premium: false
        // },
        // {
        //     icao: 'ksan',
        //     level: 'easy',
        //     name: 'San Diego International Airport',
        //     premium: false
        // },
        {
            icao: 'ksea',
            level: 'hard',
            name: 'Seattle-Tacoma International Airport',
            premium: false
        },
        {
            icao: 'ksfo',
            level: 'hard',
            name: 'San Francisco International Airport',
            premium: false
        },
        {
            icao: 'kstl',
            level: 'medium',
            name: 'St. Louis Lambert International Airport',
            premium: false
        },
        // {
        //     icao: 'ktpa',
        //     level: 'easy',
        //     name: 'Tampa International Airport',
        //     premium: false
        // },
        // {
        //     icao: 'ktus',
        //     level: 'beginner',
        //     name: 'Tucson International Airport',
        //     premium: false
        // },
        {
            icao: 'lipz',
            level: 'easy',
            name: 'Venice Marco Polo Airport',
            premium: false
        },
        {
            icao: 'lkpr',
            level: 'easy',
            name: 'Václav Havel Airport Prague',
            premium: false
        },
        {
            icao: 'lrop',
            level: 'medium',
            name: 'Bucharest Henri Coandă Airport',
            premium: false
        },
        {
            icao: 'loww',
            level: 'easy',
            name: 'Vienna Schwechat International Airport',
            premium: false
        },
        {
            icao: 'lszh',
            level: 'medium',
            name: 'Zürich Airport',
            premium: false
        },
        {
            icao: 'ltba',
            level: 'hard',
            name: 'Istanbul Atatürk International Airport',
            premium: false
        },
        // },
        // {
        //     icao: 'mdsd',
        //     level: 'beginner',
        //     name: 'Aeropuerto Internacional Las Américas',
        //     premium: false
        // },
        {
            icao: 'omaa',
            level: 'easy',
            name: 'Abu Dhabi International Airport',
            premium: false
        },
        {
            icao: 'omdb',
            level: 'hard',
            name: 'Dubai International Airport',
            premium: false
        },
        // {
        //     icao: 'osdi',
        //     level: 'easy',
        //     name: 'Damascus International Airport',
        //     premium: false
        // },
        {
            icao: 'othh',
            level: 'easy',
            name: 'Doha Hamad International Airport',
            premium: false
        },
        // {
        //     icao: 'panc',
        //     level: 'easy',
        //     name: 'Ted Stevens Anchorage International Airport',
        //     premium: false
        // },
        // {
        //     icao: 'rjbb',
        //     level: 'hard',
        //     name: 'Osaka Kansai International Airport',
        //     premium: false
        // },
        // {
        //     icao: 'rjaa',
        //     level: 'hard',
        //     name: 'Tokyo Narita International Airport',
        //     premium: false
        // },
        // {
        //     icao: 'rjtt',
        //     level: 'hard',
        //     name: 'Tokyo Haneda International Airport',
        //     premium: false
        // },
        // {
        //     icao: 'rksi',
        //     level: 'hard',
        //     name: 'Incheon International Airport',
        //     premium: false
        // },
        {
            icao: 'saez',
            level: 'easy',
            name: 'Ezeiza Ministro Pistarini International Airport',
            premium: false
        },
        {
            icao: 'same',
            level: 'beginner',
            name: 'Mendoza El Plumerillo International Airport',
            premium: false
        },
        {
            icao: 'sawh',
            level: 'beginner',
            name: 'Malvinas Argentinas Ushuaia International Airport',
            premium: false
        },
        // {
        //     icao: 'sbgl',
        //     level: 'beginner',
        //     name: 'Aeroporto Internacional Tom Jobim',
        //     premium: false
        // },
        // {
        //     icao: 'sbgr',
        //     level: 'beginner',
        //     name: 'Aeroporto Internacional São Paulo-Guarulhos',
        //     premium: false
        // },
        {
            icao: 'sumu',
            level: 'beginner',
            name: 'Montevideo Carrasco International Airport',
            premium: false
        },
        // {
        //     icao: 'tjsj',
        //     level: 'easy',
        //     name: 'Luis Muñoz Marín International Airport',
        //     premium: false
        // },
        {
            icao: 'tncm',
            level: 'beginner',
            name: 'Princess Juliana International Airport',
            premium: false
        // },
        // {
        //     icao: 'uudd',
        //     level: 'easy',
        //     name: 'Moscow Domodedovo Airport',
        //     premium: false
        // },
        // {
        //     icao: 'vabb',
        //     level: 'hard',
        //     name: 'Chhatrapati Shivaji International Airport',
        //     premium: false
        // },
        // {
        //     icao: 'vecc',
        //     level: 'medium',
        //     name: 'Kolkata Netaji Subhas Chandra Bose Int\'l',
        //     premium: false
        // },
        // {
        //     icao: 'vobl',
        //     level: 'medium',
        //     name: 'Kempegowda International Airport Bengaluru',
        //     premium: false
        // },
        // {
        //     icao: 'vhhh',
        //     level: 'medium',
        //     name: 'Hong Kong Chep Lap Kok International Airport',
        //     premium: false
        // },
        // {
        //     icao: 'vidp',
        //     level: 'hard',
        //     name: 'Indira Gandhi International Airport',
        //     premium: false
        // },
        // {
        //     icao: 'wiii',
        //     level: 'medium',
        //     name: 'Soekarno-Hatta International Airport',
        //     premium: false
        // },
        // {
        //     icao: 'wimm',
        //     level: 'easy',
        //     name: 'Kuala Namu International Airport',
        //     premium: false
        // },
        // {
        //     icao: 'wmkp',
        //     level: 'medium',
        //     name: 'Pulau Pinang International Airport',
        //     premium: false
        // },
        // {
        //     icao: 'wmkk',
        //     level: 'hard',
        //     name: 'Kuala Lumpur International Airport (KLIA)',
        //     premium: false
        // },
        // {
        //     icao: 'wsss',
        //     level: 'hard',
        //     name: 'Singapore Changi International Airport',
        //     premium: false
        // },
        // {
        //     icao: 'zspd',
        //     level: 'hard',
        //     name: 'Shanghai Pudong International Airport',
        //     premium: false
        }
    ];
})();

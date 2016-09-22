/**
 * List of airports to load.
 *
 *    {
 *      icao: {AIRPORT_ICAO},
 *      level: {AIRPORT_DIFFICULTY},
 *      name: {AIRPORT_NAME}
 *    }
 *
 *    If the airport is a work in progress, please include this icon after the `name` (see kmsp or ksea):
 *    - name: {AIRPORT_NAME} &#9983
 *
 * @property AIRPORT_LOAD_LIST
 * @type {Array}
 * @final
 */
export const AIRPORT_LOAD_LIST = [
    {
        icao: 'ebbr',
        level: 'easy',
        name: 'Brussels-National &#9983'
    },
    {
        icao: 'eddf',
        level: 'medium',
        name: 'Frankfurt Airport'
    },
    {
        icao: 'eddh',
        level: 'easy',
        name: 'Hamburg Airport'
    },
    {
        icao: 'eddm',
        level: 'beginner',
        name: 'Franz Josef Strauß International Airport'
    },
    {
        icao: 'eddt',
        level: 'medium',
        name: 'Berlin Tegel Airport'
    },
    {
        icao: 'egcc',
        level: 'hard',
        name: 'Manchester Airport'
    },
    {
        icao: 'eggw',
        level: 'medium',
        name: 'London Luton Airport'
    },
    {
        icao: 'egkk',
        level: 'easy',
        name: 'London Gatwick Airport'
    },
    {
        icao: 'eglc',
        level: 'medium',
        name: 'London City Airport'
    },
    {
        icao: 'egll',
        level: 'hard',
        name: 'London Heathrow Airport'
    },
    {
        icao: 'egnm',
        level: 'beginner',
        name: 'Leeds Bradford International Airport'
    },
    {
        icao: 'eham',
        level: 'medium',
        name: 'Amsterdam Airport Schiphol'
    },
    {
        icao: 'eidw',
        level: 'easy',
        name: 'Dublin Airport'
    },
    {
        icao: 'einn',
        level: 'easy',
        name: 'Shannon Airport'
    },
    {
        icao: 'ekch',
        level: 'medium',
        name: 'Copenhagen Kastrup Airport'
    },
    {
        icao: 'engm',
        level: 'easy',
        name: 'Oslo Gardermoen International Airport'
    },
    {
        icao: 'espa',
        level: 'easy',
        name: 'Luleå Airport'
    },
    {
        icao: 'gcrr',
        level: 'easy',
        name: 'Lanzarote Airport'
    },
    {
        icao: 'kbos',
        level: 'medium',
        name: 'Boston Logan International Airport'
    },
    {
        icao: 'kdca',
        level: 'medium',
        name: 'Reagan National Airport'
    },
    {
        icao: 'kiad',
        level: 'hard',
        name: 'Washington-Dulles International Airport'
    },
    {
        icao: 'kjfk',
        level: 'hard',
        name: 'John F Kennedy International Airport &#9983'
    },
    {
        icao: 'klas',
        level: 'medium',
        name: 'McCarran International Airport'
    },
    {
        icao: 'klax90',
        level: 'medium',
        name: 'Los Angeles International Airport 1990'
    },
    {
        icao: 'klax',
        level: 'medium',
        name: 'Los Angeles International Airport'
    },
    {
        icao: 'kmia',
        level: 'hard',
        name: 'Miami International Airport &#9983'
    },
    {
        icao: 'kmsp',
        level: 'hard',
        name: 'Minneapolis/St. Paul International Airport &#9983'
    },
    {
        icao: 'kord',
        level: 'hard',
        name: 'Chicago O\'Hare International Airport'
    },
    {
        icao: 'kpdx',
        level: 'easy',
        name: 'Portland International Airport'
    },
    {
        icao: 'kphx',
        level: 'easy',
        name: 'Phoenix Sky Harbor International Airport'
    },
    {
        icao: 'ksan',
        level: 'easy',
        name: 'San Diego International Airport'
    },
    {
        icao: 'ksea',
        level: 'medium',
        name: 'Seattle-Tacoma International Airport &#9983'
    },
    {
        icao: 'ksfo',
        level: 'medium',
        name: 'San Francisco International Airport &#9983'
    },
    {
        icao: 'lkpr',
        level: 'easy',
        name: 'Vaclav Havel International Airport'
    },
    {
        icao: 'loww',
        level: 'medium',
        name: 'Vienna International Airport'
    },
    {
        icao: 'ltba',
        level: 'hard',
        name: 'Atatürk International Airport &#9983'
    },
    {
        icao: 'omaa',
        level: 'medium',
        name: 'Abu Dhabi International Airport'
    },
    {
        icao: 'omdb',
        level: 'hard',
        name: 'Dubai International Airport'
    },
    {
        icao: 'osdi',
        level: 'easy',
        name: 'Damascus International Airport'
    },
    {
        icao: 'othh',
        level: 'hard',
        name: 'Doha Hamad International Airport'
    },
    {
        icao: 'rjtt',
        level: 'hard',
        name: 'Tokyo Haneda International Airport'
    },
    {
        icao: 'rksi',
        level: 'hard',
        name: 'Incheon International Airport'
    },
    {
        icao: 'saez',
        level: 'medium',
        name: 'Aeropuerto Internacional Ministro Pistarini'
    },
    {
        icao: 'same',
        level: 'medium',
        name: 'Aeropuerto Internacional El Plumerillo'
    },
    {
        icao: 'sawh',
        level: 'beginner',
        name: 'Aeropuerto Internacional Malvinas Argentinas'
    },
    {
        icao: 'sbgl',
        level: 'beginner',
        name: 'Aeroporto Internacional Tom Jobim'
    },
    {
        icao: 'sbgr',
        level: 'beginner',
        name: 'Aeroporto Internacional de São Paulo/Guarulhos'
    },
    {
        icao: 'tjsj',
        level: 'easy',
        name: 'Luis Muñoz Marín International Airport'
    },
    {
        icao: 'tncm',
        level: 'easy',
        name: 'Princess Juliana International Airport'
    },
    {
        icao: 'uudd',
        level: 'easy',
        name: 'Moscow Domodedovo Airport'
    },
    {
        icao: 'vabb',
        level: 'hard',
        name: 'Chhatrapati Shivaji International Airport'
    },
    {
        icao: 'vecc',
        level: 'medium',
        name: 'Kolkata Netaji Subhas Chandra Bose Int\'l'
    },
    {
        icao: 'vhhh',
        level: 'medium',
        name: 'Hong Kong Chep Lap Kok International Airport'
    },
    {
        icao: 'vidp',
        level: 'hard',
        name: 'Indira Gandhi International Airport'
    },
    {
        icao: 'wiii',
        level: 'medium',
        name: 'Soekarno-Hatta International Airport'
    },
    {
        icao: 'wimm',
        level: 'easy',
        name: 'Kuala Namu International Airport'
    },
    {
        icao: 'wmkp',
        level: 'medium',
        name: 'Pulau Pinang International Airport'
    },
    {
        icao: 'wmkk',
        level: 'hard',
        name: 'Kuala Lumpur International Airport (KLIA)'
    },
    {
        icao: 'wsss',
        level: 'hard',
        name: 'Singapore Changi International Airport'
    },
    {
        icao: 'zspd',
        level: 'hard',
        name: 'Shanghai Pudong International Airport'
    }
];

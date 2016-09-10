import ArrivalBase from './Arrival/ArrivalBase';
import ArrivalCyclic from './Arrival/ArrivalCyclic';
import ArrivalWave from './Arrival/ArrivalWave';
import ArrivalSurge from './Arrival/ArrivalSurge';
import DepartureBase from './Departure/DepartureBase';
import DepartureCyclic from './Departure/DepartureCyclic';
import DepartureWave from './Departure/DepartureWave';

import Runway from './Runway';
import Airport from './AirportInstance';

import { km, nm, degreesToRadians } from '../utilities/unitConverters';
import { distance2d } from '../math/distance';
import { vlen, vradial, vsub } from '../math/vector';

/** ************************** AIRCRAFT GENERATION ****************************/
/**
 * Calls constructor of the appropriate arrival type
 */
zlsa.atc.ArrivalFactory = function(airport, options) {
  if (options.type) {
    if (options.type == 'random')
      return new zlsa.atc.ArrivalBase(airport, options);
    if (options.type == 'cyclic')
      return new zlsa.atc.ArrivalCyclic(airport, options);
    if (options.type == 'wave')
      return new zlsa.atc.ArrivalWave(airport, options);
    if (options.type == 'surge')
      return new zlsa.atc.ArrivalSurge(airport, options);
    log(airport.icao + ' using unsupported arrival type "'+options.type+'"', LOG_WARNING);
  }
  else log(airport.icao + " arrival stream not given type!", LOG_WARNING);
};

zlsa.atc.ArrivalBase = ArrivalBase;
zlsa.atc.ArrivalCyclic = ArrivalCyclic;
zlsa.atc.ArrivalWave = ArrivalWave;
zlsa.atc.ArrivalSurge = ArrivalSurge;


/**
 * Calls constructor of the appropriate arrival type
 */
zlsa.atc.DepartureFactory = function(airport, options) {
  if (options.type) {
    if (options.type == 'random')
      return new zlsa.atc.DepartureBase(airport, options);
    if (options.type == 'cyclic')
      return new zlsa.atc.DepartureCyclic(airport, options);
    if (options.type == 'wave')
      return new zlsa.atc.DepartureWave(airport, options);
    log(airport.icao + ' using unsupported departure type "'+options.type+'"', LOG_WARNING);
  }
  else log(airport.icao + " departure stream not given type!", LOG_WARNING);
};

zlsa.atc.DepartureBase = DepartureBase;
zlsa.atc.DepartureCyclic = DepartureCyclic;
zlsa.atc.DepartureWave = DepartureWave;


window.airport_init_pre = function airport_init_pre() {
    prop.airport = {};
    prop.airport.airports = {};
    prop.airport.current  = null;
};

window.airport_init = function airport_init() {
  airport_load('ebbr', "easy", "Brussels-National &#9983");
  airport_load('eddf', "medium", "Frankfurt Airport");
  airport_load('eddh', "easy", "Hamburg Airport");
  airport_load('eddm', "beginner", "Franz Josef Strauß International Airport");
  airport_load('eddt', "medium", "Berlin Tegel Airport");
  airport_load('egcc', "hard", "Manchester Airport");
  airport_load('eggw', "medium", "London Luton Airport")
  airport_load('egkk', "easy", "London Gatwick Airport");
  airport_load('eglc', "medium", "London City Airport");
  airport_load('egll', "hard", "London Heathrow Airport");
  airport_load('egnm', "beginner", "Leeds Bradford International Airport");
  airport_load('eham', "medium", "Amsterdam Airport Schiphol");
  airport_load('eidw', "easy", "Dublin Airport");
  airport_load('einn', "easy", "Shannon Airport");
  airport_load('ekch', "medium", "Copenhagen Kastrup Airport");
  airport_load('engm', "easy", "Oslo Gardermoen International Airport");
  airport_load('espa', "easy", "Luleå Airport");
  airport_load('gcrr', "easy", "Lanzarote Airport");
  airport_load('kbos', "medium", "Boston Logan International Airport");
  airport_load('kdca', "medium", "Reagan National Airport");
  airport_load('kiad', "hard", "Washington-Dulles International Airport");
  airport_load('kjfk', "hard", "John F Kennedy International Airport &#9983");
  airport_load('klas', "medium", "McCarran International Airport");
  airport_load('klax90', "medium", "Los Angeles International Airport 1990");
  airport_load('klax', "medium", "Los Angeles International Airport");
  airport_load('kmia', "hard", "Miami International Airport &#9983");
  airport_load('kmsp', "hard", "Minneapolis/St. Paul International Airport &#9983");
  airport_load('kord', "hard", "Chicago O'Hare International Airport");
  airport_load('kpdx', "easy", "Portland International Airport");
  airport_load('kphx', "easy", "Phoenix Sky Harbor International Airport");
  airport_load('ksan', "easy", "San Diego International Airport");
  airport_load('ksea', "medium", "Seattle-Tacoma International Airport &#9983");
  airport_load('ksfo', "medium", "San Francisco International Airport &#9983");
  airport_load('lkpr', "easy", "Vaclav Havel International Airport");
  airport_load('loww', "medium", "Vienna International Airport");
  airport_load('ltba', "hard", "Atatürk International Airport &#9983");
  airport_load('omaa', "medium", "Abu Dhabi International Airport");
  airport_load('omdb', "hard", "Dubai International Airport");
  airport_load('osdi', "easy",  "Damascus International Airport");
  airport_load('othh', "hard", "Doha Hamad International Airport");
  airport_load('rjtt', "hard", "Tokyo Haneda International Airport");
  airport_load('rksi', "hard", "Incheon International Airport");
  airport_load('saez', "medium", "Aeropuerto Internacional Ministro Pistarini");
  airport_load('same', "medium", "Aeropuerto Internacional El Plumerillo");
  airport_load('sawh', "beginner", "Aeropuerto Internacional Malvinas Argentinas");
  airport_load('sbgl', "beginner", "Aeroporto Internacional Tom Jobim");
  airport_load('sbgr', "beginner", "Aeroporto Internacional de São Paulo/Guarulhos");
  airport_load('tjsj', "easy", "Luis Muñoz Marín International Airport");
  airport_load('tncm', "easy", "Princess Juliana International Airport");
  airport_load('uudd', "easy", "Moscow Domodedovo Airport");
  airport_load('vabb', "hard", "Chhatrapati Shivaji International Airport")
  airport_load('vecc', "medium", "Kolkata Netaji Subhas Chandra Bose Int'l");
  airport_load('vhhh', "medium", "Hong Kong Chep Lap Kok International Airport");
  airport_load('vidp', "hard", "Indira Gandhi International Airport");
  airport_load('wiii', "medium", "Soekarno-Hatta International Airport");
  airport_load('wimm', "easy", "Kuala Namu International Airport");
  airport_load('wmkp', "medium", "Pulau Pinang International Airport");
  airport_load('wmkk', "hard", "Kuala Lumpur International Airport (KLIA)")
  airport_load('wsss', "hard", "Singapore Changi International Airport");
  airport_load('zspd', "hard", "Shanghai Pudong International Airport");
};

window.airport_ready = function airport_ready() {
    if (!('atc-last-airport' in localStorage) ||
        !(localStorage['atc-last-airport'] in prop.airport.airports
    )) {
        airport_set('ksfo');
    } else {
        airport_set();
    }
};

window.airport_load = function airport_load(icao,level,name) {
    icao = icao.toLowerCase();

    if (icao in prop.airport.airports) {
        console.log(icao + ": already loaded");
        return;
    }

    var airport= new Airport({
        icao: icao,
        level: level,
        name: name
    });

    airport_add(airport);

    return airport;
};

window.airport_add = function airport_add(airport) {
    prop.airport.airports[airport.icao.toLowerCase()] = airport;
};

window.airport_set = function airport_set(icao) {
  if(!icao) {
    if(!('atc-last-airport' in localStorage)) return;
    else icao = localStorage['atc-last-airport'];
  }
  icao = icao.toLowerCase();

  if(!(icao in prop.airport.airports)) {
    console.log(icao + ": no such airport");
    return;
  }

  if(prop.airport.current) {
    prop.airport.current.unset();
    aircraft_remove_all();
  }

  var newAirport = prop.airport.airports[icao];
  newAirport.set();
};

window.airport_get = function airport_get(icao) {
    if (!icao) {
        return prop.airport.current
    };

    return prop.airport.airports[icao.toLowerCase()];
};

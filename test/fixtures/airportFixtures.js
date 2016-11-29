import AirportModel from '../../src/assets/scripts/airport/AirportModel';
import PositionModel from '../../src/assets/scripts/base/PositionModel';

// airport position for KSFO
export const airportPositionFixtureKSFO = new PositionModel(['N37.6195', 'W122.3738333', '13ft'], null, 13.7);

export const airportModelFixtureForWaypoint = new AirportModel({
    icao: 'KLAS',
    iata: 'LAS',
    magnetic_north: 11.9,
    ctr_radius: 80,
    ctr_ceiling: 19000,
    initial_alt: 19000,
    position: ['N36.080056', 'W115.15225', '2181ft'],
    rr_radius_nm: 5.0,
    rr_center: ['N36.080056', 'W115.15225'],
    wind: {
        angle: 220,
        speed: 6
    },
    runways: [
        {
            name: ['07L', '25R'],
            end: [['N36d4m34.82', 'W115d10m16.98', '2179ft'], ['N36d4m35.05', 'W115d7m15.93', '2033ft']],
            delay: [5, 5],
            ils: [false, true]
        },
        {
            name: ['07R', '25L'],
            end: [['N36d4m25.04', 'W115d9m41.15', '2157ft'], ['N36d4m25.17', 'W115d7m32.96', '2049ft']],
            delay: [3, 5],
            ils: [false, true]
        },
        {
            name: ['01R', '19L'],
            end: [['N36d4m27.19', 'W115d10m3.00', '2175ft'], ['N36d5m54.85', 'W115d9m12.79', '2078ft']],
            delay: [3, 6],
            ils: [false, false]
        },
        {
            name: ['01L', '19R'],
            end: [['N36d4m31.19', 'W115d10m13.31', '2181ft'], ['N36d5m58.77', 'W115d9m23.12', '2089ft']],
            delay: [4, 7],
            ils: [true, false]
        }
    ]
});

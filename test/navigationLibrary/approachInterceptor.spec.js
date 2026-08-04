import ava from 'ava';
import {
    findBestIntercept,
    findInterceptableLegs
} from '../../src/assets/scripts/client/navigationLibrary/approachInterceptor';
import {
    MAX_INTERCEPT_ANGLE,
    MAX_INTERCEPT_DISTANCE_NM,
    MIN_INTERCEPT_DISTANCE_NM
} from '../../src/assets/scripts/client/constants/approachConstants';
const NORTH_LEG_FIXES = {
    IAF: { latitude: 40.0, longitude: -74.0 },
    FAF: { latitude: 40.1, longitude: -74.0 },
    MAP: { latitude: 40.2, longitude: -74.0 }
};
const NORTH_LEG_PROCEDURE = ['IAF', 'FAF', 'MAP'];

ava('returns null for empty procedure', (t) => {
    const aircraft = { position: { latitude: 39.9, longitude: -74.0 }, heading: 0 };

    t.is(findBestIntercept(aircraft, [], NORTH_LEG_FIXES), null);
});

ava('returns null for single-fix procedure (no legs)', (t) => {
    const aircraft = { position: { latitude: 39.9, longitude: -74.0 }, heading: 0 };

    t.is(findBestIntercept(aircraft, ['IAF'], NORTH_LEG_FIXES), null);
});

ava('returns null when aircraft heading opposite to leg', (t) => {
    // Heading south (180°), leg course is north (0°). The lines are parallel
    // (aircraft on the leg line heading away) and the angle is 180°.
    const aircraft = { position: { latitude: 39.9, longitude: -74.05 }, heading: 180 };

    t.is(findBestIntercept(aircraft, NORTH_LEG_PROCEDURE, NORTH_LEG_FIXES), null);
});

ava('returns null when aircraft heading perpendicular to leg', (t) => {
    // Heading east (90°), leg course is north (0°). The lines cross but
    // the angle is 90°, above the threshold.
    const aircraft = { position: { latitude: 39.95, longitude: -74.05 }, heading: 90 };

    t.is(findBestIntercept(aircraft, NORTH_LEG_PROCEDURE, NORTH_LEG_FIXES), null);
});

ava('finds intercept on first leg for aircraft heading toward it', (t) => {
    // Aircraft 6nm SSW of IAF, heading NE (30° off the leg course).
    const aircraft = { position: { latitude: 39.9, longitude: -74.05 }, heading: 30 };
    const result = findBestIntercept(aircraft, NORTH_LEG_PROCEDURE, NORTH_LEG_FIXES);

    t.truthy(result);
    t.is(result.leg, 'IAF');
    t.true(result.distance > MIN_INTERCEPT_DISTANCE_NM);
    t.true(result.distance < MAX_INTERCEPT_DISTANCE_NM);
    t.true(result.angle >= 0);
    t.true(result.angle <= MAX_INTERCEPT_ANGLE);
});

ava('finds intercept on second leg when aircraft is past the first', (t) => {
    // Aircraft is north of FAF, so leg 1's intercept is outside its range.
    // Leg 2 (FAF -> MAP) is the only valid candidate.
    const aircraft = { position: { latitude: 40.12, longitude: -74.05 }, heading: 45 };
    const result = findBestIntercept(aircraft, NORTH_LEG_PROCEDURE, NORTH_LEG_FIXES);

    t.truthy(result);
    t.is(result.leg, 'FAF');
});

ava('accepts intercept at exactly the angle threshold', (t) => {
    // Heading 45° is the threshold. The angle check is `> max`, so 45 passes.
    const aircraft = { position: { latitude: 39.9, longitude: -74.05 }, heading: 45 };
    const result = findBestIntercept(aircraft, NORTH_LEG_PROCEDURE, NORTH_LEG_FIXES);

    t.truthy(result);
    t.is(result.angle, MAX_INTERCEPT_ANGLE);
});

ava('rejects intercept just over the angle threshold', (t) => {
    const aircraft = { position: { latitude: 39.9, longitude: -74.05 }, heading: 46 };

    t.is(findBestIntercept(aircraft, NORTH_LEG_PROCEDURE, NORTH_LEG_FIXES), null);
});

ava('skips leg whose fix is missing from the fixes map', (t) => {
    const aircraft = { position: { latitude: 39.9, longitude: -74.05 }, heading: 30 };
    const partialFixes = {
        IAF: { latitude: 40.0, longitude: -74.0 },
        // FAF missing
        MAP: { latitude: 40.2, longitude: -74.0 }
    };

    // Both legs reference FAF, so both are skipped.
    t.is(findBestIntercept(aircraft, NORTH_LEG_PROCEDURE, partialFixes), null);
});

ava('uses a valid leg when the other references a missing fix', (t) => {
    const aircraft = { position: { latitude: 40.12, longitude: -74.05 }, heading: 45 };
    const partialFixes = {
        // IAF missing -> leg 1 (IAF->FAF) skipped
        FAF: { latitude: 40.1, longitude: -74.0 },
        MAP: { latitude: 40.2, longitude: -74.0 }
    };
    const result = findBestIntercept(aircraft, NORTH_LEG_PROCEDURE, partialFixes);

    t.truthy(result);
    t.is(result.leg, 'FAF');
});

ava('returns null when aircraft is too far from any leg', (t) => {
    // Aircraft 60nm south of the procedure, well beyond MAX_INTERCEPT_DISTANCE_NM.
    const aircraft = { position: { latitude: 39.0, longitude: -74.0 }, heading: 0 };

    t.is(findBestIntercept(aircraft, NORTH_LEG_PROCEDURE, NORTH_LEG_FIXES), null);
});

ava('returns null when aircraft is at a fix (too close to intercept)', (t) => {
    // Aircraft exactly at IAF: the intercept is at the aircraft itself
    // (distance 0), which fails the MIN_INTERCEPT_DISTANCE_NM check.
    const aircraft = { position: { latitude: 40.0, longitude: -74.0 }, heading: 0 };

    t.is(findBestIntercept(aircraft, NORTH_LEG_PROCEDURE, NORTH_LEG_FIXES), null);
});

ava('findInterceptableLegs returns candidates sorted by distance ascending', (t) => {
    const aircraft = { position: { latitude: 39.9, longitude: -74.05 }, heading: 30 };
    const candidates = findInterceptableLegs(aircraft, NORTH_LEG_PROCEDURE, NORTH_LEG_FIXES);

    t.true(candidates.length >= 1);
    for (let i = 1; i < candidates.length; i++) {
        t.true(candidates[i - 1].distance <= candidates[i].distance);
    }
});

ava('candidate has leg name, intercept point, distance, and angle', (t) => {
    const aircraft = { position: { latitude: 39.9, longitude: -74.05 }, heading: 30 };
    const result = findBestIntercept(aircraft, NORTH_LEG_PROCEDURE, NORTH_LEG_FIXES);

    t.truthy(result);
    t.is(typeof result.leg, 'string');
    t.is(typeof result.interceptPoint.latitude, 'number');
    t.is(typeof result.interceptPoint.longitude, 'number');
    t.is(typeof result.distance, 'number');
    t.is(typeof result.angle, 'number');
});

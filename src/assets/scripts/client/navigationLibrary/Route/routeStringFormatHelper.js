import _chunk from 'lodash/chunk';
import _drop from 'lodash/drop';
import _last from 'lodash/last';
import _isString from 'lodash/isString';
import { REGEX } from '../../constants/globalConstants';

/**
 * Symbol that divides each route segment
 *
 * @property PROCEDURE_SEGMENT_SEPARATION_SYMBOL
 * @type {string}
 * @final
 */
const PROCEDURE_SEGMENT_SEPARATION_SYMBOL = '.';

/**
 * Symbol that divides each direct segment
 *
 * @property DIRECT_SEPARATION_SYMBOL
 * @type {string}
 * @final
 */
const DIRECT_SEPARATION_SYMBOL = '..';

/**
 * A procedure segment has exactly three parts (ex: `BETHL.GRNPA1.KLAS`)
 *
 * @property MAXIMUM_PROCEDUURE_SEGMENT_LENGTH
 * @type {number}
 * @final
 */
const MAXIMUM_PROCEDUURE_SEGMENT_LENGTH = 3;

/**
 *
 *
 * @function _hasSpaces
 * @param {string} str
 * @return {boolean}
 */
const _hasSpaces = (str) => REGEX.WHITESPACE.test(str);

/**
 *
 *
 * @function _explodeDirectRouteSegments
 * @param str {string}
 * @return {array<string>}
 */
const _explodeDirectRouteSegments = (str) => str.split(DIRECT_SEPARATION_SYMBOL);

/**
 *
 *
 * @function _explodeProcedureRouteSegments
 * @param str {string}
 * @return {array<string>}
 */
const _explodeProcedureRouteSegments = (str) => str.split(PROCEDURE_SEGMENT_SEPARATION_SYMBOL);

/**
 * Takes a single-string route and converts it to an array of procedure/fixname strings
 *
 * ex:
 *   - input: "KSFO.OFFSH9.SXC.V458.IPL.J2.JCT..LLO..ACT..KACT"
 *   - output: ["KSFO.OFFSH9.SXC", "SXC.V458.IPL", "IPL.J2.JCT", "LLO", "ACT", "KACT"]
 *
 *
 * directRouteSegments - defined as the string segments between `..` portions of a route string
 * procedureRouteSegments - defined as the string segments between `.` portions of a route string
 *
 * @function routeStringFormatHelper
 * @param routeString {string}
 * @return {array<string>}
 */
export const routeStringFormatHelper = (routeString) => {
    if (!_isString(routeString)) {
        // eslint-disable-next-line max-len
        throw new TypeError(`Invalid parameter passed to routeStringFormatHelper. Expected a string but received ${typeof routeString}`);
    }

    if (_hasSpaces(routeString)) {
        console.error('routeStringFormatHelper received a string with spaces. A routeString cannot contain spaces. ' +
            `Please remove any spaces from: ${routeString}`);
        return;
    }

    const formattedRoute = [];
    const directRouteSegments = _explodeDirectRouteSegments(routeString);

    // deal with multilinks (eg 'KSFO.OFFSH9.SXC.V458.IPL')
    for (let i = 0; i < directRouteSegments.length; i++) {
        let routeStringSection;
        const procedureRouteSegments = _explodeProcedureRouteSegments(directRouteSegments[i]);

        if (procedureRouteSegments.length === 1) {
            // a fix/navaid
            formattedRoute.push(directRouteSegments[i]);

            // eslint-disable-next-line no-continue
            continue;
        }

        const initialProcedureRouteSegment = procedureRouteSegments.slice(0, MAXIMUM_PROCEDUURE_SEGMENT_LENGTH);

        // is a procedure, eg SID, STAR, IAP, airway, etc.
        if (procedureRouteSegments.length < 3) {
            // user either didn't specify start point or end point
            // ERROR
            return;
        }

        routeStringSection = initialProcedureRouteSegment.join(PROCEDURE_SEGMENT_SEPARATION_SYMBOL);

        formattedRoute.push(routeStringSection);

        // chop up the multilink
        const subsequentRouteSegmentsLength = 2;
        const posteriorProcedureRouteSegments = _chunk(
            _drop(procedureRouteSegments, MAXIMUM_PROCEDUURE_SEGMENT_LENGTH), subsequentRouteSegmentsLength
        );
        let nextProcedureRouteSegment = _last(initialProcedureRouteSegment);

        for (let j = 0; j < posteriorProcedureRouteSegments.length; j++) {
            // use the last fixname from the previous procedure and combine it with the posteriorProcedureRouteSegments
            routeStringSection = `${nextProcedureRouteSegment}.` +
                `${posteriorProcedureRouteSegments[j].join(PROCEDURE_SEGMENT_SEPARATION_SYMBOL)}`;
            nextProcedureRouteSegment = _last(posteriorProcedureRouteSegments[j]);

            formattedRoute.push(routeStringSection);
        }
    }

    return formattedRoute;
};

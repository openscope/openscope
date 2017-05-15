import _chunk from 'lodash/chunk';
import _drop from 'lodash/drop';
import _last from 'lodash/last';
import _isString from 'lodash/isString';
import { REGEX } from '../../constants/globalConstants';
import {
    DIRECT_SEGMENT_DIVIDER,
    HOLD_WAYPOINT_PREFIX,
    ROUTE_SEGMENT_MAX_LENGTH,
    PROCEDURE_SEGMENT_DIVIDER,
    VECTOR_WAYPOINT_PREFIX
} from '../../constants/navigation/routeConstants';

/**
 * Encapsulation of a regex used to determine if spaces exist within a string
 *
 * @function _hasSpaces
 * @param {string} str
 * @return {boolean}
 */
const _hasSpaces = (str) => REGEX.WHITESPACE.test(str);

/**
 * Produce an array of items separated by `..`
 *
 * Used to find the `directRouteSegments` of a `routeString`
 *
 * @function _explodeDirectRouteSegments
 * @param str {string}
 * @return {array<string>}
 */
const _explodeDirectRouteSegments = (str) => str.split(DIRECT_SEGMENT_DIVIDER);

/**
 * Produce an array of items separated by `.`
 *
 * Used to find the `procedureRouteSegments` of a `routeString`
 *
 * @function _explodeProcedureRouteSegments
 * @param str {string}
 * @return {array<string>}
 */
const _explodeProcedureRouteSegments = (str) => str.split(PROCEDURE_SEGMENT_DIVIDER);

/**
 * Takes a single-string route and converts it to an array of procedure/fixname strings
 *
 * ex:
 *   - input: "KSFO.OFFSH9.SXC.V458.IPL.J2.JCT..LLO..ACT..KACT"
 *   - output: ["KSFO.OFFSH9.SXC", "SXC.V458.IPL", "IPL.J2.JCT", "LLO", "ACT", "KACT"]
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

        const initialProcedureRouteSegment = procedureRouteSegments.slice(0, ROUTE_SEGMENT_MAX_LENGTH);

        // is a procedure, eg SID, STAR, IAP, airway, etc.
        if (procedureRouteSegments.length < 3) {
            // user either didn't specify start point or end point
            // ERROR
            return;
        }

        routeStringSection = initialProcedureRouteSegment.join(PROCEDURE_SEGMENT_DIVIDER);

        formattedRoute.push(routeStringSection);

        // chop up the multilink
        const subsequentRouteSegmentsLength = 2;
        const posteriorProcedureRouteSegments = _chunk(
            _drop(procedureRouteSegments, ROUTE_SEGMENT_MAX_LENGTH), subsequentRouteSegmentsLength
        );
        let nextProcedureRouteSegment = _last(initialProcedureRouteSegment);

        for (let j = 0; j < posteriorProcedureRouteSegments.length; j++) {
            // use the last fixname from the previous procedure and combine it with the posteriorProcedureRouteSegments
            routeStringSection = `${nextProcedureRouteSegment}.${posteriorProcedureRouteSegments[j].join(PROCEDURE_SEGMENT_DIVIDER)}`;
            nextProcedureRouteSegment = _last(posteriorProcedureRouteSegments[j]);

            formattedRoute.push(routeStringSection);
        }
    }

    return formattedRoute;
};

/**
 * Return the fix name from a `holdRouteString`
 *
 * @function extractFixnameFromHoldSegment
 * @param routeString {string} eg `@COWBY`
 * @return {string} eg `COWBY`
 */
export const extractFixnameFromHoldSegment = (routeString) => routeString.split(HOLD_WAYPOINT_PREFIX)[1];

/**
 * Return the heading from a `vectorRouteString`
 *
 * @function extractFixnameFromHoldSegment
 * @param  routeString {string} eg `#320`
 * @return {string} eg `320`
 */
export const extractHeadingFromVectorSegment = (routeString) => routeString.split(VECTOR_WAYPOINT_PREFIX)[1];

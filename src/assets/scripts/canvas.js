/* eslint-disable camelcase, no-underscore-dangle, no-mixed-operators, func-names, object-shorthand, no-param-reassign, no-undef */
// jshint latedef:nofunc, undef:true, eqnull:true, eqeqeq:true, browser:true, jquery:true, devel:true
/* global prop:true, km:false, crange:false, clamp:false, lpad:false, airport_get:false, game_time:false, game_paused:false, time:false, round:false, distance2d:false, radians:false  */
import $ from 'jquery';
import _clamp from 'lodash/clamp';
import _forEach from 'lodash/forEach';
import _has from 'lodash/has';
import { km, degreesToRadians } from './utilities/unitConverters';
import { time } from './utilities/timeHelpers';
import { sin, cos, round } from './math/core';
import { tau } from './math/circle';
import { distance2d } from './math/distance';
import { SELECTORS } from './constants/selectors';
import { LOG } from './constants/logLevel';
import { FLIGHT_MODES, FLIGHT_CATEGORY } from './aircraft/AircraftInstanceModel';

const BASE_CANVAS_FONT = '10px monoOne, monospace';

function canvas_adjust_hidpi() {
    const dpr = window.devicePixelRatio || 1;

    log(`devicePixelRatio: ${dpr}`);

    // TODO: change to early return
    if (dpr <= 1) {
        return;
    }

    // TODO: cache this selector, $hidefCanvas
    // TODO: replace selector with constant
    const hidefCanvas = $(SELECTORS.DOM_SELECTORS.NAVAIDS_CANVAS).get(0);
    const w = prop.canvas.size.width;
    const h = prop.canvas.size.height;

    $(hidefCanvas).attr('width', w * dpr);
    $(hidefCanvas).attr('height', h * dpr);
    $(hidefCanvas).css('width', w);
    $(hidefCanvas).css('height', h);

    const ctx = hidefCanvas.getContext('2d');

    ctx.scale(dpr, dpr);
    prop.canvas.contexts.navaids = ctx;
}

function canvas_complete() {
    setTimeout(function() {
        prop.canvas.dirty = true;
    }, 500);

    prop.canvas.last = time();
}

function canvas_resize() {
    if (prop.canvas.resize) {
        prop.canvas.size.width = $(window).width();
        prop.canvas.size.height = $(window).height();
    }

    prop.canvas.size.width -= 250;
    prop.canvas.size.height -= 36;

    for (const i in prop.canvas.contexts) {
        prop.canvas.contexts[i].canvas.height = prop.canvas.size.height;
        prop.canvas.contexts[i].canvas.width = prop.canvas.size.width;
    }

    prop.canvas.dirty = true;
    canvas_adjust_hidpi();
}

function canvas_add(name) {
    $(SELECTORS.DOM_SELECTORS.CANVASES).append(`<canvas id='${name}-canvas'></canvas>`);
    prop.canvas.contexts[name] = $(`#${name}-canvas`).get(0).getContext('2d');
}

function canvas_get(name) {
    return prop.canvas.contexts[name];
}

function canvas_clear(cc) {
    cc.clearRect(0, 0, prop.canvas.size.width, prop.canvas.size.height);
}

function canvas_should_draw() {
    const elapsed = time() - prop.canvas.last;

    if (elapsed > (1 / prop.game.speedup)) {
        prop.canvas.last = time();
        return true;
    }

    return false;
}

// DRAW
function canvas_draw_runway(cc, runway, mode) {
    const length2 = round(window.uiController.km_to_px(runway.length / 2));
    const angle = runway.angle;

    cc.translate(
        round(window.uiController.km_to_px(runway.position[0])) + prop.canvas.panX,
        -round(window.uiController.km_to_px(runway.position[1])) + prop.canvas.panY
    );
    cc.rotate(angle);

    // runway body
    if (!mode) {
        cc.strokeStyle = '#899';
        cc.lineWidth = 2.8;

        cc.beginPath();
        cc.moveTo(0, 0);
        cc.lineTo(0, -2 * length2);
        cc.stroke();
    } else {
        // extended centerlines
        if (!runway.ils.enabled) {
            return;
        }

        cc.strokeStyle = '#465';
        cc.lineWidth = 1;

        cc.beginPath();
        cc.moveTo(0, 0);
        cc.lineTo(0, window.uiController.km_to_px(runway.ils.loc_maxDist));
        cc.stroke();
    }
}

function canvas_draw_runway_label(cc, runway) {
    const length2 = round(window.uiController.km_to_px(runway.length / 2)) + 0.5;
    const angle = runway.angle;
    const text_height = 14;

    cc.translate(round(window.uiController.km_to_px(runway.position[0])) + prop.canvas.panX, -round(window.uiController.km_to_px(runway.position[1])) + prop.canvas.panY);
    cc.rotate(angle);

    cc.textAlign = 'center';
    cc.textBaseline = 'middle';

    cc.save();
    cc.translate(0, length2 + text_height);
    cc.rotate(-angle);
    cc.translate(round(window.uiController.km_to_px(runway.labelPos[0])), -round(window.uiController.km_to_px(runway.labelPos[1])));
    cc.fillText(runway.name, 0, 0);
    cc.restore();
}

function canvas_draw_runways(cc) {
    if (!prop.canvas.draw_labels) {
        return;
    }

    cc.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    cc.fillStyle = 'rgba(255, 255, 255, 0.4)';
    cc.lineWidth = 4;

    const airport = window.airportController.airport_get();

    // Extended Centerlines
    for (let i = 0; i < airport.runways.length; i++) {
        cc.save();
        canvas_draw_runway(cc, airport.runways[i][0], true);
        cc.restore();

        cc.save();
        canvas_draw_runway(cc, airport.runways[i][1], true);
        cc.restore();
    }

    // Runways
    for (let i = 0; i < airport.runways.length; i++) {
        cc.save();
        canvas_draw_runway(cc, airport.runways[i][0], false);
        cc.restore();
    }
}

function canvas_draw_runway_labels(cc) {
    if (!prop.canvas.draw_labels) {
        return;
    }

    cc.fillStyle = 'rgba(255, 255, 255, 0.8)';

    const airport = window.airportController.airport_get();
    for (let i = 0; i < airport.runways.length; i++) {
        cc.save();
        canvas_draw_runway_label(cc, airport.runways[i][0]);
        cc.restore();
        cc.save();
        canvas_draw_runway_label(cc, airport.runways[i][1]);
        cc.restore();
    }
}

function canvas_draw_scale(cc) {
    cc.fillStyle = 'rgba(255, 255, 255, 0.8)';
    cc.strokeStyle = 'rgba(255, 255, 255, 0.8)';

    const offset = 10;
    const height = 5;
    const length = round(1 / prop.ui.scale * 50);
    const px_length = round(window.uiController.km_to_px(length));

    cc.translate(0.5, 0.5);

    cc.lineWidth = 1;
    cc.moveTo(prop.canvas.size.width - offset, offset);
    cc.lineTo(prop.canvas.size.width - offset, offset + height);
    cc.lineTo(prop.canvas.size.width - offset - px_length, offset + height);
    cc.lineTo(prop.canvas.size.width - offset - px_length, offset);
    cc.stroke();

    cc.translate(-0.5, -0.5);

    cc.textAlign = 'center';
    cc.fillText(`${length} km`, prop.canvas.size.width - offset - px_length * 0.5, offset + height + 17);
}

function canvas_draw_fix(cc, name, fix) {
    cc.beginPath();
    cc.moveTo(0, -5);
    cc.lineTo(4, 3);
    cc.lineTo(-4, 3);
    cc.closePath();
    cc.fill();
    cc.stroke();

    cc.textAlign = 'center';
    cc.textBaseline = 'top';
    cc.strokeText(name, 0, 6);
    cc.fillText(name, 0, 6);
}

function canvas_draw_fixes(cc) {
    if (!prop.canvas.draw_labels) {
        return;
    }

    cc.lineJoin = 'round';
    cc.font = BASE_CANVAS_FONT;

    const airport = window.airportController.airport_get();
    for (const i in airport.real_fixes) {
        cc.save();
        cc.translate(
            round(window.uiController.km_to_px(airport.fixes[i].position[0])) + prop.canvas.panX,
            -round(window.uiController.km_to_px(airport.fixes[i].position[1])) + prop.canvas.panY
        );

        // draw outline (draw with eraser)
        cc.strokeStyle = 'rgba(0, 0, 0, 0.67)';
        cc.fillStyle = 'rgba(0, 0, 0, 0.67)';
        cc.globalCompositeOperation = 'destination-out';
        cc.lineWidth = 4;

        canvas_draw_fix(cc, i, airport.fixes[i].position);

        cc.strokeStyle = 'rgba(255, 255, 255, 0)';
        cc.fillStyle = 'rgba(255, 255, 255, 0.5)';
        cc.globalCompositeOperation = 'source-over';
        cc.lineWidth = 1;

        canvas_draw_fix(cc, i, airport.fixes[i].position);
        cc.restore();
    }
}

function canvas_draw_sids(cc) {
    if (!prop.canvas.draw_sids) {
        return;
    }

    // Store the count of sid text drawn for a specific transition
    const text_at_point = [];
    const departure_colour = 'rgba(128, 255, 255, 0.6)';

    cc.strokeStyle = departure_colour;
    cc.fillStyle = departure_colour;
    cc.setLineDash([1, 10]);
    cc.font = 'italic 14px monoOne, monospace';

    const airport = window.airportController.airport_get();

    for (const s in airport.sids) {
        let write_sid_name = true;
        let fx = null;
        let fy = null;

        // TODO: this if should be reversed to check for the opposite condition and return early.
        if (_has(airport.sids[s], 'draw')) {
            for (const i in airport.sids[s].draw) {
                const fixList = airport.sids[s].draw[i];
                let exit_name = null;

                for (let j = 0; j < fixList.length; j++) {
                    // write exitPoint name
                    if (fixList[j].indexOf('*') !== -1) {
                        exit_name = fixList[j].replace('*', '');
                        write_sid_name = false;
                    }

                    let fix = airport.getFix(fixList[j].replace('*', ''));

                    if (!fix) {
                        log(`Unable to draw line to '${fixList[j]}' because its position is not defined!`, LOG.WARNING);
                    }

                    fx = window.uiController.km_to_px(fix[0]) + prop.canvas.panX;
                    fy = -window.uiController.km_to_px(fix[1]) + prop.canvas.panY;

                    if (j === 0) {
                        cc.beginPath();
                        cc.moveTo(fx, fy);
                    } else {
                        cc.lineTo(fx, fy);
                    }
                }

                cc.stroke();

                if (exit_name) {
                    if (isNaN(text_at_point[exit_name])) {  // Initialize count for this transition
                        text_at_point[exit_name] = 0;
                    }

                    const y_point = fy + (15 * text_at_point[exit_name]);  // Move the y point for drawing depending on how many sids we have drawn text for at this point already
                    cc.fillText(`${s}.${exit_name}`, fx + 10, y_point);

                    text_at_point[exit_name] += 1;  // Increment the count for this transition
                }
            }

            if (write_sid_name) {
                cc.fillText(s, fx + 10, fy);
            }
        }
    }
}

function canvas_draw_separation_indicator(cc, aircraft) {
    // Draw a trailing indicator 2.5 NM (4.6km) behind landing aircraft to help with traffic spacing
    const rwy = window.airportController.airport_get().getRunway(aircraft.fms.currentWaypoint().runway);

    if (!rwy) {
        return;
    }

    const angle = rwy.angle + Math.PI;

    cc.strokeStyle = 'rgba(224, 128, 128, 0.8)';
    cc.lineWidth = 3;
    cc.translate(
        window.uiController.km_to_px(aircraft.position[0]) + prop.canvas.panX,
        -window.uiController.km_to_px(aircraft.position[1]) + prop.canvas.panY
    );
    cc.rotate(angle);
    cc.beginPath();
    cc.moveTo(-5, -window.uiController.km_to_px(5.556));  // 5.556km = 3.0nm
    cc.lineTo(+5, -window.uiController.km_to_px(5.556));  // 5.556km = 3.0nm
    cc.stroke();
}

function canvas_draw_aircraft_rings(cc, aircraft) {
    cc.save();

    if (aircraft.hasAlerts()[0]) {
        if (aircraft.hasAlerts()[1]) {
            // red violation circle
            cc.strokeStyle = 'rgba(224, 128, 128, 1.0)';
        } else {
            // white warning circle
            cc.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        }
    } else {
        cc.strokeStyle = cc.fillStyle;
    }

    cc.beginPath();
    cc.arc(0, 0, window.uiController.km_to_px(km(3)), 0, tau());  // 3nm RADIUS
    cc.stroke();
    cc.restore();
}

function canvas_draw_aircraft_departure_window(cc, aircraft) {
    cc.save();
    cc.strokeStyle = 'rgba(128, 255, 255, 0.9)';

    cc.beginPath();

    const angle = aircraft.destination - Math.PI / 2;
    cc.arc(
        prop.canvas.panX,
        prop.canvas.panY,
        window.uiController.km_to_px(window.airportController.airport_get().ctr_radius),
        angle - 0.08726,
        angle + 0.08726);
    cc.stroke();
    cc.restore();
}

function canvas_draw_aircraft(cc, aircraft) {
    let almost_match = false;
    let match = false;

    if (
        prop.input.callsign.length > 1 &&
        aircraft.matchCallsign(prop.input.callsign.substr(0, prop.input.callsign.length - 1))
    ) {
        almost_match = true;
    }

    if (prop.input.callsign.length > 0 && aircraft.matchCallsign(prop.input.callsign)) {
        match = true;
    }

    if (match && (aircraft.destination != null)) {
        canvas_draw_aircraft_departure_window(cc, aircraft);
    }

    if (!aircraft.isVisible()) {
        return;
    }

    const size = 3;
    // Trailling
    let trailling_length = 12;
    const dpr = window.devicePixelRatio || 1;

    if (dpr > 1) {
        trailling_length *= round(dpr);
    }

    cc.save();

    if (!aircraft.inside_ctr) {
        cc.fillStyle = 'rgb(224, 224, 224)';
    } else {
        cc.fillStyle = 'rgb(255, 255, 255)';
    }

    const length = aircraft.position_history.length;
    for (let i = 0; i < length; i++) {
        if (!aircraft.inside_ctr) {
            cc.globalAlpha = 0.3 / (length - i);
        } else {
            cc.globalAlpha = 1 / (length - i);
            cc.fillRect(
                window.uiController.km_to_px(aircraft.position_history[i][0]) + prop.canvas.panX - 1,
                -window.uiController.km_to_px(aircraft.position_history[i][1]) + prop.canvas.panY - 1,
                2,
                2
            );
        }
    }

    cc.restore();

    if (aircraft.position_history.length > trailling_length) {
        aircraft.position_history = aircraft.position_history.slice(aircraft.position_history.length - trailling_length, aircraft.position_history.length);
    }

    if (aircraft.isPrecisionGuided()) {
        cc.save();
        canvas_draw_separation_indicator(cc, aircraft);
        cc.restore();
    }

    // TODO: if all these parens are actally needed, abstract this out to a function that can return a bool.
    // Aircraft
    // Draw the future path
    if ((prop.game.option.get('drawProjectedPaths') === 'always') ||
      ((prop.game.option.get('drawProjectedPaths') === 'selected') &&
       ((aircraft.warning || match) && !aircraft.isTaxiing()))
    ) {
        canvas_draw_future_track(cc, aircraft);
    }

    const alerts = aircraft.hasAlerts();

    if (!aircraft.inside_ctr) {
        cc.fillStyle = 'rgba(224, 224, 224, 0.3)';
    } else if (almost_match) {
        cc.fillStyle = 'rgba(224, 210, 180, 1.0)';
    } else if (match) {
        cc.fillStyle = 'rgba(255, 255, 255, 1.0)';
    } else if (aircraft.warning || alerts[1]) {
        cc.fillStyle = 'rgba(224, 128, 128, 1.0)';
    } else if (aircraft.hit) {
        cc.fillStyle = 'rgba(255, 64, 64, 1.0)';
    } else {
        cc.fillStyle = 'rgba(224, 224, 224, 1.0)';
    }

    cc.strokeStyle = cc.fillStyle;

    if (match) {
        cc.save();

        if (!aircraft.inside_ctr) {
            cc.fillStyle = 'rgba(255, 255, 255, 0.3)';
        } else {
            cc.fillStyle = 'rgba(255, 255, 255, 1.0)';
        }

        const w = prop.canvas.size.width / 2;
        const h = prop.canvas.size.height / 2;

        cc.translate(
            _clamp(-w, window.uiController.km_to_px(aircraft.position[0]) + prop.canvas.panX, w),
            _clamp(-h, -window.uiController.km_to_px(aircraft.position[1]) + prop.canvas.panY, h)
        );

        cc.beginPath();
        cc.arc(0, 0, round(size * 1.5), 0, tau());
        cc.fill();

        cc.restore();
    }

    cc.translate(
        window.uiController.km_to_px(aircraft.position[0]) + prop.canvas.panX,
        -window.uiController.km_to_px(aircraft.position[1]) + prop.canvas.panY
    );

    if (!aircraft.hit) {
        cc.save();

        let tail_length = aircraft.groundSpeed / 15;
        if (match) {
            tail_length = 15;
        }

        const angle = aircraft.groundTrack;
        const end = vscale(vturn(angle), tail_length);

        cc.beginPath();
        cc.moveTo(0, 0);
        cc.lineTo(end[0], -end[1]);
        cc.stroke();
        cc.restore();
    }

    if (aircraft.notice || alerts[0]) {
        canvas_draw_aircraft_rings(cc, aircraft);
    }

    cc.beginPath();
    cc.arc(0, 0, size, 0, tau());
    cc.fill();
}

// Draw dashed line from last coordinate of future track through
// any later requested fixes.
function canvas_draw_future_track_fixes(cc, aircraft, future_track) {
    if (aircraft.fms.waypoints.length < 1) {
        return;
    }

    const start = future_track.length - 1;
    const x = window.uiController.km_to_px(future_track[start][0]) + prop.canvas.panX;
    const y = -window.uiController.km_to_px(future_track[start][1]) + prop.canvas.panY;

    cc.beginPath();
    cc.moveTo(x, y);
    cc.setLineDash([3, 10]);

    for (let i = 0; i < aircraft.fms.waypoints.length; i++) {
        if (!aircraft.fms.waypoints[i].location) {
            break;
        }

        const fix = aircraft.fms.waypoints[i].location;
        const fx = window.uiController.km_to_px(fix[0]) + prop.canvas.panX;
        const fy = -window.uiController.km_to_px(fix[1]) + prop.canvas.panY;

        cc.lineTo(fx, fy);
    }

    cc.stroke();
}

// Run physics updates into the future, draw future track
function canvas_draw_future_track(cc, aircraft) {
    const fms_twin = $.extend(true, {}, aircraft.fms);
    let twin = $.extend(true, {}, aircraft);

    twin.fms = fms_twin;
    twin.fms.aircraft = twin;
    twin.projected = true;

    const save_delta = prop.game.delta;

    prop.game.delta = 5;
    const future_track = [];
    let ils_locked;

    for (let i = 0; i < 60; i++) {
        twin.update();

        ils_locked = twin.fms.currentWaypoint().runway &&
            twin.category === FLIGHT_MODES.ARRIVAL &&
            twin.mode === FLIGHT_MODES.LANDING;

        future_track.push([twin.position[0], twin.position[1], ils_locked]);

        if (ils_locked && twin.altitude < 500) {
            break;
        }
    }

    prop.game.delta = save_delta;
    cc.save();

    let lockedStroke;
    if (aircraft.category === FLIGHT_CATEGORY.DEPARTURE) {
        cc.strokeStyle = 'rgba(128, 255, 255, 0.6)';
    } else {
        cc.strokeStyle = 'rgba(224, 128, 128, 0.6)';
        lockedStroke = 'rgba(224, 128, 128, 1.0)';
    }

    cc.globalCompositeOperation = 'screen';

    cc.lineWidth = 2;
    cc.beginPath();

    let was_locked = false;
    for (let i = 0; i < future_track.length; i++) {
        ils_locked = future_track[i][2];
        const x = window.uiController.km_to_px(future_track[i][0]) + prop.canvas.panX;
        const y = -window.uiController.km_to_px(future_track[i][1]) + prop.canvas.panY;

        if (ils_locked && !was_locked) {
            cc.lineTo(x, y);
            // end the current path, start a new path with lockedStroke
            cc.stroke();
            cc.strokeStyle = lockedStroke;
            cc.lineWidth = 3;
            cc.beginPath();
            cc.moveTo(x, y);

            was_locked = true;

            continue;
        }

        if (i === 0) {
            cc.moveTo(x, y);
        } else {
            cc.lineTo(x, y);
        }
    }

    cc.stroke();
    canvas_draw_future_track_fixes(cc, twin, future_track);
    cc.restore();
}

function canvas_draw_all_aircraft(cc) {
    cc.fillStyle = 'rgba(224, 224, 224, 1.0)';
    cc.strokeStyle = 'rgba(224, 224, 224, 1.0)';
    cc.lineWidth = 2;

    // console.time('canvas_draw_all_aircraft')
    for (let i = 0; i < prop.aircraft.list.length; i++) {
        cc.save();
        canvas_draw_aircraft(cc, prop.aircraft.list[i]);
        cc.restore();
    }
    // console.timeEnd('canvas_draw_all_aircraft')
}

/** Draw an aircraft's data block
 ** (box that contains callsign, altitude, speed)
 */
function canvas_draw_info(cc, aircraft) {
    if (!aircraft.isVisible()) {
        return;
    }

    // TODO: flip the logic here and return early to make code more readable.
    if (!aircraft.hit) {
        // Initial Setup
        cc.save();

        const cs = aircraft.getCallsign();
        const paddingLR = 5;
        // width of datablock (scales to fit callsign)
        const width = _clamp(1, 5.8 * cs.length) + (paddingLR * 2);
        const width2 = width / 2;
        // height of datablock
        const height = 31;
        const height2 = height / 2;
        // width of colored bar
        const bar_width = width / 18;
        const bar_width2 = bar_width / 2;
        const ILS_enabled = aircraft.fms.currentWaypoint().runway && aircraft.category === FLIGHT_CATEGORY.ARRIVAL;
        const lock_size = height / 3;
        const lock_offset = lock_size / 8;
        const pi = Math.PI;
        const point1 = lock_size - bar_width2;
        let alt_trend_char = '';
        const a = point1 - lock_offset;
        const b = bar_width2;
        const clipping_mask_angle = Math.atan(b / a);
        // describes how far around to arc the arms of the ils lock case
        const pi_slice = pi / 24;
        let match = false;
        let almost_match = false;

        // Callsign Matching
        if (prop.input.callsign.length > 1 && aircraft.matchCallsign(prop.input.callsign.substr(0, prop.input.callsign.length - 1))) {
            almost_match = true;
        }

        if (prop.input.callsign.length > 0 && aircraft.matchCallsign(prop.input.callsign)) {
            match = true;
        }

        // set color, intensity, and style elements
        let alpha = 0.2;
        if (match) {
            alpha = 0.9;
        } else if (aircraft.inside_ctr) {
            // else if (almost_match) var alpha = 0.75;
            alpha = 0.5;
        }

        const red = `rgba(224, 128, 128, ${alpha})`;
        const green = `rgba( 76, 118,  97, ${alpha})`;
        const blue = `rgba(128, 255, 255, ${alpha})`;
        const white = `rgba(255, 255, 255, ${alpha})`;
        cc.textBaseline = 'middle';

        // Move to center of where the data block is to be drawn
        const ac_pos = [
            round(window.uiController.km_to_px(aircraft.position[0])) + prop.canvas.panX,
            -round(window.uiController.km_to_px(aircraft.position[1])) + prop.canvas.panY
        ];

        // game will move FDB to the appropriate position
        if (aircraft.datablockDir === -1) {
            if (-window.uiController.km_to_px(aircraft.position[1]) + prop.canvas.size.height / 2 < height * 1.5) {
                cc.translate(ac_pos[0], ac_pos[1] + height2 + 12);
            } else {
                cc.translate(ac_pos[0], ac_pos[1] - height2 - 12);
            }
        } else {
            // user wants to specify FDB position
            const displacements = {
                ctr: [0, 0],
                360: [0, -height2 - 12],
                45: [width2 + 8.5, -height2 - 8.5],
                90: [width2 + bar_width2 + 12, 0],
                135: [width2 + 8.5, height2 + 8.5],
                180: [0, height2 + 12],
                225: [-width2 - 8.5, height2 + 8.5],
                270: [-width2 - bar_width2 - 12, 0],
                315: [-width2 - 8.5, -height2 - 8.5]
            };

            cc.translate(
                ac_pos[0] + displacements[aircraft.datablockDir][0],
                ac_pos[1] + displacements[aircraft.datablockDir][1]
            );
        }

        // Draw datablock shapes
        if (!ILS_enabled) {
            // Standard Box
            cc.fillStyle = green;
            // Draw box
            cc.fillRect(-width2, -height2, width, height);
            cc.fillStyle = (aircraft.category === FLIGHT_CATEGORY.DEPARTURE) ? blue : red;
            // Draw colored bar
            cc.fillRect(-width2 - bar_width, -height2, bar_width, height);
        } else {
            // Box with ILS Lock Indicator
            cc.save();

            // Draw green part of box (excludes space where ILS Clearance Indicator juts in)
            cc.fillStyle = green;
            cc.beginPath();
            cc.moveTo(-width2, height2);  // bottom-left corner
            cc.lineTo(width2, height2);   // bottom-right corner
            cc.lineTo(width2, -height2);  // top-right corner
            cc.lineTo(-width2, -height2); // top-left corner
            cc.lineTo(-width2, -point1);  // begin side cutout
            cc.arc(-width2 - bar_width2, -lock_offset, lock_size / 2 + bar_width2, clipping_mask_angle - pi / 2, 0);
            cc.lineTo(-width2 + lock_size / 2, lock_offset);
            cc.arc(-width2 - bar_width2, lock_offset, lock_size / 2 + bar_width2, 0, pi / 2 - clipping_mask_angle);
            cc.closePath();
            cc.fill();

            // Draw ILS Clearance Indicator
            cc.translate(-width2 - bar_width2, 0);
            cc.lineWidth = bar_width;
            cc.strokeStyle = red;
            cc.beginPath(); // top arc start
            cc.arc(0, -lock_offset, lock_size / 2, -pi_slice, pi + pi_slice, true);
            cc.moveTo(0, -lock_size / 2);
            cc.lineTo(0, -height2);
            cc.stroke(); // top arc end
            cc.beginPath(); // bottom arc start
            cc.arc(0, lock_offset, lock_size / 2, pi_slice, pi - pi_slice);
            cc.moveTo(0, lock_size - bar_width);
            cc.lineTo(0, height2);
            cc.stroke();  // bottom arc end

            if (aircraft.mode === FLIGHT_MODES.LANDING) {
                // Localizer Capture Indicator
                cc.fillStyle = white;
                cc.beginPath();
                cc.arc(0, 0, lock_size / 5, 0, pi * 2);
                cc.fill(); // Draw Localizer Capture Dot
            }

            cc.translate(width2 + bar_width2, 0);
            // unclear how this works...
            cc.beginPath(); // if removed, white lines appear on top of bottom half of lock case
            cc.stroke(); // if removed, white lines appear on top of bottom half of lock case

            cc.restore();
        }

        // Text
        const gap = 3;          // height of TOTAL vertical space between the rows (0 for touching)
        const lineheight = 4.5; // height of text row (used for spacing basis)
        const row1text = cs;
        const row2text = `${lpad(round(aircraft.altitude * 0.01), 3)} ${lpad(round(aircraft.groundSpeed * 0.1), 2)}`;

        if (aircraft.inside_ctr) {
            cc.fillStyle = 'rgba(255, 255, 255, 0.8)';
        } else {
            cc.fillStyle = 'rgba(255, 255, 255, 0.2)';
        }

        if (aircraft.trend === 0) {
            // small dash (symbola font)
            alt_trend_char = String.fromCodePoint(0x2011);
        } else if (aircraft.trend > 0) {
            alt_trend_char = String.fromCodePoint(0x1F851); // up arrow (symbola font)
        } else if (aircraft.trend < 0) {
            alt_trend_char = String.fromCodePoint(0x1F853); // down arrow (symbola font)
        }

        // Draw full datablock text
        cc.textAlign = 'left';
        cc.fillText(row1text, -width2 + paddingLR, -gap / 2 - lineheight);
        cc.fillText(row2text, -width2 + paddingLR, gap / 2 + lineheight);
        // Draw climb/level/descend symbol
        cc.font = '10px symbola'; // change font to the one with extended unicode characters
        cc.textAlign = 'center';
        cc.fillText(alt_trend_char, -width2 + paddingLR + 20.2, gap / 2 + lineheight - 0.25);
        cc.font = BASE_CANVAS_FONT;  // change back to normal font

        cc.restore();
    }
}

function canvas_draw_all_info(cc) {
    for (let i = 0; i < prop.aircraft.list.length; i++) {
        cc.save();
        canvas_draw_info(cc, prop.aircraft.list[i]);
        cc.restore();
    }
}

function canvas_draw_compass(cc) {
    cc.translate(
        round(prop.canvas.size.width / 2),
        round(prop.canvas.size.height / 2)
    );

    const airport = window.airportController.airport_get();
    const size = 80;
    const size2 = size / 2;
    const padding = 16;
    const dot = 16;
    let windspeed_line;
    let highwind;

    // Shift compass location
    cc.translate(-size2 - padding, -size2 - padding);
    cc.lineWidth = 4;

    // Outer circle
    cc.fillStyle = 'rgba(0, 0, 0, 0.7)';
    cc.beginPath();
    cc.arc(0, 0, size2, 0, tau());
    cc.fill();

    // Inner circle
    cc.lineWidth = 1;
    cc.beginPath();
    cc.arc(0, 0, dot / 2, 0, tau());
    cc.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    cc.stroke();

    // Wind Value
    cc.fillStyle = 'rgba(255, 255, 255, 0.7)';
    cc.textAlign = 'center';
    cc.textBaseline = 'center';
    cc.font = '9px monoOne, monospace';
    cc.fillText(airport.wind.speed, 0, 3.8);
    cc.font = 'bold 10px monoOne, monospace';

    // Wind line
    if (airport.wind.speed > 8) {
        windspeed_line = airport.wind.speed / 2;
        highwind = true;
    } else {
        windspeed_line = airport.wind.speed;
        highwind = false;
    }

    cc.save();
    cc.translate(-dot / 2 * sin(airport.wind.angle), dot / 2 * cos(airport.wind.angle));
    cc.beginPath();
    cc.moveTo(0, 0);
    cc.rotate(airport.wind.angle);
    cc.lineTo(0, crange(0, windspeed_line, 15, 0, size2 - dot));

    // Color wind line red for high-wind
    if (highwind) {
        cc.strokeStyle = 'rgba(255, 0, 0, 0.7)';
    } else {
        cc.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    }

    cc.lineWidth = 2;
    cc.stroke();
    cc.restore();
    cc.fillStyle = 'rgba(255, 255, 255, 0.7)';
    cc.textAlign = 'center';
    cc.textBaseline = 'top';

    for (let i = 90; i <= 360; i += 90) {
        cc.rotate(degreesToRadians(90));

        let angle;
        if (i === 90) {
            angle = `0${i}`;
        } else {
            angle = i;
        }

        cc.save();
        cc.fillText(angle, 0, -size2 + 4);
        cc.restore();
    }
}

/**
 * Draw circular airspace border
 */
function canvas_draw_ctr(cc) {
    // Draw a gentle fill color with border within the bounds of the airport's ctr_radius
    cc.fillStyle = 'rgba(200, 255, 200, 0.02)';
    cc.strokeStyle = 'rgba(200, 255, 200, 0.25)';
    cc.beginPath();
    cc.arc(0, 0, window.airportController.airport_get().ctr_radius * prop.ui.scale, 0, tau());
    cc.fill();
    cc.stroke();
}

/**
 * Draw polygonal airspace border
 */
function canvas_draw_airspace_border(cc) {
    const airport = window.airportController.airport_get();
    if (!airport.airspace) {
        canvas_draw_ctr(cc);
    }

    // style
    cc.strokeStyle = 'rgba(200, 255, 200, 0.25)';
    cc.fillStyle = 'rgba(200, 255, 200, 0.02)';

    // draw airspace
    for (let i = 0; i < airport.airspace.length; i++) {
        const poly = $.map(airport.perimeter.poly, (v) => {
            // TODO: this seems strange. are we returning a single-index array everytime? what does v.position look like?
            return [v.position];
        });

        canvas_draw_poly(cc, poly);
        cc.clip();
    }
}

function canvas_draw_fancy_rings(cc, fix_origin, fix1, fix2) {
    const airport = window.airportController.airport_get();
    const origin = airport.getFix(fix_origin);
    const f1 = airport.getFix(fix1);
    const f2 = airport.getFix(fix2);
    const minDist = Math.min(distance2d(origin, f1), distance2d(origin, f2));
    const halfPI = Math.PI / 2;
    const extend_ring = degreesToRadians(10);
    const start_angle = Math.atan2(f1[0] - origin[0], f1[1] - origin[1]) - halfPI - extend_ring;
    const end_angle = Math.atan2(f2[0] - origin[0], f2[1] - origin[1]) - halfPI + extend_ring;
    const x = round(window.uiController.km_to_px(origin[0])) + prop.canvas.panX;
    const y = -round(window.uiController.km_to_px(origin[1])) + prop.canvas.panY;
    // 5NM = 9.27km
    const radius = 9.27;

    for (let i = 0; i < 4; i++) {
        cc.beginPath();
        cc.arc(
            x,
            y,
            window.uiController.km_to_px(minDist - (i*radius)),
            start_angle, end_angle
        );

        cc.stroke();
    }
}

// Draw range rings for ENGM airport to assist in point merge
function canvas_draw_engm_range_rings(cc) {
    cc.strokeStyle = 'rgba(200, 255, 200, 0.3)';
    cc.setLineDash([3, 6]);

    canvas_draw_fancy_rings(cc, 'BAVAD', 'GM428', 'GM432');
    canvas_draw_fancy_rings(cc, 'TITLA', 'GM418', 'GM422');
    canvas_draw_fancy_rings(cc, 'INSUV', 'GM403', 'GM416');
    canvas_draw_fancy_rings(cc, 'VALPU', 'GM410', 'GM402');
}

function canvas_draw_range_rings(cc) {
    const airport = window.airportController.airport_get();
    // convert input param from nm to km
    const rangeRingRadius = km(airport.rr_radius_nm);

    // Fill up airport's ctr_radius with rings of the specified radius
    for (let i = 1; i * rangeRingRadius < airport.ctr_radius; i++) {
        cc.beginPath();
        cc.linewidth = 1;
        cc.arc(0, 0, rangeRingRadius * prop.ui.scale * i, 0, tau());
        cc.strokeStyle = 'rgba(200, 255, 200, 0.1)';
        cc.stroke();
    }
}

function canvas_draw_poly(cc, poly) {
    cc.beginPath();

    for (const v in poly) {
        cc.lineTo(
            window.uiController.km_to_px(poly[v][0]),
            -window.uiController.km_to_px(poly[v][1])
        );
    }

    cc.closePath();
    cc.stroke();
    cc.fill();
}

function canvas_draw_terrain(cc) {
    if (!prop.canvas.draw_terrain) {
        return;
    }

    cc.strokeStyle = 'rgba(255,255,255,.4)';
    cc.fillStyle = 'rgba(255,255,255,.2)';
    cc.lineWidth = _clamp(0.5, (prop.ui.scale / 10), 2);
    cc.lineJoin = 'round';

    const airport = window.airportController.airport_get();
    let max_elevation = 0;

    cc.save();
    cc.translate(prop.canvas.panX, prop.canvas.panY);

    $.each(airport.terrain || [], (elevation, terrainLevel) => {
        max_elevation = Math.max(max_elevation, elevation);
        const color = 'rgba(' + prop.ui.terrain.colors[elevation] + ', ';

        cc.strokeStyle = color + prop.ui.terrain.border_opacity + ')';
        cc.fillStyle = color + prop.ui.terrain.fill_opacity + ')';

        _forEach(terrainLevel, (terrainGroup) => {
            cc.beginPath();

            _forEach(terrainGroup, (terrainItem) => {
                // TODO: should this be a for/in? is it an array?
                _forEach(terrainItem, (value, index) => {
                    // Loose equals is important here.
                    if (index === 0) {
                        cc.moveTo(window.uiController.km_to_px(terrainItem[index][0]), -window.uiController.km_to_px(terrainItem[index][1]));
                    }

                    cc.lineTo(window.uiController.km_to_px(terrainItem[index][0]), -window.uiController.km_to_px(terrainItem[index][1]));
                });

                cc.closePath();
            });

            cc.fill();
            cc.stroke();
        });
    });

    cc.restore();

    if (max_elevation === 0) {
        return;
    }

    const offset = 10;
    const width = prop.canvas.size.width;
    const height = prop.canvas.size.height;
    const box_width = 30;
    const box_height = 5;

    cc.font = BASE_CANVAS_FONT;
    cc.lineWidth = 1;

    for (let i = 1000; i <= max_elevation; i += 1000) {
        cc.save();
        // translate coordinates for every block to not use these X & Y twice in rect and text
        // .5 in X and Y coordinates are used to make 1px rectangle fit exactly into 1 px
        // and not be blurred
        cc.translate(
            width / 2 - 140.5 - (max_elevation - i) / 1000 * (box_width + 1),
            -height / 2 + offset + 0.5
        );
        cc.beginPath();
        cc.rect(0, 0, box_width - 1, box_height);
        cc.closePath();

        // in the map, terrain of higher levels has fill of all the lower levels
        // so we need to fill it below exactly as in the map
        for (let j = 0; j <= i; j += 1000) {
            cc.fillStyle = 'rgba(' + prop.ui.terrain.colors[j] + ', ' + prop.ui.terrain.fill_opacity + ')';
            cc.fill();
        }

        cc.strokeStyle = 'rgba(' + prop.ui.terrain.colors[i] + ', ' + prop.ui.terrain.border_opacity + ')';
        cc.stroke();

        // write elevation signs only for the outer elevations
        if (i === max_elevation || i === 1000) {
            cc.fillStyle = '#fff';
            cc.textAlign = 'center';
            cc.textBaseline = 'top';
            cc.fillText(`${i}'`, box_width / 2 + .5, offset + 2);
        }

        cc.restore();
    }
}

function canvas_draw_restricted(cc) {
    if (!prop.canvas.draw_restricted) {
        return;
    }

    cc.strokeStyle = 'rgba(150, 200, 255, 0.3)';
    cc.lineWidth = Math.max(prop.ui.scale / 3, 2);
    cc.lineJoin = 'round';
    cc.font = BASE_CANVAS_FONT;

    const airport = window.airportController.airport_get();

    cc.save();
    cc.translate(prop.canvas.panX, prop.canvas.panY);

    for (const i in airport.restricted_areas) {
        const area = airport.restricted_areas[i];

        cc.fillStyle = 'transparent';
        canvas_draw_poly(cc, area.coordinates);

        cc.fillStyle = 'rgba(150, 200, 255, .4)';
        cc.textAlign = 'center';
        cc.textBaseline = 'top';

        const height = (area.height === Infinity ? 'UNL' : 'FL' + Math.ceil(area.height / 1000) * 10);
        let height_shift = 0;

        if (area.name) {
            height_shift = -12;
            cc.fillText(area.name, round(window.uiController.km_to_px(area.center[0])), - round(window.uiController.km_to_px(area.center[1])));
        }

        cc.fillText(height, round(window.uiController.km_to_px(area.center[0])), height_shift - round(window.uiController.km_to_px(area.center[1])));
    }

    cc.restore();
}

function canvas_draw_videoMap(cc) {
    if (!window.airportController.airport_get().hasOwnProperty('maps')) {
        return;
    }

    cc.strokeStyle = '#c1dacd';
    cc.lineWidth = prop.ui.scale / 15;
    cc.lineJoin = 'round';
    cc.font = BASE_CANVAS_FONT;

    const airport = window.airportController.airport_get();
    const map = airport.maps.base;

    cc.save();
    cc.translate(prop.canvas.panX, prop.canvas.panY);

    for (const i in map) {
        cc.moveTo(window.uiController.km_to_px(map[i][0]), -window.uiController.km_to_px(map[i][1]));
        // cc.beginPath();
        cc.lineTo(window.uiController.km_to_px(map[i][2]), -window.uiController.km_to_px(map[i][3]));
    }

    cc.stroke();
    cc.restore();
}

/** Draws crosshairs that point to the currently translated location
 */
function canvas_draw_crosshairs(cc) {
    cc.save();
    cc.strokeStyle = '#899';
    cc.lineWidth = 3;
    cc.beginPath();
    cc.moveTo(-10, 0);
    cc.lineTo(10, 0);
    cc.stroke();
    cc.beginPath();
    cc.moveTo(0, -10);
    cc.lineTo(0, 10);
    cc.stroke();
    cc.restore();
}

window.canvas_update_post = function canvas_update_post() {
    let elapsed = window.gameController.game_time() - window.window.airportController.airport_get().start;
    let alpha = crange(0.1, elapsed, 0.4, 0, 1);
    let framestep = Math.round(crange(1, prop.game.speedup, 10, 30, 1));

    if (prop.canvas.dirty || (!window.gameController.game_paused() && prop.time.frames % framestep === 0) || elapsed < 1) {
        const cc = canvas_get('navaids');
        const fading = elapsed < 1;

        cc.font = '11px monoOne, monospace';

        if (prop.canvas.dirty || fading || true) {
            cc.save();

            canvas_clear(cc);
            cc.translate(round(prop.canvas.size.width / 2), round(prop.canvas.size.height / 2));

            cc.save();
            cc.globalAlpha = alpha;
            canvas_draw_videoMap(cc);
            canvas_draw_terrain(cc);
            canvas_draw_restricted(cc);
            canvas_draw_runways(cc);
            cc.restore();

            cc.save();
            cc.globalAlpha = alpha;
            canvas_draw_fixes(cc);
            canvas_draw_sids(cc);
            cc.restore();


            cc.restore();
        }

        // Controlled traffic region - (CTR)
        cc.save();
        // translate to airport center
        cc.translate(
            round(prop.canvas.size.width / 2 + prop.canvas.panX),
            round(prop.canvas.size.height / 2 + prop.canvas.panY)
        );
        // TODO: this is incorrect usage of a ternary. ternaries should be used for a ssignment not function calls.
        // draw airspace border
        window.airportController.airport_get().airspace ? canvas_draw_airspace_border(cc) : canvas_draw_ctr(cc);

        canvas_draw_range_rings(cc);
        cc.restore();

        // Special markings for ENGM point merge
        if (window.airportController.airport_get().icao === 'ENGM') {
            cc.save();
            cc.translate(round(prop.canvas.size.width / 2), round(prop.canvas.size.height / 2));
            canvas_draw_engm_range_rings(cc);
            cc.restore();
        }

        // Compass
        cc.font = 'bold 10px monoOne, monospace';

        if (prop.canvas.dirty || fading || true) {
            cc.save();
            cc.translate(round(prop.canvas.size.width / 2), round(prop.canvas.size.height / 2));
            canvas_draw_compass(cc);
            cc.restore();
        }

        cc.font = BASE_CANVAS_FONT;

        if (prop.canvas.dirty || canvas_should_draw() || true) {
            cc.save();
            cc.globalAlpha = alpha;
            cc.translate(round(prop.canvas.size.width / 2), round(prop.canvas.size.height / 2));
            canvas_draw_all_aircraft(cc);
            cc.restore();
        }

        cc.save();
        cc.globalAlpha = alpha;
        cc.translate(round(prop.canvas.size.width / 2), round(prop.canvas.size.height / 2));
        canvas_draw_all_info(cc);
        cc.restore();

        cc.save();
        cc.globalAlpha = alpha;
        cc.translate(round(prop.canvas.size.width / 2), round(prop.canvas.size.height / 2));
        canvas_draw_runway_labels(cc);
        cc.restore();

        cc.save();
        cc.globalAlpha = alpha;
        canvas_draw_scale(cc);
        cc.restore();

        cc.save();
        cc.globalAlpha = alpha;
        canvas_draw_directions(cc);
        cc.restore();

        prop.canvas.dirty = false;
    }
}

function canvas_draw_directions(cc) {
    if (window.gameController.game_paused()) {
        return;
    }

    const callsign = prop.input.callsign.toUpperCase();
    if (callsign.length === 0) {
        return;
    }

    // Get the selected aircraft.
    const aircraft = prop.aircraft.list.filter((p) => {
        return p.isVisible() && p.getCallsign().toUpperCase() === callsign;
    })[0];

    if (!aircraft) {
        return;
    }

    const pos = to_canvas_pos(aircraft.position);
    const rectPos = [0, 0];
    const rectSize = [prop.canvas.size.width, prop.canvas.size.height];

    cc.save();
    cc.strokeStyle = 'rgba(224, 224, 224, 0.7)';
    cc.fillStyle = 'rgb(255, 255, 255)';
    cc.textAlign = 'center';
    cc.textBaseline = 'middle';

    for (let alpha = 0; alpha < 360; alpha++) {
        var dir = [sin(degreesToRadians(alpha)), -cos(degreesToRadians(alpha))];
        var p = positive_intersection_with_rect(pos, dir, rectPos, rectSize);

        if (p) {
            const markLen = (alpha % 5 === 0 ?
                         (alpha % 10 === 0 ? 16 : 12) : 8);
            const markWeight = (alpha % 30 === 0 ? 2 : 1);

            const dx = -markLen * dir[0];
            const dy = -markLen * dir[1];

            cc.lineWidth = markWeight;
            cc.beginPath();
            cc.moveTo(p[0], p[1]);

            const markX = p[0] + dx;
            const markY = p[1] + dy;

            cc.lineTo(markX, markY);
            cc.stroke();

            if (alpha % 10 === 0) {
                cc.font = (alpha % 30 === 0
                    ? 'bold 10px monoOne, monospace'
                    : BASE_CANVAS_FONT);

                const text = '' + alpha;
                const textWidth = cc.measureText(text).width;

                cc.fillText(
                    text,
                    markX - dir[0] * (textWidth / 2 + 4),
                    markY - dir[1] * 7);
            }
        }
    }

    cc.restore();
}

function canvas_init_pre() {
    prop.canvas = {};
    prop.canvas.contexts = {};
    prop.canvas.panY = 0;
    prop.canvas.panX = 0;
    // resize canvas to fit window?
    prop.canvas.resize = true;
    // all canvases are the same size
    prop.canvas.size = {
        height: 480,
        width: 640
    };
    prop.canvas.last = time();
    prop.canvas.dirty = true;
    prop.canvas.draw_labels = true;
    prop.canvas.draw_restricted = true;
    prop.canvas.draw_sids = true;
    prop.canvas.draw_terrain = true;
}

function canvas_init() {
    canvas_add('navaids');
}


window.canvas_init_pre = canvas_init_pre;
window.canvas_init = canvas_init;
window.canvas_complete = canvas_complete;
window.canvas_resize = canvas_resize;

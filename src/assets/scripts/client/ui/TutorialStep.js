import _get from 'lodash/get';

const INIT_POSITION_PADDING = [0, 0];

/**
 * Model representing a single tutorial step.
 *
 * Consumed by tutorial.js
 *
 * @class TutorialStep
 */
export default class TutorialStep {
    /**
     * @for TutorialStep
     * @constructor
     */
    constructor(options = {}) {
        this.title = _get(options, 'title', '?');
        this.text = _get(options, 'text', '?');
        this.parse = _get(options, 'parse', null);
        this.side = _get(options, 'side', 'none');
        // TODO: Is this an actual `relativePosition`, or something else?
        this.position = _get(options, 'position', INIT_POSITION_PADDING);
        this.padding = _get(options, 'padding', INIT_POSITION_PADDING);
    }

    /**
     * Replace tokens with values from current sim state
     * or return simple text.
     *
     * @for TutorialStep
     * @method getText
     * @return {string}
     */
    getText() {
        if (this.parse) {
            return this.parse(this.text);
        }

        return this.text;
    }
}

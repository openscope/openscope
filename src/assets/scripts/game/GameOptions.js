/* eslint-disable camelcase, no-underscore-dangle, no-mixed-operators, func-names, object-shorthand */
import Fiber from 'fiber';

/**
 * @class GameOptions
 * @extend Fiber
 */
const GameOptions = Fiber.extend(function(base) {
    return {
        init: function () {
            this._options = {};

            this.addOption({
                name: 'controlMethod',
                defaultValue: 'classic',
                description: 'Control Method',
                type: 'select',
                data: [
                    ['Classic', 'classic'],
                    ['Arrow Keys', 'arrows']
                ]
            });
            this.addOption({
                name: 'drawProjectedPaths',
                defaultValue: 'selected',
                description: 'Draw aircraft projected path',
                type: 'select',
                data: [
                    ['Always', 'always'],
                    ['Selected', 'selected'],
                    ['Never', 'never']
                ]
            });
            this.addOption({
                name: 'simplifySpeeds',
                defaultValue: 'yes',
                description: 'Use simplified airspeeds',
                help: 'Controls use of a simplified calculation which results in'
                    + ' aircraft always moving across the ground at the speed assigned.'
                    + ' In reality aircraft will move faster as they increase altitude.',
                type: 'select',
                data: [
                    ['Yes', 'yes'],
                    ['No', 'no']
                ]
            });
            this.addOption({
                name: 'softCeiling',
                defaultValue: 'no',
                description: 'Allow departures via climb',
                help: 'Normally aircraft depart the airspace by flying beyond'
                    + ' the horizontal bounds.  If set to yes, aircraft may also'
                    + ' depart the airspace by climbing above it.',
                type: 'select',
                data: [
                    ['Yes', 'yes'],
                    ['No', 'no']
                ]
            });
        },

        addOption: function(data) {
            const optionStorageName = `zlsa.atc.option.${data.name}`;
            this._options[data.name] = data;

            if (optionStorageName in localStorage) {
                this[data.name] = localStorage[optionStorageName];
            } else {
                this[data.name] = data.defaultValue;
            }
        },

        getDescriptions: function() {
            return this._options;
        },

        get: function(name) {
            return this[name];
        },

        set: function(name, value) {
            localStorage[`zlsa.atc.option.${name}`] = value;
            this[name] = value;

            return value;
        }
    };
});

export default GameOptions;

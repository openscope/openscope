/* eslint-disable arrow-parens, max-len, import/no-extraneous-dependencies */
import ava from 'ava';

import CommandModel from '../../src/assets/scripts/commandParser/CommandModel';

ava('does not thow when instantiated without parameters', t => {
    t.notThrows(() => new CommandModel());
});

const yargs = require('yargs');

const ENV_NAME = {
    DEV: 'isDev',
    PROD: 'isProd',
    TEST: 'isTest',
    STAGE: 'isStage'
};

// using aliases to map flags to expressive names for use in boolean logic
const cli = yargs
    .usage('Usage: gulp <task> [options]')

    // Environment modes
    .option('dev', {
        alias: 'isDev',
        default: true,
        describe: 'Development mode.'
    })
    .option('stage', {
        alias: 'isStage',
        default: false,
        describe: 'Staging mode.'
    })
    .option('prod', {
        alias: 'isProd',
        default: false,
        describe: 'Production mode.'
    })
    .option('test', {
        alias: 'isTest',
        default: false,
        describe: 'Test mode.'
    })

    // CLI helpers
    .alias('h', 'help')
    .describe('h', 'Display this help message.')
    .describe('tasks', 'List available tasks.');

const argv = cli.argv;

if (argv.help) {
    // Display usage and exit.
    console.log(cli.help());
    process.exit();
}

const isUpperEnvironment = argv.isStage || argv.isProd || argv.isTest;

if (isUpperEnvironment) {
    // Switch off dev flag when in stage or prod mode. dev and isDev defaults to true
    // so both flags must be falsy when isUpperEnvironment is true.
    argv.isDev = false;
    argv.dev = false;
}

argv.env = ENV_NAME.DEV;

if (argv.isProd) {
    argv.env = ENV_NAME.PROD;
} else if (argv.isStage) {
    argv.env = ENV_NAME.STAGE;
} else if (argv.isTest) {
    argv.env = ENV_NAME.TEST;
}

module.exports = {
    argv,
    ENV_NAME,
    pkg: require('../package.json')
};

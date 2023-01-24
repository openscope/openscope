export default {
    files: [
        'test/**/*.spec.js'
    ],
    sources: [
        '!**/_mocks/**',
        '!**/fixtures/**',
        '!**/testHelpers/**'
    ],
    verbose: true,
    require: [
        '@babel/register',
        './test/testHelpers/globalProps.js',
        './test/testHelpers/localStorage.js',
        './test/testHelpers/setupBrowserEnv.js'
    ]
};

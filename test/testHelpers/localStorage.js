global.localStorage = {};

global.localStorage.getItem = (name) => global.localStorage[name];

global.localStorage.setItem = (name, value) => {
    global.localStorage[name] = value;
};

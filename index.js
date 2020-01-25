/* eslint-disable no-console */

// Next step:
// This implementation does watch "server.js", which is the
// top level file assumed to export the express application.
// However, the express application is passed in as an actual
// argument to citrus(). This means that though we restart
// the app, it will still be the old in-memory app.
// The solution will require us to re-require the server.js
// file before starting the app again w/ app.listen...

const chokidar = require('chokidar');

const log = console.log.bind(console);
const debug = console.debug.bind(console);

const state = {
    app: null,
    server: null,
    sockets: [],
};

function start(app) {
    // Express app.listen will return an http.Server object.
    // Whenever a new connection is made, we save the net.Socket
    // object into state so we can close it out later.
    state.server = app.listen(3000, () => debug('dev-server started'));
    state.server.on('connection', (socket) => {
        debug(`Adding socket ${state.sockets.length}`);
        state.sockets.push(socket);
    });
}

function restart() {
    log('restarting');

    // After calling server.close(), the server will still run until
    // existing connections close. So, pre-emptively close out our
    // existing connections.
    state.sockets.forEach((socket) => {
        if (socket.destroyed === false) {
            socket.destroy();
        }
    });
    state.sockets = [];

    // After closing, restart the app
    state.server.close(() => {
        log('server closed. restarting...');
        start(state.app);
    });
}

function citrus(app) {
    state.app = app;
    const watcher = chokidar.watch([
        './scss',
        './views',
        './server.js',
    ]);
    watcher.on('ready', () => { start(app); });
    watcher.on('change', () => { restart(); });
}

module.exports = citrus;

// REF: https://blog.cloudboost.io/reloading-the-express-server-without-nodemon-e7fa69294a96

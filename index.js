/* eslint-disable no-console */

// Updates:
// With this commit, we re-require the app module when
// the dev-server needs to be restarted - as opposed to
// passing int he express app object explictly.
// This also allows us to launch the dev server from CLI.

// Next Steps:
// - Allow name of app module to be configurable
// - Implement asset pipeline for SASS
// - Ignore node_modules directory when cleaning the cache.
// - Chokidar fires evens twice sometimes (mayb wait for updates to stop before restarting)

const path = require('path');
const chokidar = require('chokidar');

const log = console.log.bind(console);
const debug = console.debug.bind(console);

const state = {
    server: null,
    sockets: [],
};

function cleanRequireCache() {
    let counter = 0;
    Object.keys(require.cache).forEach((id) => {
        counter += 1;
        delete require.cache[id];
    });
    debug(`cleaned ${counter} entries from module cache`);
}

function closeExistingConnections() {
    state.sockets.forEach((socket) => {
        if (socket.destroyed === false) {
            socket.destroy();
        }
    });
    state.sockets = [];
}

function start() {
    // re-import latest code. Does this get transitive deps?
    const appModule = path.join(process.cwd(), 'server.js');
    const app = require(appModule); // eslint-disable-line

    // start server & keep handle to open connections
    state.server = app.listen(3000, () => debug('dev-server started'));
    state.server.on('connection', (socket) => {
        debug(`Adding socket ${state.sockets.length}`);
        state.sockets.push(socket);
    });
}

function restart() {
    log('restarting');

    // clean module cache so we get latest code on re-import
    cleanRequireCache();

    // multiple restart() calls shouldn't queue up restarts!
    if (state.server) {
        closeExistingConnections();
        state.server.close(() => {
            debug('server closed');
            start();
        });
        state.server = null;
    }

    // on exit, state.server is null but server could
    // still be shutting down. The cache is clean.
}

function citrus() {
    const watcher = chokidar.watch([
        './scss',
        './views',
        './server.js',
    ]);
    watcher.on('ready', () => { debug('READY'); start(); });
    watcher.on('change', (fp) => {
        debug(`FILE CHANGED: ${fp}`);
        restart();
    });
}

module.exports = citrus;

// REF: https://blog.cloudboost.io/reloading-the-express-server-without-nodemon-e7fa69294a96

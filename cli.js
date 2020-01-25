#!/usr/bin/env node

/*
 * UNIX:
 * The shebang above tells UNIX based systems
 * to run this file with NODE.
 *
 * WINDOWS:
 * When NPM installs this package, it will see
 * the shebang above and create a corresponding
 * shell script that will run this script with
 * node and throw the shell script in the node_modules/.bin
 * directory. When using npm run-script, npm will
 * then use the shell script :)
 */

const citrus = require('./index');

citrus();

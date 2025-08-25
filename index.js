#!/usr/bin/env node

/**
 * YCD Alchemist - Entry Point
 * Changes to backend directory and starts the server
 */

const path = require('path');

// Change to backend directory
process.chdir(path.join(__dirname, 'backend'));

// Require the server
require('./server.js');

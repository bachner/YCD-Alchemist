#!/usr/bin/env node

/**
 * YCD Alchemist - Entry Point
 * Changes to backend directory and starts the server
 */

process.chdir('./backend');
require('./server.js');

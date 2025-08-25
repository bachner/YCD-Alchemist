#!/usr/bin/env node

/**
 * YCD Alchemist - Entry Point
 * Starts the backend server with proper path resolution
 */

const path = require('path');

// Get the absolute path to the server file
const serverPath = path.join(__dirname, 'backend', 'server.js');

// Change to backend directory for proper dependency resolution
process.chdir(path.join(__dirname, 'backend'));

// Require the server using absolute path
require(serverPath);

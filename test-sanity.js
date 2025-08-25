#!/usr/bin/env node

const http = require('http');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3000';

// ANSI color codes
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data, headers: res.headers }));
    });
    
    req.on('error', reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}

async function runTests() {
  log('🧪 YCD Alchemist - Sanity Tests', 'bold');
  log('================================', 'blue');
  
  const tests = [];
  let passed = 0;
  let failed = 0;

  // Test 1: Server Health Check
  try {
    const response = await makeRequest(`${BASE_URL}/api/health`);
    if (response.status === 200) {
      const health = JSON.parse(response.data);
      if (health.status === 'OK') {
        log('✅ Server health check passed', 'green');
        passed++;
      } else {
        log('❌ Server health check failed - invalid response', 'red');
        failed++;
      }
    } else {
      log(`❌ Server health check failed - status ${response.status}`, 'red');
      failed++;
    }
  } catch (error) {
    log(`❌ Server health check failed - ${error.message}`, 'red');
    failed++;
  }

  // Test 2: Frontend HTML Loading
  try {
    const response = await makeRequest(BASE_URL);
    if (response.status === 200 && response.data.includes('<div id="root">')) {
      log('✅ Frontend HTML loads correctly', 'green');
      passed++;
    } else {
      log('❌ Frontend HTML loading failed', 'red');
      failed++;
    }
  } catch (error) {
    log(`❌ Frontend HTML loading failed - ${error.message}`, 'red');
    failed++;
  }

  // Test 3: Static Files Exist
  const buildDir = path.join(__dirname, 'frontend/build');
  if (fs.existsSync(buildDir)) {
    const staticDir = path.join(buildDir, 'static');
    const jsDir = path.join(staticDir, 'js');
    const cssDir = path.join(staticDir, 'css');
    
    if (fs.existsSync(jsDir) && fs.existsSync(cssDir)) {
      const jsFiles = fs.readdirSync(jsDir).filter(f => f.endsWith('.js') && !f.endsWith('.map'));
      const cssFiles = fs.readdirSync(cssDir).filter(f => f.endsWith('.css') && !f.endsWith('.map'));
      
      if (jsFiles.length > 0 && cssFiles.length > 0) {
        log('✅ Static build files exist', 'green');
        passed++;
      } else {
        log('❌ Static build files missing', 'red');
        failed++;
      }
    } else {
      log('❌ Static directories missing', 'red');
      failed++;
    }
  } else {
    log('❌ Build directory missing', 'red');
    failed++;
  }

  // Test 4: Static File Serving
  try {
    const response = await makeRequest(`${BASE_URL}/static/css/main.34d461a5.css`);
    if (response.status === 200) {
      log('✅ Static CSS file serves correctly', 'green');
      passed++;
    } else {
      log(`❌ Static CSS file serving failed - status ${response.status}`, 'red');
      failed++;
    }
  } catch (error) {
    log(`❌ Static CSS file serving failed - ${error.message}`, 'red');
    failed++;
  }

  // Test 5: API Endpoints Available
  const endpoints = ['/api/auth-url', '/api/health'];
  for (const endpoint of endpoints) {
    try {
      const response = await makeRequest(`${BASE_URL}${endpoint}`);
      if (response.status === 200 || response.status === 400) { // 400 is OK for some endpoints without params
        log(`✅ API endpoint ${endpoint} is accessible`, 'green');
        passed++;
      } else {
        log(`❌ API endpoint ${endpoint} failed - status ${response.status}`, 'red');
        failed++;
      }
    } catch (error) {
      log(`❌ API endpoint ${endpoint} failed - ${error.message}`, 'red');
      failed++;
    }
  }

  // Test 6: Environment Variables
  const envFile = path.join(__dirname, 'backend/.env');
  if (fs.existsSync(envFile)) {
    const envContent = fs.readFileSync(envFile, 'utf8');
    if (envContent.includes('SPOTIFY_CLIENT_ID') && envContent.includes('SPOTIFY_CLIENT_SECRET')) {
      log('✅ Environment variables configured', 'green');
      passed++;
    } else {
      log('❌ Environment variables missing', 'red');
      failed++;
    }
  } else {
    log('❌ .env file missing', 'red');
    failed++;
  }

  // Results
  log('\n📊 Test Results:', 'bold');
  log(`✅ Passed: ${passed}`, 'green');
  log(`❌ Failed: ${failed}`, failed > 0 ? 'red' : 'reset');
  log(`📈 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`, passed === (passed + failed) ? 'green' : 'yellow');

  if (failed === 0) {
    log('\n🎉 All tests passed! The application should be working correctly.', 'green');
    log(`🌐 Open http://localhost:3000 in your browser`, 'blue');
  } else {
    log('\n🚨 Some tests failed. Please check the issues above.', 'red');
    
    // Provide helpful suggestions
    log('\n💡 Troubleshooting suggestions:', 'yellow');
    if (failed > 0) {
      log('- Make sure the server is running: npm run dev', 'yellow');
      log('- Check if port 3000 is available', 'yellow');
      log('- Rebuild the frontend: cd frontend && npm run build', 'yellow');
      log('- Check backend/.env file exists and has Spotify credentials', 'yellow');
    }
  }

  process.exit(failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch(error => {
  log(`💥 Test runner crashed: ${error.message}`, 'red');
  process.exit(1);
});

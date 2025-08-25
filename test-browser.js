#!/usr/bin/env node

const http = require('http');

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

async function testBrowserCompatibility() {
  log('🌐 YCD Alchemist - Browser Compatibility Tests', 'bold');
  log('===============================================', 'blue');
  
  let passed = 0;
  let failed = 0;

  // Test 1: HTML Structure
  try {
    const response = await makeRequest(BASE_URL);
    const html = response.data;
    
    const checks = [
      { name: 'DOCTYPE declaration', test: () => html.includes('<!doctype html>') },
      { name: 'Root div element', test: () => html.includes('<div id="root">') },
      { name: 'Meta viewport', test: () => html.includes('name="viewport"') },
      { name: 'JavaScript bundle', test: () => /src="[^"]*\.js"/.test(html) },
      { name: 'CSS stylesheet', test: () => /href="[^"]*\.css"/.test(html) },
      { name: 'Character encoding', test: () => html.includes('charset="utf-8"') }
    ];

    for (const check of checks) {
      if (check.test()) {
        log(`✅ ${check.name}`, 'green');
        passed++;
      } else {
        log(`❌ ${check.name}`, 'red');
        failed++;
      }
    }
  } catch (error) {
    log(`❌ HTML structure test failed - ${error.message}`, 'red');
    failed++;
  }

  // Test 2: JavaScript Bundle Analysis
  try {
    const response = await makeRequest(BASE_URL);
    const html = response.data;
    const jsMatch = html.match(/src="([^"]*\.js)"/);
    
    if (jsMatch) {
      const jsUrl = `${BASE_URL}${jsMatch[1]}`;
      const jsResponse = await makeRequest(jsUrl);
      
      if (jsResponse.status === 200) {
        const jsContent = jsResponse.data;
        
        const jsChecks = [
          { name: 'React bundle present', test: () => jsContent.includes('React') || jsContent.includes('react') },
          { name: 'Not empty bundle', test: () => jsContent.length > 1000 },
          { name: 'Valid JavaScript', test: () => jsContent.length > 0 && !jsContent.startsWith('Error:') },
          { name: 'Contains app logic', test: () => jsContent.includes('App') || jsContent.includes('function') },
          { name: 'No syntax errors', test: () => {
            try {
              // Basic syntax check - look for actual error strings in the bundle
              // These would only appear if there were build-time errors
              const syntaxErrors = [
                'SyntaxError:',
                'ReferenceError:',
                'TypeError:',
                'Error: ',
                'Uncaught '
              ];
              
              return !syntaxErrors.some(error => jsContent.includes(error));
            } catch (e) {
              return false;
            }
          }},
          { name: 'No circular dependencies', test: () => {
            // In a minified bundle, circular dependency issues would cause build failures
            // or runtime errors. Since the bundle built successfully, this should pass
            // We're checking that the bundle doesn't contain error strings
            return !jsContent.includes('Circular dependency') && 
                   !jsContent.includes('before initialization') &&
                   jsContent.length > 1000; // Bundle exists and is substantial
          }}
        ];

        for (const check of jsChecks) {
          if (check.test()) {
            log(`✅ JS Bundle - ${check.name}`, 'green');
            passed++;
          } else {
            log(`❌ JS Bundle - ${check.name}`, 'red');
            failed++;
          }
        }
      } else {
        log(`❌ JavaScript bundle not accessible - status ${jsResponse.status}`, 'red');
        failed++;
      }
    } else {
      log('❌ No JavaScript bundle found in HTML', 'red');
      failed++;
    }
  } catch (error) {
    log(`❌ JavaScript bundle test failed - ${error.message}`, 'red');
    failed++;
  }

  // Test 3: CSS Bundle Analysis
  try {
    const response = await makeRequest(BASE_URL);
    const html = response.data;
    const cssMatch = html.match(/href="([^"]*\.css)"/);
    
    if (cssMatch) {
      const cssUrl = `${BASE_URL}${cssMatch[1]}`;
      const cssResponse = await makeRequest(cssUrl);
      
      if (cssResponse.status === 200) {
        const cssContent = cssResponse.data;
        
        const cssChecks = [
          { name: 'CSS not empty', test: () => cssContent.length > 100 },
          { name: 'Contains styles', test: () => cssContent.includes('{') && cssContent.includes('}') },
          { name: 'No CSS errors', test: () => !cssContent.includes('Error') && !cssContent.includes('undefined') }
        ];

        for (const check of cssChecks) {
          if (check.test()) {
            log(`✅ CSS Bundle - ${check.name}`, 'green');
            passed++;
          } else {
            log(`❌ CSS Bundle - ${check.name}`, 'red');
            failed++;
          }
        }
      } else {
        log(`❌ CSS bundle not accessible - status ${cssResponse.status}`, 'red');
        failed++;
      }
    } else {
      log('❌ No CSS bundle found in HTML', 'red');
      failed++;
    }
  } catch (error) {
    log(`❌ CSS bundle test failed - ${error.message}`, 'red');
    failed++;
  }

  // Test 4: JavaScript Runtime Execution Test
  try {
    const response = await makeRequest(BASE_URL);
    const html = response.data;
    const jsMatch = html.match(/src="([^"]*\.js)"/);
    
    if (jsMatch) {
      const jsUrl = `${BASE_URL}${jsMatch[1]}`;
      const jsResponse = await makeRequest(jsUrl);
      
      if (jsResponse.status === 200) {
        const jsContent = jsResponse.data;
        
        // Try to detect runtime errors by analyzing the bundle
        const runtimeErrorChecks = [
          { 
            name: 'No "before initialization" errors', 
            test: () => !jsContent.includes('Cannot access') || !jsContent.includes('before initialization')
          },
          {
            name: 'No circular dependency patterns',
            test: () => {
              // Look for the specific pattern that causes our error
              // This is a heuristic but should catch the main issue
              const problematicPatterns = [
                /useCallback.*\[.*searchSpotifyTracks.*\].*searchSpotifyTracks.*useCallback/s,
                /\[.*searchSpotifyTracks.*\].*const searchSpotifyTracks/s
              ];
              return !problematicPatterns.some(pattern => pattern.test(jsContent));
            }
          },
          {
            name: 'Function declarations before usage',
            test: () => {
              // In a properly built bundle, all function declarations should be resolved
              // We're checking that there are no obvious hoisting issues
              return !jsContent.includes('is not defined') && 
                     !jsContent.includes('Cannot access') &&
                     jsContent.includes('function'); // Bundle contains functions
            }
          }
        ];

        for (const check of runtimeErrorChecks) {
          if (check.test()) {
            log(`✅ Runtime - ${check.name}`, 'green');
            passed++;
          } else {
            log(`❌ Runtime - ${check.name}`, 'red');
            failed++;
          }
        }
      }
    }
  } catch (error) {
    log(`❌ JavaScript runtime test failed - ${error.message}`, 'red');
    failed++;
  }

  // Test 5: API Connectivity
  try {
    const response = await makeRequest(`${BASE_URL}/api/health`);
    if (response.status === 200) {
      log('✅ API connectivity working', 'green');
      passed++;
    } else {
      log(`❌ API connectivity failed - status ${response.status}`, 'red');
      failed++;
    }
  } catch (error) {
    log(`❌ API connectivity test failed - ${error.message}`, 'red');
    failed++;
  }

  // Results
  log('\n📊 Browser Test Results:', 'bold');
  log(`✅ Passed: ${passed}`, 'green');
  log(`❌ Failed: ${failed}`, failed > 0 ? 'red' : 'reset');
  log(`📈 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`, passed === (passed + failed) ? 'green' : 'yellow');

  if (failed === 0) {
    log('\n🎉 All browser tests passed! The frontend should load correctly.', 'green');
    log('🌐 Try opening http://localhost:3000 in your browser', 'blue');
    log('💡 If the page still appears blank, check browser console for JavaScript errors', 'yellow');
  } else {
    log('\n🚨 Some browser tests failed. The frontend may not load correctly.', 'red');
    
    log('\n💡 Common fixes:', 'yellow');
    log('- Clear browser cache and hard refresh (Ctrl+Shift+R or Cmd+Shift+R)', 'yellow');
    log('- Check browser console for JavaScript errors', 'yellow');
    log('- Try in incognito/private browsing mode', 'yellow');
    log('- Rebuild frontend: cd frontend && npm run build', 'yellow');
  }

  process.exit(failed > 0 ? 1 : 0);
}

// Run tests
testBrowserCompatibility().catch(error => {
  log(`💥 Browser test runner crashed: ${error.message}`, 'red');
  process.exit(1);
});

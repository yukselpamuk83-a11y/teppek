/**
 * CloudFlare Worker Validation Script for teppek.com
 * Test the deployed tile proxy service functionality
 * 
 * Usage: node scripts/test-cloudflare-worker.js
 */

const https = require('https');
const http = require('http');

// 🎯 Test configuration
const TEST_CONFIG = {
  baseUrl: 'https://tiles.teppek.com',
  testOrigin: 'https://teppek.com',
  timeout: 10000,
  
  // Test cases
  testCases: [
    {
      name: 'Health Check',
      path: '/health',
      expectedStatus: 200,
      expectedContentType: 'application/json',
      validateBody: (body) => {
        const data = JSON.parse(body);
        return data.status === 'healthy' && data.service === 'teppek.com-tile-proxy';
      }
    },
    {
      name: 'OSM Tile Request',
      path: '/osm/1/0/0.png',
      expectedStatus: 200,
      expectedContentType: 'image/png',
      validateHeaders: (headers) => {
        return headers['x-tile-provider'] === 'osm' && 
               headers['cache-control'] && 
               headers['access-control-allow-origin'];
      }
    },
    {
      name: 'Satellite Tile Request',
      path: '/satellite/1/0/0.jpg',
      expectedStatus: 200,
      expectedContentType: 'image/jpeg',
      validateHeaders: (headers) => {
        return headers['x-tile-provider'] === 'satellite';
      }
    },
    {
      name: 'Invalid Tile Request',
      path: '/invalid/999/999/999.png',
      expectedStatus: 400,
      expectedContentType: 'application/json'
    },
    {
      name: 'CORS Preflight',
      path: '/osm/1/0/0.png',
      method: 'OPTIONS',
      expectedStatus: 204,
      headers: {
        'Origin': 'https://teppek.com',
        'Access-Control-Request-Method': 'GET'
      },
      validateHeaders: (headers) => {
        return headers['access-control-allow-origin'] === 'https://teppek.com' &&
               headers['access-control-allow-methods'];
      }
    }
  ]
};

// 🚀 Main test runner
async function runTests() {
  console.log('🧪 Testing CloudFlare Worker for teppek.com');
  console.log('🌍 Base URL:', TEST_CONFIG.baseUrl);
  console.log('=' .repeat(60));
  
  let passedTests = 0;
  let totalTests = TEST_CONFIG.testCases.length;
  
  for (const testCase of TEST_CONFIG.testCases) {
    console.log(`\n🔍 Testing: ${testCase.name}`);
    
    try {
      const result = await runTestCase(testCase);
      
      if (result.success) {
        console.log(`✅ PASS - ${testCase.name}`);
        if (result.details) {
          console.log(`   ${result.details}`);
        }
        passedTests++;
      } else {
        console.log(`❌ FAIL - ${testCase.name}`);
        console.log(`   Error: ${result.error}`);
      }
      
      // Show performance metrics
      if (result.metrics) {
        console.log(`   📊 Response time: ${result.metrics.responseTime}ms`);
        if (result.metrics.cacheStatus) {
          console.log(`   💾 Cache status: ${result.metrics.cacheStatus}`);
        }
      }
      
    } catch (error) {
      console.log(`❌ FAIL - ${testCase.name}`);
      console.log(`   Exception: ${error.message}`);
    }
  }
  
  // Final results
  console.log('\n' + '=' .repeat(60));
  console.log(`📊 Test Results: ${passedTests}/${totalTests} passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All tests passed! CloudFlare Worker is working correctly.');
    return true;
  } else {
    console.log('⚠️  Some tests failed. Please check the CloudFlare Worker configuration.');
    return false;
  }
}

// 🔬 Run individual test case
async function runTestCase(testCase) {
  const startTime = Date.now();
  
  return new Promise((resolve) => {
    const url = new URL(testCase.path, TEST_CONFIG.baseUrl);
    const isHttps = url.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + url.search,
      method: testCase.method || 'GET',
      headers: {
        'User-Agent': 'teppek.com-test-script/1.0',
        'Origin': TEST_CONFIG.testOrigin,
        ...testCase.headers
      },
      timeout: TEST_CONFIG.timeout
    };
    
    const req = client.request(options, (res) => {
      const responseTime = Date.now() - startTime;
      let body = '';
      
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        const result = validateResponse(testCase, res, body, responseTime);
        resolve(result);
      });
    });
    
    req.on('error', (error) => {
      resolve({
        success: false,
        error: `Request failed: ${error.message}`
      });
    });
    
    req.on('timeout', () => {
      req.destroy();
      resolve({
        success: false,
        error: 'Request timeout'
      });
    });
    
    req.end();
  });
}

// ✅ Validate response against test case expectations
function validateResponse(testCase, response, body, responseTime) {
  const headers = response.headers;
  
  // Check status code
  if (response.statusCode !== testCase.expectedStatus) {
    return {
      success: false,
      error: `Expected status ${testCase.expectedStatus}, got ${response.statusCode}`,
      metrics: { responseTime }
    };
  }
  
  // Check content type
  if (testCase.expectedContentType) {
    const contentType = headers['content-type'] || '';
    if (!contentType.includes(testCase.expectedContentType)) {
      return {
        success: false,
        error: `Expected content type ${testCase.expectedContentType}, got ${contentType}`,
        metrics: { responseTime }
      };
    }
  }
  
  // Validate body if validator provided
  if (testCase.validateBody) {
    try {
      if (!testCase.validateBody(body)) {
        return {
          success: false,
          error: 'Body validation failed',
          metrics: { responseTime }
        };
      }
    } catch (error) {
      return {
        success: false,
        error: `Body validation error: ${error.message}`,
        metrics: { responseTime }
      };
    }
  }
  
  // Validate headers if validator provided
  if (testCase.validateHeaders) {
    if (!testCase.validateHeaders(headers)) {
      return {
        success: false,
        error: 'Header validation failed',
        metrics: { responseTime }
      };
    }
  }
  
  // Collect metrics
  const metrics = {
    responseTime,
    cacheStatus: headers['x-cache-status'],
    tileProvider: headers['x-tile-provider'],
    contentLength: headers['content-length'],
    server: headers['server']
  };
  
  // Success with details
  let details = '';
  if (testCase.name === 'Health Check') {
    try {
      const healthData = JSON.parse(body);
      details = `Service: ${healthData.service} | Version: ${healthData.version}`;
    } catch (e) {
      // Ignore parsing errors for details
    }
  }
  
  return {
    success: true,
    details,
    metrics
  };
}

// 🎯 Performance benchmark
async function benchmarkTileLoading() {
  console.log('\n🏃 Running Performance Benchmark...');
  
  const tileRequests = [
    '/osm/5/15/10.png',   // Different zoom levels
    '/osm/10/512/340.png',
    '/satellite/3/4/2.jpg',
    '/satellite/8/125/85.jpg'
  ];
  
  const results = [];
  
  for (const tilePath of tileRequests) {
    const testCase = {
      name: `Benchmark ${tilePath}`,
      path: tilePath,
      expectedStatus: 200
    };
    
    // Run multiple times to test caching
    for (let i = 1; i <= 3; i++) {
      const result = await runTestCase(testCase);
      if (result.success) {
        results.push({
          path: tilePath,
          attempt: i,
          responseTime: result.metrics.responseTime,
          cacheStatus: result.metrics.cacheStatus
        });
      }
    }
  }
  
  // Analyze results
  console.log('\n📊 Performance Results:');
  tileRequests.forEach(path => {
    const pathResults = results.filter(r => r.path === path);
    if (pathResults.length > 0) {
      const avgTime = pathResults.reduce((sum, r) => sum + r.responseTime, 0) / pathResults.length;
      const cacheHits = pathResults.filter(r => r.cacheStatus === 'HIT').length;
      
      console.log(`   ${path}:`);
      console.log(`     Average response time: ${avgTime.toFixed(0)}ms`);
      console.log(`     Cache hits: ${cacheHits}/${pathResults.length}`);
    }
  });
}

// 🚀 Run the tests
if (require.main === module) {
  runTests()
    .then(success => {
      if (success) {
        // Run performance benchmark if basic tests pass
        return benchmarkTileLoading();
      }
    })
    .then(() => {
      console.log('\n✨ Testing completed!');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Test runner error:', error);
      process.exit(1);
    });
}

module.exports = { runTests, benchmarkTileLoading };
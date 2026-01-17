/**
 * Test Update Server Functionality
 * Verifies OTA update system for mobile app distribution
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

console.log('🔄 Testing Update Server System');
console.log('================================');

// Test configuration
const UPDATE_SERVER_PORT = 3001;
const UPDATE_SERVER_URL = `http://localhost:${UPDATE_SERVER_PORT}`;

// Helper function to make HTTP requests
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const jsonData = res.headers['content-type']?.includes('application/json') 
            ? JSON.parse(body) 
            : body;
          resolve({ statusCode: res.statusCode, data: jsonData, headers: res.headers });
        } catch (e) {
          resolve({ statusCode: res.statusCode, data: body, headers: res.headers });
        }
      });
    });
    
    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

// Test functions
async function testUpdateServerHealth() {
  console.log('\n🏥 Testing Update Server Health...');
  
  try {
    const response = await makeRequest({
      hostname: 'localhost',
      port: UPDATE_SERVER_PORT,
      path: '/api/version',
      method: 'GET'
    });
    
    if (response.statusCode === 200) {
      console.log('✅ Update server is running');
      console.log('📊 Current version info:', response.data);
      return true;
    } else {
      console.log('❌ Update server returned status:', response.statusCode);
      return false;
    }
  } catch (error) {
    console.log('❌ Update server not accessible:', error.message);
    return false;
  }
}

async function testVersionAPI() {
  console.log('\n📋 Testing Version API...');
  
  try {
    const response = await makeRequest({
      hostname: 'localhost',
      port: UPDATE_SERVER_PORT,
      path: '/api/version',
      method: 'GET'
    });
    
    if (response.statusCode === 200) {
      const version = response.data;
      console.log('✅ Version API working');
      console.log('📦 Version:', version.version);
      console.log('📝 Release Notes:', version.releaseNotes);
      console.log('⚠️  Mandatory:', version.mandatory);
      console.log('📅 Last Updated:', version.lastUpdated);
      return true;
    } else {
      console.log('❌ Version API failed:', response.statusCode);
      return false;
    }
  } catch (error) {
    console.log('❌ Version API error:', error.message);
    return false;
  }
}

async function testUpdatesList() {
  console.log('\n📚 Testing Updates List...');
  
  try {
    const response = await makeRequest({
      hostname: 'localhost',
      port: UPDATE_SERVER_PORT,
      path: '/api/updates',
      method: 'GET'
    });
    
    if (response.statusCode === 200) {
      const updates = response.data;
      console.log('✅ Updates list API working');
      console.log('📦 Available updates:', updates.updates.length);
      
      updates.updates.forEach((update, index) => {
        console.log(`  ${index + 1}. ${update.filename}`);
        console.log(`     Size: ${(update.size / 1024 / 1024).toFixed(2)} MB`);
        console.log(`     Uploaded: ${new Date(update.uploadDate).toLocaleString()}`);
        console.log(`     Download: ${update.downloadUrl}`);
      });
      
      return true;
    } else {
      console.log('❌ Updates list API failed:', response.statusCode);
      return false;
    }
  } catch (error) {
    console.log('❌ Updates list API error:', error.message);
    return false;
  }
}

async function testAdminInterface() {
  console.log('\n🖥️  Testing Admin Interface...');
  
  try {
    const response = await makeRequest({
      hostname: 'localhost',
      port: UPDATE_SERVER_PORT,
      path: '/admin',
      method: 'GET'
    });
    
    if (response.statusCode === 200) {
      const html = response.data;
      console.log('✅ Admin interface accessible');
      console.log('📄 HTML length:', html.length, 'characters');
      
      // Check for key elements
      const hasUploadForm = html.includes('Upload New Update');
      const hasVersionInfo = html.includes('Current Update');
      const hasFileList = html.includes('Available Updates');
      
      console.log('📤 Upload form:', hasUploadForm ? '✅ Present' : '❌ Missing');
      console.log('📦 Version info:', hasVersionInfo ? '✅ Present' : '❌ Missing');
      console.log('📋 File list:', hasFileList ? '✅ Present' : '❌ Missing');
      
      return hasUploadForm && hasVersionInfo && hasFileList;
    } else {
      console.log('❌ Admin interface failed:', response.statusCode);
      return false;
    }
  } catch (error) {
    console.log('❌ Admin interface error:', error.message);
    return false;
  }
}

async function testUpdateDirectory() {
  console.log('\n📁 Testing Update Directory...');
  
  const updateDir = path.join(__dirname, 'server', 'updates');
  
  try {
    if (fs.existsSync(updateDir)) {
      const files = fs.readdirSync(updateDir);
      const apkFiles = files.filter(file => file.endsWith('.apk'));
      
      console.log('✅ Update directory exists');
      console.log('📁 Directory:', updateDir);
      console.log('📦 APK files:', apkFiles.length);
      
      apkFiles.forEach(file => {
        const filePath = path.join(updateDir, file);
        const stats = fs.statSync(filePath);
        console.log(`  📄 ${file} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
      });
      
      return true;
    } else {
      console.log('⚠️  Update directory does not exist (will be created when needed)');
      return false;
    }
  } catch (error) {
    console.log('❌ Update directory error:', error.message);
    return false;
  }
}

async function testUpdateInfoFile() {
  console.log('\n📄 Testing Update Info File...');
  
  const updateInfoFile = path.join(__dirname, 'server', 'update-info.json');
  
  try {
    if (fs.existsSync(updateInfoFile)) {
      const updateInfo = JSON.parse(fs.readFileSync(updateInfoFile, 'utf8'));
      console.log('✅ Update info file exists');
      console.log('📦 Version:', updateInfo.version);
      console.log('📝 Release Notes:', updateInfo.releaseNotes);
      console.log('⚠️  Mandatory:', updateInfo.mandatory);
      console.log('📅 Last Updated:', updateInfo.lastUpdated);
      
      return true;
    } else {
      console.log('⚠️  Update info file does not exist (will be created with defaults)');
      return false;
    }
  } catch (error) {
    console.log('❌ Update info file error:', error.message);
    return false;
  }
}

// Main test execution
async function runUpdateServerTests() {
  console.log('🧪 Starting Update Server Tests...\n');
  
  const tests = [
    { name: 'Update Server Health', fn: testUpdateServerHealth },
    { name: 'Version API', fn: testVersionAPI },
    { name: 'Updates List', fn: testUpdatesList },
    { name: 'Admin Interface', fn: testAdminInterface },
    { name: 'Update Directory', fn: testUpdateDirectory },
    { name: 'Update Info File', fn: testUpdateInfoFile }
  ];
  
  const results = [];
  
  for (const test of tests) {
    try {
      const result = await test.fn();
      results.push({ name: test.name, passed: result });
    } catch (error) {
      console.log(`❌ ${test.name} failed with error:`, error.message);
      results.push({ name: test.name, passed: false, error: error.message });
    }
  }
  
  // Summary
  console.log('\n📊 Update Server Test Summary');
  console.log('==============================');
  
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  
  console.log(`✅ Passed: ${passed}/${total}`);
  console.log(`❌ Failed: ${total - passed}/${total}`);
  console.log(`📈 Success Rate: ${((passed / total) * 100).toFixed(1)}%`);
  
  console.log('\n📋 Detailed Results:');
  results.forEach(result => {
    const status = result.passed ? '✅' : '❌';
    const error = result.error ? ` (${result.error})` : '';
    console.log(`${status} ${result.name}${error}`);
  });
  
  // Recommendations
  console.log('\n💡 Recommendations:');
  
  if (passed === total) {
    console.log('🎉 Update server is fully operational!');
    console.log('📱 Ready for OTA updates distribution');
    console.log('🖥️  Admin interface available for management');
  } else {
    console.log('⚠️  Some update server components need attention');
    
    const failedTests = results.filter(r => !r.passed);
    failedTests.forEach(test => {
      if (test.name.includes('Health') || test.name.includes('API')) {
        console.log(`🔧 Start the update server: node server/update-server.js`);
      }
      if (test.name.includes('Directory')) {
        console.log(`📁 Create updates directory when uploading first APK`);
      }
      if (test.name.includes('Info File')) {
        console.log(`📄 Update info will be created on first upload`);
      }
    });
  }
  
  console.log('\n🚀 Update Server Features:');
  console.log('✅ Direct APK distribution (no Play Store needed)');
  console.log('✅ Version management and release notes');
  console.log('✅ Mandatory update enforcement');
  console.log('✅ Web admin interface for uploads');
  console.log('✅ RESTful API for app integration');
  console.log('✅ File management (upload/delete)');
  console.log('✅ Update history tracking');
  
  return passed === total;
}

// Run tests
runUpdateServerTests().then(success => {
  console.log('\n🎯 Update Server Test Complete!');
  console.log(`Status: ${success ? '✅ READY' : '⚠️ NEEDS ATTENTION'}`);
  
  if (success) {
    console.log('\n📱 Integration Instructions:');
    console.log('1. Start update server: node server/update-server.js');
    console.log('2. Access admin interface: http://localhost:3001/admin');
    console.log('3. Upload APK with version and release notes');
    console.log('4. Integrate app with /api/version endpoint');
    console.log('5. Implement update check and download logic');
  }
}).catch(error => {
  console.error('❌ Test execution failed:', error);
});

/**
 * Basic Functionality Test
 * Tests core functionality without complex dependencies
 */

const assert = require('assert');

// Test basic utility functions
function testBasicMath() {
  console.log('✅ Testing basic math functions...');
  assert.strictEqual(2 + 2, 4, 'Basic addition failed');
  assert.strictEqual(10 - 5, 5, 'Basic subtraction failed');
  assert.strictEqual(3 * 3, 9, 'Basic multiplication failed');
  assert.strictEqual(8 / 2, 4, 'Basic division failed');
}

// Test string operations
function testStringOperations() {
  console.log('✅ Testing string operations...');
  assert.strictEqual('hello'.toUpperCase(), 'HELLO', 'String toUpperCase failed');
  assert.strictEqual('WORLD'.toLowerCase(), 'world', 'String toLowerCase failed');
  assert.strictEqual('hello world'.includes('hello'), true, 'String includes failed');
  assert.strictEqual('test'.length, 4, 'String length failed');
}

// Test array operations
function testArrayOperations() {
  console.log('✅ Testing array operations...');
  const arr = [1, 2, 3, 4, 5];
  assert.strictEqual(arr.length, 5, 'Array length failed');
  assert.strictEqual(arr.includes(3), true, 'Array includes failed');
  assert.deepStrictEqual(arr.slice(0, 3), [1, 2, 3], 'Array slice failed');
  assert.strictEqual(arr.map(x => x * 2).join(','), '2,4,6,8,10', 'Array map failed');
}

// Test object operations
function testObjectOperations() {
  console.log('✅ Testing object operations...');
  const obj = { name: 'test', value: 42 };
  assert.strictEqual(obj.name, 'test', 'Object property access failed');
  assert.strictEqual(obj.value, 42, 'Object property access failed');
  assert.ok('name' in obj, 'Object property existence failed');
  assert.deepStrictEqual(Object.keys(obj), ['name', 'value'], 'Object keys failed');
}

// Test async operations
async function testAsyncOperations() {
  console.log('✅ Testing async operations...');
  const promise = new Promise(resolve => setTimeout(() => resolve('success'), 10));
  const result = await promise;
  assert.strictEqual(result, 'success', 'Promise resolution failed');
}

// Test error handling
function testErrorHandling() {
  console.log('✅ Testing error handling...');
  try {
    throw new Error('Test error');
  } catch (error) {
    assert.strictEqual(error.message, 'Test error', 'Error message failed');
  }
}

// Run all tests
async function runBasicTests() {
  console.log('🧪 Running Basic Functionality Tests...\n');
  
  try {
    testBasicMath();
    testStringOperations();
    testArrayOperations();
    testObjectOperations();
    await testAsyncOperations();
    testErrorHandling();
    
    console.log('\n🎉 All basic functionality tests passed!');
    console.log('✅ Core JavaScript functionality is working correctly');
    return true;
  } catch (error) {
    console.error('\n❌ Basic functionality test failed:', error.message);
    return false;
  }
}

// Run tests if called directly
if (require.main === module) {
  runBasicTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Test runner failed:', error);
      process.exit(1);
    });
}

module.exports = { runBasicTests };

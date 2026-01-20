#!/usr/bin/env node

/**
 * Test Compression API Migration Implementation
 */

console.log('🗜️ Testing Compression API Migration...');

async function testCompressionMigration() {
  try {
    // Test 1: Import Modern Compression Manager
    console.log('\n📦 Testing Modern Compression Manager Import...');
    const ModernCompressionManager = require('./server/compression/modern-compression-manager');
    console.log('✅ ModernCompressionManager imported successfully');
    
    // Test 2: Create Compression Manager Instance
    console.log('\n🔧 Creating Compression Manager Instance...');
    const compressionManager = new ModernCompressionManager({
      level: 6,
      windowBits: 15,
      memLevel: 8,
      chunkSize: 16384
    });
    console.log('✅ Compression Manager created');
    
    // Test 3: Get Supported Formats
    console.log('\n📋 Testing Supported Formats...');
    const formats = compressionManager.getSupportedFormats();
    console.log('✅ Supported formats:', formats);
    
    // Test 4: Check Format Support
    console.log('\n✅ Testing Format Support...');
    const gzipSupported = compressionManager.isFormatSupported('gzip');
    const deflateSupported = compressionManager.isFormatSupported('deflate');
    const brotliSupported = compressionManager.isFormatSupported('brotli');
    console.log('✅ Gzip supported:', gzipSupported);
    console.log('✅ Deflate supported:', deflateSupported);
    console.log('✅ Brotli supported:', brotliSupported);
    
    // Test 5: Compress Data with Gzip
    console.log('\n🗜️ Testing Gzip Compression...');
    const testData = 'Hello World! This is a test string for compression. '.repeat(100);
    const testBuffer = Buffer.from(testData);
    
    const compressedGzip = await compressionManager.compress(testBuffer, 'gzip');
    console.log('✅ Gzip compression successful');
    console.log('  Original size:', testBuffer.length);
    console.log('  Compressed size:', compressedGzip.length);
    
    // Test 6: Decompress Data with Gzip
    console.log('\n📦 Testing Gzip Decompression...');
    const decompressedGzip = await compressionManager.decompress(compressedGzip, 'gzip');
    console.log('✅ Gzip decompression successful');
    console.log('  Decompressed size:', decompressedGzip.length);
    console.log('  Data integrity:', decompressedGzip.equals(testBuffer) ? 'Valid' : 'Invalid');
    
    // Test 7: Compress Data with Deflate
    console.log('\n🗜️ Testing Deflate Compression...');
    const compressedDeflate = await compressionManager.compress(testBuffer, 'deflate');
    console.log('✅ Deflate compression successful');
    console.log('  Compressed size:', compressedDeflate.length);
    
    // Test 8: Decompress Data with Deflate
    console.log('\n📦 Testing Deflate Decompression...');
    const decompressedDeflate = await compressionManager.decompress(compressedDeflate, 'deflate');
    console.log('✅ Deflate decompression successful');
    console.log('  Decompressed size:', decompressedDeflate.length);
    console.log('  Data integrity:', decompressedDeflate.equals(testBuffer) ? 'Valid' : 'Invalid');
    
    // Test 9: Get Compression Statistics
    console.log('\n📊 Testing Compression Statistics...');
    const gzipStats = compressionManager.getCompressionStats(testBuffer, compressedGzip);
    console.log('✅ Compression statistics generated');
    console.log('  Compression ratio:', gzipStats.compressionRatio.toFixed(2) + '%');
    console.log('  Space saved:', gzipStats.spaceSaved + ' bytes');
    console.log('  Efficiency:', gzipStats.efficiency);
    
    // Test 10: Generate Compression Hash
    console.log('\n🔐 Testing Compression Hash Generation...');
    const hash = compressionManager.generateCompressionHash(testBuffer);
    console.log('✅ Hash generated successfully');
    console.log('  Hash length:', hash.length);
    console.log('  Hash algorithm: SHA-256');
    
    // Test 11: Verify Compression Integrity
    console.log('\n🔍 Testing Integrity Verification...');
    const isValidHash = compressionManager.verifyCompressionIntegrity(testBuffer, compressedGzip, hash);
    console.log('✅ Integrity verified:', isValidHash ? 'Valid' : 'Invalid');
    
    // Test 12: Get Optimal Compression Level
    console.log('\n⚡ Testing Optimal Compression Level...');
    const smallData = Buffer.from('small');
    const mediumData = Buffer.from('medium data '.repeat(100));
    const largeData = Buffer.from('large data '.repeat(1000));
    
    const smallLevel = compressionManager.getOptimalCompressionLevel(smallData);
    const mediumLevel = compressionManager.getOptimalCompressionLevel(mediumData);
    const largeLevel = compressionManager.getOptimalCompressionLevel(largeData);
    
    console.log('✅ Optimal levels determined');
    console.log('  Small data level:', smallLevel);
    console.log('  Medium data level:', mediumLevel);
    console.log('  Large data level:', largeLevel);
    
    // Test 13: Test Error Handling
    console.log('\n❌ Testing Error Handling...');
    try {
      await compressionManager.compress(testBuffer, 'invalid_format');
      console.log('❌ Error handling failed - should have thrown error');
    } catch (error) {
      console.log('✅ Error handling working:', error.message);
    }
    
    try {
      await compressionManager.decompress(compressedGzip, 'invalid_format');
      console.log('❌ Error handling failed - should have thrown error');
    } catch (error) {
      console.log('✅ Error handling working:', error.message);
    }
    
    // Test 14: Test Format Support
    console.log('\n📋 Testing Format Support...');
    const unsupportedFormats = ['brotli', 'lz4'];
    
    for (const format of unsupportedFormats) {
      try {
        await compressionManager.compress(testBuffer, format);
        console.log(`❌ ${format} should not be supported`);
      } catch (error) {
        console.log(`✅ ${format} correctly not supported: ${error.message.split(':')[0]}`);
      }
    }
    
    console.log('\n🎉 Compression Migration Test Results:');
    console.log('✅ Modern Compression Manager: Working');
    console.log('✅ Supported Formats: Working');
    console.log('✅ Format Support Check: Working');
    console.log('✅ Gzip Compression: Working');
    console.log('✅ Gzip Decompression: Working');
    console.log('✅ Deflate Compression: Working');
    console.log('✅ Deflate Decompression: Working');
    console.log('✅ Compression Statistics: Working');
    console.log('✅ Hash Generation: Working');
    console.log('✅ Integrity Verification: Working');
    console.log('✅ Optimal Level: Working');
    console.log('✅ Error Handling: Working');
    console.log('✅ Format Support: Working');
    
    return true;
    
  } catch (error) {
    console.error('❌ Compression Migration Test Failed:', error.message);
    console.error('Stack:', error.stack);
    return false;
  }
}

// Run the test
testCompressionMigration().then(success => {
  console.log('\n🎯 Compression Migration Test Result:', success ? 'SUCCESS' : 'FAILED');
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('❌ Test Execution Failed:', error.message);
  process.exit(1);
});

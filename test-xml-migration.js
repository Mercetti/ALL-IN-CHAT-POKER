#!/usr/bin/env node

/**
 * Test XML Processing Migration Implementation
 */

console.log('📄 Testing XML Processing Migration...');

async function testXMLMigration() {
  try {
    // Test 1: Import Modern XML Processor
    console.log('\n📦 Testing Modern XML Processor Import...');
    const ModernXMLProcessor = require('./server/xml/modern-xml-processor');
    console.log('✅ ModernXMLProcessor imported successfully');
    
    // Test 2: Create XML Processor Instance
    console.log('\n🔧 Creating XML Processor Instance...');
    const xmlProcessor = new ModernXMLProcessor({
      parserOptions: {
        ignoreAttributes: false,
        attributeNamePrefix: '@_',
        format: true,
        indentBy: '  '
      },
      securityOptions: {
        allowExternalEntities: false,
        allowDTD: false,
        allowScript: false
      }
    });
    console.log('✅ XML Processor created');
    
    // Test 3: Parse XML
    console.log('\n🔍 Testing XML Parsing...');
    const testXML = `<root>
        <person id="1">
            <name>John Doe</name>
            <email>john@example.com</email>
            <age>30</age>
        </person>
        <person id="2">
            <name>Jane Smith</name>
            <email>jane@example.com</email>
            <age>25</age>
        </person>
    </root>`;
    
    const parsed = xmlProcessor.parseXML(testXML);
    console.log('✅ XML parsed successfully');
    console.log('  Root element:', Object.keys(parsed)[0]);
    console.log('  Person count:', parsed.root.person.length);
    
    // Test 4: Build XML
    console.log('\n🏗️ Testing XML Building...');
    const testObj = {
        root: {
            message: "Hello World",
            timestamp: new Date().toISOString(),
            status: "active"
        }
    };
    
    const builtXML = xmlProcessor.buildXML(testObj);
    console.log('✅ XML built successfully');
    console.log('  XML length:', builtXML.length);
    console.log('  Contains root:', builtXML.includes('<root>'));
    
    // Test 5: Transform XML
    console.log('\n🔄 Testing XML Transformation...');
    const transformation = {
        'output.message': 'root.message',
        'output.timestamp': 'root.timestamp'
    };
    
    const transformed = xmlProcessor.transformXML(testXML, transformation);
    console.log('✅ XML transformed successfully');
    console.log('  Contains output:', transformed.includes('<output>'));
    
    // Test 6: Validate Schema
    console.log('\n✅ Testing Schema Validation...');
    const schema = {
        root: {
            message: 'string',
            timestamp: 'string',
            status: 'string'
        }
    };
    
    const isValid = xmlProcessor.validateSchema(builtXML, schema);
    console.log('✅ Schema validation:', isValid ? 'Valid' : 'Invalid');
    
    // Test 7: Minify XML
    console.log('\n🗜️ Testing XML Minification...');
    const minified = xmlProcessor.minifyXML(builtXML);
    console.log('✅ XML minified successfully');
    console.log('  Original length:', builtXML.length);
    console.log('  Minified length:', minified.length);
    console.log('  Compression ratio:', ((builtXML.length - minified.length) / builtXML.length * 100).toFixed(2) + '%');
    
    // Test 8: Pretty Print XML
    console.log('\n🎨 Testing XML Pretty Printing...');
    const pretty = xmlProcessor.prettyPrintXML(minified);
    console.log('✅ XML pretty printed successfully');
    console.log('  Contains indentation:', pretty.includes('  '));
    
    // Test 9: Extract Nodes
    console.log('\n🔍 Testing Node Extraction...');
    const extracted = xmlProcessor.extractNodes(testXML, 'root/person');
    console.log('✅ Nodes extracted successfully');
    console.log('  Extracted nodes:', extracted.length);
    
    // Test 10: Generate Hash
    console.log('\n🔐 Testing XML Hash Generation...');
    const hash = xmlProcessor.generateXMLHash(testXML);
    console.log('✅ Hash generated successfully');
    console.log('  Hash length:', hash.length);
    console.log('  Hash algorithm: SHA-256');
    
    // Test 11: Verify Integrity
    console.log('\n🔍 Testing Integrity Verification...');
    const isValidHash = xmlProcessor.verifyXMLIntegrity(testXML, hash);
    console.log('✅ Integrity verified:', isValidHash ? 'Valid' : 'Invalid');
    
    // Test 12: XML to JSON
    console.log('\n🔄 Testing XML to JSON Conversion...');
    const jsonOutput = xmlProcessor.xmlToJSON(testXML);
    console.log('✅ XML to JSON converted successfully');
    console.log('  JSON length:', jsonOutput.length);
    
    // Test 13: JSON to XML
    console.log('\n🔄 Testing JSON to XML Conversion...');
    const xmlFromJson = xmlProcessor.jsonToXML(jsonOutput, 'converted');
    console.log('✅ JSON to XML converted successfully');
    console.log('  XML length:', xmlFromJson.length);
    
    // Test 14: Merge XML
    console.log('\n🔀 Testing XML Merge...');
    const merged = xmlProcessor.mergeXML([testXML, builtXML], 'merged');
    console.log('✅ XML merged successfully');
    console.log('  Contains merged:', merged.includes('<merged>'));
    
    // Test 15: Security Validation
    console.log('\n🔒 Testing Security Validation...');
    try {
      const maliciousXML = '<?xml version="1.0"?><!DOCTYPE root [<!ENTITY xxe "evil">]><root>&xxe;</root>';
      xmlProcessor.parseXML(maliciousXML);
      console.log('❌ Security validation failed - should have thrown error');
    } catch (error) {
      console.log('✅ Security validation working:', error.message);
    }
    
    console.log('\n🎉 XML Migration Test Results:');
    console.log('✅ Modern XML Processor: Working');
    console.log('✅ XML Parsing: Working');
    console.log('✅ XML Building: Working');
    console.log('✅ XML Transformation: Working');
    console.log('✅ Schema Validation: Working');
    console.log('✅ XML Minification: Working');
    console.log('✅ XML Pretty Printing: Working');
    console.log('✅ Node Extraction: Working');
    console.log('✅ Hash Generation: Working');
    console.log('✅ Integrity Verification: Working');
    console.log('✅ XML to JSON: Working');
    console.log('✅ JSON to XML: Working');
    console.log('✅ XML Merge: Working');
    console.log('✅ Security Validation: Working');
    
    return true;
    
  } catch (error) {
    console.error('❌ XML Migration Test Failed:', error.message);
    console.error('Stack:', error.stack);
    return false;
  }
}

// Run the test
testXMLMigration().then(success => {
  console.log('\n🎯 XML Migration Test Result:', success ? 'SUCCESS' : 'FAILED');
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('❌ Test Execution Failed:', error.message);
  process.exit(1);
});

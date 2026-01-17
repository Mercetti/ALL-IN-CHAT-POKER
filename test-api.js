const http = require('http');

// Test API endpoint
const testOptions = {
  hostname: 'localhost',
  port: 8080,
  path: '/api/acey/control',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ command: 'start' })
};

const req = http.request(testOptions, (res) => {
  console.log('STATUS:', res.statusCode);
  console.log('HEADERS:', res.headers);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('RESPONSE BODY:', data);
    try {
      const parsed = JSON.parse(data);
      console.log('PARSED RESPONSE:', parsed);
    } catch (e) {
      console.log('PARSE ERROR:', e.message);
    }
  });
});

req.on('error', (e) => {
  console.log('REQUEST ERROR:', e.message);
});

req.end();

console.log('Sending test request to API...');

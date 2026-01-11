const loadtest = require('loadtest');

function testEndpointLoad(url, concurrency=10, maxRequests=100) {
  return new Promise((resolve, reject) => {
    loadtest.loadTest({
      url,
      concurrency,
      maxRequests,
      statusCallback: (error, result) => {
        if (error) return reject(error);
        if (result.totalErrors > 0) {
          reject(new Error(`Load test failed with ${result.totalErrors} errors`));
        }
        resolve();
      }
    });
  });
}

module.exports = testEndpointLoad;

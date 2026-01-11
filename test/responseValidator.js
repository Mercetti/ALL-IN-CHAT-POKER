const axios = require('axios');

async function validateEndpointResponse(url, method='GET', expectedStatus=200) {
  const response = await axios({ method, url });
  if (response.status !== expectedStatus) {
    throw new Error(`Endpoint ${url} returned ${response.status}, expected ${expectedStatus}`);
  }
}

module.exports = validateEndpointResponse;

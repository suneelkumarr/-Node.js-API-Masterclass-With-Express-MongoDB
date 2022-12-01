const NodeGeocoder = require('node-geocoder');
//https://github.com/webmakaka/Node.js-API-Masterclass-With-Express-MongoDB/tree/master/app/api

const options = {
    provider: process.env.GEOCODER_PROVIDER,
    httpAdapter: 'https',
    apiKey: process.env.GEOCODER_API_KEY,
    formatter: null,
};

const geocoder = NodeGeocoder(options);

module.exports = geocoder;
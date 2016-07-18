/**
 * apiKey.js
 * Jang Ryeol, ryeolj5911@gmail.com
 *
 * credential field for making tokens
 *
 * --- To reissue token for specific platform
 *    (e.g. platform api-key stolen),
 * just change the key_version to invalidate all tokens from the platform.
 *
 * --- To issue api tokens,
 * $ node apiKey.js list
 */
var jwt = require('jsonwebtoken');
var secretKey = require('./secretKey');

var api_list = {
    ios : {
      string : "ios",
      key_version : "0"
    },
    web : {
      string : "web",
      key_version : "0"
    },
    android : {
      string : "android",
      key_version : "0"
    },
    test : {
      string : "test",
      key_version : "0"
    }
};

var issueKey = function(api_obj) {
  return jwt.sign(api_obj, secretKey.jwtSecret);
};

/**
 * validate api key
 * @param api_key
 * @returns {Promise}
 */
var validateKey = function(api_key) {
  if (process.env.NODE_ENV == 'mocha')
    return new Promise(function(resolve, reject) {
      resolve();
    });
  return new Promise(function(resolve, reject){
    jwt.verify(api_key, secretKey.jwtSecret, function(err, decoded) {
      if (err) return reject("invalid api key");
      if (!decoded.string || !decoded.key_version) return reject("invalid api key");
      if (api_list[decoded.string] &&
        api_list[decoded.string].key_version == decoded.key_version)
        return resolve();
    });
  })
};

if (!module.parent) {
  if (process.argv.length != 3 || process.argv[2] != "list") {
    console.log("Invalid arguments");
    console.log("usage: $ node apiKey.js list");
    process.exit(1);
  }

  for (var api in api_list) {
    if (api_list.hasOwnProperty(api)) {
      console.log(api_list[api].string);
      console.log("\n"+issueKey(api_list[api])+"\n");
    }
  }
}

module.exports = {validateKey : validateKey};
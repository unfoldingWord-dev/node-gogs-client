var url = require('url');
var https = require('https');
var http = require('http');

module.exports = Requester;

/**
 * Generates the authentication parameter for the user
 * Preference will be given to the token if it exists
 * @param user the use used for authentication. Requires token or username and password
 * @return {string|null} the properly formatted authentication string
 */
function encodeUserAuth(user) {
  if (!user) {
    return null;
  }

  var token = user.token;
  if (token) {
    var sha1 = typeof token === 'object' ? token.sha1 : token;
    return 'token ' + sha1;
  }
  
  return 'Basic ' + new Buffer(user.username + ':' + user.password, 'UTF-8').toString('base64');
}

function Requester (apiUrl) {
  var parsedUrl = url.parse(apiUrl.replace(/\/+$/, '') + '/', false, true);
  var serverHost = parsedUrl.hostname;
  var makeRequest = parsedUrl.protocol === 'https:' ? https.request.bind(https) : http.request.bind(http);
  var serverPort = parsedUrl.port ? parsedUrl.port : parsedUrl.protocol === 'https:' ? 443 : 80;
  var apiPath = parsedUrl.pathname;

  /**
   * Performs a request against the api
   * @param partialUrl the api command
   * @param user {object|null} the user authenticating this request. Requires token or username and password
   * @param postData {object|null} if not null the request will POST the data otherwise it will be a GET request
   * @param requestMethod {string|null} if null the requests will default to POST or GET
   * @return {Promise<string>}
   */
  return function request (partialUrl, user, postData, requestMethod) {
    var auth = encodeUserAuth(user);
    var method = postData ? 'POST' : 'GET';
    method = requestMethod ? requestMethod.toUpperCase() : method;

    var options = {
      host: serverHost,
      path: url.resolve(apiPath, partialUrl.replace(/^\/+/, '')),
      port: serverPort,
      method: method,
      headers: {'Content-Type': 'application/json'}
    };

    if (auth) {
      options.headers['Authorization'] = auth;
    }

    return new Promise(function (resolve, reject) {

      var req = makeRequest(options, function (response) {
        var data = '';

        response.on('data', function (chunk) {
          data += chunk;
        });

        response.on('end', function () {
          resolve({
            status: response.statusCode,
            data: data
          });
        });
      });

      req.on('error', reject);

      if (postData) {
        req.write(JSON.stringify(postData))
      }

      req.end();
    });
  };
}

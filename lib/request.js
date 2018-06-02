var axios = require('axios')
var base64 = require('base-64');

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

  return 'Basic ' + base64.encode(user.username + ':' + user.password)
}

function Requester (apiUrl) {
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
      url: apiUrl.replace(/\/$/, '') + '/' + partialUrl.replace(/^\//, ''),
      method: method,
      data: postData,
      headers: {'Content-Type': 'application/json'}
    };

    if (auth) {
      options.headers['Authorization'] = auth;
    }

    return new Promise(function (resolve, reject) {
      axios(options).then(function (response) {
        resolve({
          status: response.status,
          data: response.data
        });
      }).catch(function (error) {
        reject(error.response)
      })
    });
  };
}

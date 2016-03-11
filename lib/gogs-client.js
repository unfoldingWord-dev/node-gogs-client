/**
 * Created by joel on 3/9/2016.
 */
'use strict';
let _ = require('lodash'),
  url = require('url'),
  https = require('https'),
  http = require('http');

module.exports = API;

/**
 * Represents an instance of a gogs api
 * @param apiUrl {string} the api end point e.g. 'https://try.gogs.io/api/v1'
 * @returns {API}
 * @constructor
 */
function API(apiUrl) {
  let _this = this;
  let parsedUrl = url.parse(apiUrl.replace(/\/+$/, '') + '/', false, true);
  _this.serverHost = parsedUrl.host;
  _this.serverProtocal = parsedUrl.protocol;
  _this.apiPath = parsedUrl.pathname;

  /**
   * Performs a request against the api
   * @param partialUrl the api command
   * @param user {object|null} the user authenticating this request
   * @param postData {object|null} if not null the request will POST the data otherwise it will be a GET request
   * @param requestMethod {string|null} if null the requests will default to POST or GET
   * @return {Promise<string>}
   */
  function request(partialUrl, user, postData, requestMethod) {
    return new Promise(function(resolve, reject) {
      let auth = encodeUserAuth(user);
      let method = _.isNil(postData) ? 'GET' : 'POST';
      method = _.isNil(requestMethod) ? method : requestMethod.toUpperCase();

      let options = {
        host: _this.serverHost,
        path: url.resolve(_this.apiPath, partialUrl),
        method: method,
        headers: {'Content-Type': 'application/json'}
      };

      if(!_.isNull(auth)) {
        options.headers['Authorization'] = auth;
      }

      let callback = function (response) {
        let data = '';
        response.on('data', function (chunk) {
          data += chunk;
        });
        response.on('end', function () {
          resolve({
            status: response.statusCode,
            data: data
          });
        });
      };

      let req;
      if(_this.serverProtocal === 'https:') {
        req = https.request(options, callback);
      } else {
        req = http.request(options, callback);
      }

      if(!_.isNil(postData)) {
        req.write(JSON.stringify(postData))
      }

      req.end();
    });
  }

  /**
   * Generates the authentication parameter for the user
   * Preference will be given to the token if it exists
   * @param user
   * @return {string|null}
   */
  function encodeUserAuth(user) {
    let token =_.get(user, 'token', null),
      username = _.get(user, 'username', null),
      password = _.get(user, 'password', null);
    if(!_.isNil(token)) {
      return 'token ' + token;
    } else if(!_.isNil(username) && !_.isNil(password)) {
      return 'Basic ' + new Buffer(username + ':' + password, 'UTF-8').toString('base64');
    }
    return null;
  }

  /**
   *
   * @param user {object} user to be created
   * @param authUser {object} user performing this request
   * @param notify {boolean} send notification email to user
   * @return {Promise<object>} the newly created user
   */
  _this.createUser = function(user, authUser, notify) {
    return new Promise(function(resolve, reject) {
      request('admin/users', authUser, {
        username: _.get(user, 'username', ''),
        email: _.get(user, 'email', ''),
        password: _.get(user, 'password', ''),
        send_notify: notify
      }, null).then(function(response) {
        if(response.status == 201) {
          resolve(JSON.parse(response.data));
        } else {
          reject(response);
        }
      }).catch(reject);
    });
  };

  /**
   * Deletes a user
   * @param user the user to delete. We just need the username
   * @param authUser the user authenticating this request. Users cannot delete themselves
   * @returns {Promise<boolean>}
   */
  _this.deleteUser = function(user, authUser) {
    return new Promise(function(resolve, reject) {
      if (!_.isNil(user) && !_.isNil(authUser) && user.username !== authUser.username) {
        request('admin/users/' + user.username, authUser, null, 'DELETE').then(function (response) {
          response.status === 204 ? resolve() : reject(response);
        });
      }
      reject();
    });
  };

  /**
   * Searches for users that match the query
   * @param query
   * @param limit the maximum number of results to return
   * @param authUser the user to authenticate as. If null the email fields will be empty in the result
   * @returns {Promise<array>}
   */
  _this.searchUsers = function(query, limit, authUser) {
    return new Promise(function(resolve, reject) {
      if(!_.isNil(query) && !_.isEmpty(query.trim())) {
        request('users/search?q=' + query + '&limit=' + limit, authUser, null, null).then(function(response) {
          if(response.status === 200) {
            let data = JSON.parse(response.data);
            _.get(data, 'ok', false) ? resolve(data.data) : reject(response);
          } else {
            reject(response);
          }
        });
      } else {
        resolve([]);
      }
    });
  };

  /**
   * Retrieves a user
   * @param user the user to retrieve
   * @param authUser the user to authenticate as. If null the email field in the response will be empty
   * @returns {Promise<object>}
   */
  _this.getUser = function(user, authUser) {
    return new Promise(function(resolve, reject) {
      if(!_.isNil(user)) {
        request('users/' + user.username, authUser, null, null).then(function(response) {
          if(response.status === 200) {
            resolve(JSON.parse(response.data));
          } else {
            reject(response);
          }
        });
      } else {
        resolve(null);
      }
    });
  };

  /**
   * Searches for public repositories that match the query
   * @param query
   * @param uid id of the user whose repositories will be searched. 0 will search all
   * @param limit maximum results to return
   * @returns {Promise}
   */
  _this.searchRepos = function(query, uid, limit) {
    return new Promise(function(resolve, reject) {
      if(!_.isNil(query) && !_.isEmpty(query)) {
        request('repos/search?q=' + query + '&uid=' + uid + '&limit=' + limit, null, null, null).then(function(response) {
          if(response.status === 200) {
            let data = JSON.parse(response.data);
            _.get(data, 'ok', false) ? resolve(data.data) : reject(response);
          } else {
            reject(response);
          }
        });
      } else {
        resolve([]);
      }
    });
  };

  _this.createRepo = function(repo, user) {
    return new Promise(function(resolve, reject) {
      if(!_.isNil(repo) && !_.isNil(user)) {
        request('user/repos', user, {
          name: repo.name,
          description: repo.description,
          private: repo.private
        }, null).then(function(response) {
          if(response.status === 201) {
            resolve(JSON.parse(response.data));
          } else {
            reject(response);
          }
        });
      } else {
        reject();
      }
    });
  };

  _this.listRepos = function(user) {
    return new Promise(function(resolve, reject) {
      if(!_.isNil(user)) {
        request('user/repos', user, null, null).then(function(response) {
          if(response.status === 200) {
            resolve(JSON.parse(response.data));
            //let data = JSON.parse(response.data);
            //_.get(data, 'ok', false) ? resolve(data.data) : reject(response);
          } else {
            reject(response);
          }
        });
      } else {
        resolve([]);
      }
    });
  };

  /**
   * Deleates a repository from the user
   * @param repo the repository to delete
   * @param user the user that owns the repository
   * @returns {Promise}
   */
  _this.deleteRepo = function(repo, user) {
    return new Promise(function(resolve, reject) {
      if(!_.isNil(repo) && !_.isEmpty(user)) {
        request('repos/' + user.username + '/' + repo.name, user, null, 'delete').then(function(response) {
          response.status === 204 ? resolve() : reject(response);
        });
      } else {
        reject();
      }
    });
  };

  return _this;
}
/**
 * Created by joel on 3/9/2016.
 */
var url = require('url'),
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
  var _this = this;
  var parsedUrl = url.parse(apiUrl.replace(/\/+$/, '') + '/', false, true);
  _this.serverHost = parsedUrl.hostname;
  _this.serverProtocal = parsedUrl.protocol;
  _this.serverPort = parsedUrl.port ? parsedUrl.port : parsedUrl.protocol === 'https:' ? 443 : 80;
  _this.apiPath = parsedUrl.pathname;

  /**
   * Performs a request against the api
   * @param partialUrl the api command
   * @param user {object|null} the user authenticating this request. Requires token or username and password
   * @param postData {object|null} if not null the request will POST the data otherwise it will be a GET request
   * @param requestMethod {string|null} if null the requests will default to POST or GET
   * @return {Promise<string>}
   */
  function request(partialUrl, user, postData, requestMethod) {
    partialUrl = partialUrl || null;
    user = user || null;
    postData = postData || null;
    requestMethod = requestMethod || null;
    if(partialUrl === null) {
      return Promise.reject('The url parameter is required');
    }

    return new Promise(function(resolve, reject) {
      var auth = encodeUserAuth(user);
      var method = postData === null ? 'GET' : 'POST';
      method = requestMethod === null ? method : requestMethod.toUpperCase();

      var options = {
        host: _this.serverHost,
        path: url.resolve(_this.apiPath, partialUrl.replace(/^\/+/, '')),
        port: _this.serverPort,
        method: method,
        headers: {'Content-Type': 'application/json'}
      };

      if(auth !== null) {
        options.headers['Authorization'] = auth;
      }

      var callback = function (response) {
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
      };

      var req;
      if(_this.serverProtocal === 'https:') {
        req = https.request(options, callback);
      } else {
        req = http.request(options, callback);
      }

      if(postData !== null) {
        req.write(JSON.stringify(postData))
      }

      req.end();
    });
  }

  /**
   * Generates the authentication parameter for the user
   * Preference will be given to the token if it exists
   * @param user the use used for authentication. Requires token or username and password
   * @return {string|null} the properly formatted authentication string
   */
  function encodeUserAuth(user) {
    user = user || null;
    if(user !== null) {
      var token = getProp(user, 'token', null),
        username = getProp(user, 'username', null),
        password = getProp(user, 'password', null);
      if (token !== null) {
        // TRICKY: support tokens as the sha1 string or as the full object
        var sha1 = typeof token === 'object' ? getProp(token, 'sha1', null) : token;
        if(sha1 !== null) {
          return 'token ' + sha1;
        }
      } else if (username !== null && password !== null) {
        return 'Basic ' + new Buffer(username + ':' + password, 'UTF-8').toString('base64');
      }
    }
    return null;
  }

  /**
   * Creates a new user account
   * @param user {object} the user to be created. Requires username, email, password
   * @param authUser {object} the user authenticating this request. Requires token or username and password
   * @param notify {boolean} send notification email to user
   * @return {Promise<object>} the newly created user
   */
  _this.createUser = function(user, authUser, notify) {
	user.send_notify = !!notify;
	return request('admin/users', authUser, user, null).then(function(response) {
		if(response.status > 201) {
			throw response;
		}
		return JSON.parse(response.data);
	});
  };

  /**
   * Edits the details on an existing user account
   * @param user {object} the user who's information will be updated. Requires username (note: the username cannot be changed)
   * @param authUser {object} the user authenticating this request. Requires token or username and password
   * @returns {Promise<object>} the updated user object
     */
  _this.editUser = function(user, authUser) {
	if(!user || !authUser) {
		return Promise.reject('missing arguments');
	}
	return request('admin/users/' + user.username, authUser, user, 'PATCH').then(function (response) {
		if(response.status > 200) {
			throw response;
		}
		return JSON.parse(response.data);
	});
  }

  /**
   * Deletes a user
   * @param user {object} the user to delete. Requires username
   * @param authUser {object} the user authenticating this request. Users cannot delete themselves. Requires token or username and password
   * @returns {Promise} resolves if successful
   */
  _this.deleteUser = function(user, authUser) {
	if(!user || !authUser) {
		return Promise.reject('missing arguments');
	}
	return request('admin/users/' + user.username, authUser, null, 'DELETE').then(function (response) {
		if(response.status > 204) {
			throw response;
		}
		return;
	});
  };

  /**
   * Searches for users that match the query
   * @param query {string}
   * @param limit {int} the maximum number of results to return
   * @param authUser {object} the user authenticating this request. If null the email fields will be empty in the result. Requires token or username and password
   * @returns {Promise<array>} an array of user objects
   */
  _this.searchUsers = function(query, limit, authUser) {
	limit = limit || 5;
	if(!query) {
		return Promise.resolve([]);
	}
	return request('users/search?q=' + query + '&limit=' + limit, authUser, null, null).then(function(response) {
		if(response.status > 200) {
			throw response;
		}
		var data = JSON.parse(response.data);
		if(!getProp(data, 'ok', false)) {
			throw response;
		}
		return data.data;
	});
  };

  /**
   * Retrieves a user
   * @param user {object} the user to retrieve. Requires username
   * @param authUser {object} the user to authenticate as. If null the email field in the response will be empty. Requires token or username and password
   * @returns {Promise<object>} the found user object
   */
  _this.getUser = function(user, authUser) {
	if(!user) {
		return Promise.reject('missing arguments');
	}
	return request('users/' + user.username, authUser, null, null).then(function(response) {
		if(response.status > 200) {
			throw response;
		} else {
			return JSON.parse(response.data);
		}
	});
  };

  /**
   * Searches for public repositories that match the query
   * @param query {string}
   * @param uid {int} the id of the user whose repositories will be searched. 0 will search all
   * @param limit {int} the maximum number of results to return
   * @returns {Promise<array>} an array of repository objects
   */
  _this.searchRepos = function(query, uid, limit) {
	if(!query) {
		return Promise.resolve([]);
	}
	uid = uid || 0;
	limit = limit || 10;
	return request('repos/search?q=' + query + '&uid=' + uid + '&limit=' + limit, null, null, null).then(function(response) {
		if(response.status > 200) {
			throw response;
		}
		var data = JSON.parse(response.data);
		if(!getProp(data, 'ok', false)) {
			throw response;
		}
		return data.data;
	});
  };

  /**
   * Creates a new repository for the user
   * @param repo {object} the repository being created. Requires name, description, private
   * @param user {object} the user creating the repository. Requires token or username and password
   * @returns {Promise<object>} the new repository object
     */
  _this.createRepo = function(repo, user) {
    if(!repo || !user) {
		return Promise.reject('missing arguments');
	}
	return request('user/repos', user, {
		name: repo.name,
		description: repo.description,
		private: repo.private
	}, null).then(function(response) {
		if(response.status > 201) {
			throw response;
		}
		return JSON.parse(response.data);
	});
  };

  /**
   * Returns an array of repositories this user has access to
   * @param user {object} the user who's repositories will be listed. Requires token or username and password
   * @returns {Promise<array>} an array of repository objects
   */
  _this.listRepos = function(user) {
	if(!user) {
		return Promise.resolve([]);
	}
	return request('user/repos', user, null, null).then(function(response) {
		if(response.status > 200) {
			throw response;
		} else {
			return JSON.parse(response.data);
		}
	});
  };

  /**
   * Deletes a repository from the user
   * @param repo {object} the repository to delete. Requires name
   * @param user {object} the user that owns the repository. Requires token or username and password
   * @returns {Promise} resolves if successful
   */
  _this.deleteRepo = function(repo, user) {
	if(!user || !repo) {
		return Promise.reject('missing arguments');
	}
	return request('repos/' + user.username + '/' + repo.name, user, null, 'DELETE').then(function(response) {
		if(response.status > 204) {
			throw response;
		}
		return;
	});
  };

  /**
   * Creates an authentication token for the user
   * @param token {object} the token to be created. Requires name
   * @param user {object} the user creating the token. Requires username, token or password
   * @returns {Promise<object>} the new token object
   */
  _this.createToken = function(token, user) {
	if(!token || !user) {
		return Promise.reject('missing arguments');
	}

	return request('users/' + user.username + '/tokens', user, {
		name: token.name
	}, null).then(function(response) {
		if(response.status > 201) {
			throw response;
		} 
		return JSON.parse(response.data);
	});
  };

  /**
   * Returns an array of tokens the user has
   * @param user {object} the user who's tokens will be listed. Requires username, password
   * @returns {Promise<array>} an array of token objects
   */
  _this.listTokens = function(user) {
	if(!user) {
		return Promise.reject('missing arguments');
	}
	return request('users/' + user.username + '/tokens', user, null, null).then(function(response) {
		if(response.status > 200) {
			throw response;
		}
		return JSON.parse(response.data);
	});
  };

  /**
   * Creates a public key for the user
   * @param key {object} the key to be created. Requires title, key
   * @param user {object} the user creating the key. Requires token or username and password
   * @returns {Promise<object>} the new public key object
   */
  _this.createPublicKey = function(key, user) {
	if(!key || !user) {
		return Promise.reject('missing arguments');
	}
	return request('user/keys', user, {
		title:key.title,
		key:key.key
	}, null).then(function(response) {
		if(response.status > 201) {
			throw response;
		}
		return JSON.parse(response.data);
	});
  };

  /**
   * Returns an array of public keys that belong to the user
   * @param user {object} the user who's public keys will be listed. Requires username, token or password
   * @returns {Promise<array>} an array of public key objects
   */
  _this.listPublicKeys = function(user) {
	if(!user) {
		return Promise.reject('missing arguments');
	}
	return request('users/' + user.username + '/keys', user, null, null).then(function(response) {
		if(response.status > 200) {
			throw response;
		}
		return JSON.parse(response.data);
	});
  };

  /**
   * Returns the full details for a public key
   * @param key {object} the key that will be retrieved. Requires id
   * @param user {object} the user who's key will be retrieved. Requires token or username and password
   * @returns {Promise<object>} the public key object
   */
  _this.getPublicKey = function(key, user) {
	if(!key || !user) {
		return Promise.reject('missing arguments');
	}
	return request('user/keys/' + key.id, user, null, null).then(function(response) {
		if(response.status > 200) {
			throw response;
		}
		return JSON.parse(response.data);
	});
  };

  /**
   * Deletes a public key from the user
   * @param key {object} the key to be deleted. Requires id
   * @param user {object} the user who's key will be deleted. Requires token or username and password
   * @returns {Promise} resolves if successful
     */
  _this.deletePublicKey = function(key, user) {
	if(!key || !user) {
		return Promise.reject('missing arguments');
	}
	return request('user/keys/' + key.id, user, null, 'DELETE').then(function(response) {
		if(response.status > 204) {
			throw response;
		}
	    return;
	});
  };

  return _this;
}

/**
 * Utility that returns the value of a property or the default if it does not exist
 * @param obj {object} the object who's property will be returned
 * @param prop {string} the property name
 * @param defaultVal {*} the default value of the property
 * @returns {*} the property or the default value
 */
function getProp(obj, prop, defaultVal) {
  if(obj.hasOwnProperty(prop)) {
    return obj[prop];
  } else {
    return defaultVal;
  }
}

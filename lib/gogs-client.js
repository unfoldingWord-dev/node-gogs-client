/**
 * Created by joel on 3/9/2016.
 */
var stat = require('./stat');
var Requester = require('./request');

module.exports = API;

/**
 * Represents an instance of a gogs api
 * @param apiUrl {string} the api end point e.g. 'https://try.gogs.io/api/v1'
 * @param requester {Function|undefined} Optional requester module. 
 * @returns {API}
 * @constructor
 */
function API (apiUrl, requester) {
  var _this = this;
  _this.apiUrl = apiUrl;

  // Dependency injection. Allow a custom request module.
  var request = requester ? requester(apiUrl) : Requester(apiUrl);

  /**
   * Creates a new user account
   * @param user {object} the user to be created. Requires username, email, password
   * @param authUser {object} the user authenticating this request. Requires token or username and password
   * @param notify {boolean} send notification email to user
   * @return {Promise<object>} the newly created user
   */
  _this.createUser = function (user, authUser, notify) {
    user.send_notify = notify;

    return request('admin/users', authUser, user).then(stat.checkCreatedResponse);
  };

  /**
   * Edits the details on an existing user account
   * @param user {object} the user who's information will be updated. Requires username (note: the username cannot be changed)
   * @param authUser {object} the user authenticating this request. Requires token or username and password
   * @returns {Promise<object>} the updated user object
     */
  _this.editUser = function (user, authUser) {
    return request('admin/users/' + user.username, authUser, user, 'PATCH').then(stat.checkStandardResponse);
  };

  /**
   * Deletes a user
   * @param user {object} the user to delete. Requires username
   * @param authUser {object} the user authenticating this request. Users cannot delete themselves. Requires token or username and password
   * @returns {Promise} resolves if successful
   */
  _this.deleteUser = function (user, authUser) {
    if (user.username === authUser.username) {
      return Promise.reject('Users cannot delete themselves!');
    }
      
    return request('admin/users/' + user.username, authUser, null, 'DELETE').then(stat.checkNoContentResponse);
  };

  /**
   * Searches for users that match the query
   * @param query {string}
   * @param limit {int} the maximum number of results to return
   * @param authUser {object} the user authenticating this request. If null the email fields will be empty in the result. Requires token or username and password
   * @returns {Promise<array>} an array of user objects
   */
  _this.searchUsers = function (query, limit, authUser) {
    limit = limit || 10; // no zero limit allowed

    return request('users/search?q=' + query + '&limit=' + limit, authUser).then(stat.checkOkResponse);
  };

  /**
   * Retrieves a user
   * @param user {object} the user to retrieve. Requires username
   * @param authUser {object} the user to authenticate as. If null the email field in the response will be empty. Requires token or username and password
   * @returns {Promise<object>} the found user object
   */
  _this.getUser = function (user, authUser) {
    return request('users/' + user.username, authUser).then(stat.checkStandardResponse);
  };

  /**
   * Searches for public repositories that match the query
   * @param query {string}
   * @param uid {int} the id of the user whose repositories will be searched. 0 will search all
   * @param limit {int} the maximum number of results to return
   * @returns {Promise<array>} an array of repository objects
   */
  _this.searchRepos = function (query, uid, limit) {
    uid = uid || 0;
    limit = limit || 10;

    return request('repos/search?q=' + query + '&uid=' + uid + '&limit=' + limit).then(stat.checkOkResponse);
  };

  /**
   * Creates a new repository for the user
   * @param repo {object} the repository being created. Requires name, description, private
   * @param user {object} the user creating the repository. Requires token or username and password
   * @returns {Promise<object>} the new repository object
     */
  _this.createRepo = function (repo, user) {
    return request('user/repos', user, {
      name: repo.name,
      description: repo.description,
      private: repo.private
    }, null).then(stat.checkCreatedResponse);
  };

  /**
   * Returns information about a single repository
   * @param repo {object} the repository that will be retrieved. Requires full_name
   * @param authUser {object} the user authenticating this request. Requires username, password or token
   * @returns {Promise<object>} the repository object
   */
  _this.getRepo = function (repo, authUser) {
	return request('repos/' + repo.full_name, authUser).then(stat.checkStandardResponse);
  };

  /**
   * Returns an array of repositories this user has access to
   * @param user {object} the user who's repositories will be listed. Requires token or username and password
   * @returns {Promise<array>} an array of repository objects
   */
  _this.listRepos = function (user) {
    return request('user/repos', user).then(stat.checkStandardResponse);
  };

  /**
   * Deletes a repository from the user
   * @param repo {object} the repository to delete. Requires name
   * @param user {object} the user that owns the repository. Requires token or username and password
   * @returns {Promise} resolves if successful
   */
  _this.deleteRepo = function (repo, user) {
    return request('repos/' + user.username + '/' + repo.name, user, null, 'DELETE').then(stat.checkNoContentResponse);
  };

  /**
   * Creates an authentication token for the user
   * @param token {object} the token to be created. Requires name
   * @param user {object} the user creating the token. Requires username, token or password
   * @returns {Promise<object>} the new token object
   */
  _this.createToken = function (token, user) {
    return request('users/' + user.username + '/tokens', user, {name: token.name}).then(stat.checkCreatedResponse);
  };

  /**
   * Returns an array of tokens the user has
   * @param user {object} the user who's tokens will be listed. Requires username, password
   * @returns {Promise<array>} an array of token objects
   */
  _this.listTokens = function (user) {
    return request('users/' + user.username + '/tokens', user).then(stat.checkStandardResponse);
  };

  /**
   * Creates a public key for the user
   * @param key {object} the key to be created. Requires title, key
   * @param user {object} the user creating the key. Requires token or username and password
   * @returns {Promise<object>} the new public key object
   */
  _this.createPublicKey = function (key, user) {
    return request('user/keys', user, {
      title: key.title,
      key: key.key
    }).then(stat.checkCreatedResponse);
  };

  /**
   * Returns an array of public keys that belong to the user
   * @param user {object} the user who's public keys will be listed. Requires username, token or password
   * @returns {Promise<array>} an array of public key objects
   */
  _this.listPublicKeys = function (user) {
    return request('users/' + user.username + '/keys', user).then(stat.checkStandardResponse);
  };

  /**
   * Returns the full details for a public key
   * @param key {object} the key that will be retrieved. Requires id
   * @param user {object} the user who's key will be retrieved. Requires token or username and password
   * @returns {Promise<object>} the public key object
   */
  _this.getPublicKey = function (key, user) {
    return request('user/keys/' + key.id, user).then(stat.checkStandardResponse);
  };

  /**
   * Deletes a public key from the user
   * @param key {object} the key to be deleted. Requires id
   * @param user {object} the user who's key will be deleted. Requires token or username and password
   * @returns {Promise} resolves if successful
     */
  _this.deletePublicKey = function (key, user) {
    return request('user/keys/' + key.id, user, null, 'DELETE').then(stat.checkNoContentResponse);
  };

  return _this;
}

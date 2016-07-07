/**
 * Created by joel on 3/9/2016.
 */
'use strict';
;(function () {
  var assert = require('assert'),
      _ = require('lodash'),
      gogsAPI = require('../');

  var config = {};
  try {
    config = require('../tests/config');
  } catch (e) {
    console.info('Please provide ./tests/config.json to run tests');
    return;
  }

  describe('@Gogs', function() {
    this.timeout(10000);
    var api,
        demoUser = _.get(config, 'demoUser', {}),
        restrictedAdminUser = _.get(config, 'restrictedAdminUser', {}),
        adminUser = _.get(config, 'adminUser', {}),
        demoRepo = _.get(config, 'demoRepo', {}),
        fakeRepo = _.get(config, 'fakeRepo', {}),
        demoToken = _.get(config, 'demoToken', {}),
        demoKey = _.get(config, 'demoKey', {}),
        fakeUser = _.get(config, 'fakeUser', {});

    before(function(done) {
      api = new gogsAPI(_.get(config, 'api', 'https://try.gogs.io/api/v1'));
      done();
    });

    it('v1./v2. should create a user', function(done) {
      api.createUser(demoUser, adminUser, false).then(function(user) {
        assert.equal(user.username, demoUser.username);
        // The two assertions below are v2 api specific
        // assert.equal(user.full_name, demoUser.full_name);
        // assert(user.full_name !== '');
        done();
      }).catch(done);
    });

    it('should not create a user', function(done) {
      api.createUser(fakeUser, {}, false).then(function(user) {
        assert(false);
      }).catch(function(result) {
        assert(true);
        done();
      });
    });

    it('should update a user', function(done) {
      var fullName = 'My test full name';
      demoUser.full_name = fullName;
      api.editUser(demoUser, adminUser).then(function(user) {
        assert.equal(user.full_name, fullName);
		done();
      }).catch(done);
    });

    it('should search for users', function(done) {
      api.searchUsers(demoUser.username, 5, null).then(function(list) {
        assert(list.length > 0);
      }).then(done, done);
    });

    it('should retrieve the user without an email', function(done) {
      api.getUser(demoUser, null).then(function(user) {
        assert(user !== null);
        assert(_.isEmpty(user.email));
      }).then(done, done);
    });

    it('should retrieve the user with an email', function(done) {
      api.getUser(demoUser, adminUser).then(function(user) {
        assert(user !== null);
        assert(!_.isEmpty(user.email));
      }).then(done, done);
    });

    it('should not retrieve unknown user', function(done) {
      api.getUser(fakeUser, null).then(function(user) {
        assert(user === null);
      }).then(done, function(response) {
        // error handler
        assert(true);
        done();
      });
    });

    it('should search repositories', function(done) {
      var limit = 5;
      api.searchRepos('demo', 0, limit).then(function(list) {
        assert(list.length > 0);
        assert(list.length <= limit);
      }).then(done, done);
    });

    it('should create a repository', function(done) {
      api.createRepo(demoRepo, demoUser).then(function(repo) {
        assert(repo !== null);
        assert.equal(repo.full_name, demoUser.username + '/' + demoRepo.name);
      }).then(done, done);
    });

    it('should list a users repositories', function(done) {
      api.listRepos(demoUser).then(function(list) {
        assert(list.length > 0);
      }).then(done, done);
    });

    it('should get a repository', function(done) {
      api.searchRepos('d', 0, 5).then(function(list) {
        return api.getRepo(list[0], demoUser);
      }).then(function(repo) {
        assert(repo != null);
        assert(!_.isEmpty(repo.html_url));
        assert(!_.isEmpty(repo.clone_url));
        assert(!_.isEmpty(repo.ssh_url));
      }).then(done, done);
    });

    it('should delete a repository', function(done) {
      api.deleteRepo(demoRepo, demoUser).then(function() {
        assert(true);
      }).then(done, done);
    });

    it('should not delete a repository from unknown user', function(done) {
      api.deleteRepo(demoRepo, fakeUser).then(function() {
        assert(false);
      }).then(done, function(result) {
        assert(true);
        done();
      });
    });

    it('should not delete unknown repository', function(done) {
      api.deleteRepo(fakeRepo, demoUser).then(function() {
        assert(false);
      }).then(done, function(result) {
        assert(true);
        done();
      });
    });

    it('should create a token', function(done) {
      api.createToken(demoToken, demoUser).then(function(token) {
        assert(token != null);
        assert.equal(token.name, demoToken.name);
      }).then(done, done);
    });

    it('should list a user\'s tokens', function(done) {
      api.listTokens(demoUser).then(function(list) {
        assert(list.length > 0);
      }).then(done, done);
    });

    it('should get user using a token string', function(done) {
      api.listTokens(demoUser).then(function(list) {
        return api.getUser(demoUser, {username: demoUser.username, token: list[0].sha1})
      }).then(function(user) {
        assert(user != null);
        assert.equal(user.email, demoUser.email);
      }).then(done, done);
    });

    it('should get a user using a token object', function(done) {
      api.listTokens(demoUser).then(function(list) {
        return api.getUser(demoUser, {username: demoUser.username, token: list[0]})
      }).then(function(user) {
        assert(user != null);
        assert.equal(user.email, demoUser.email);
      }).then(done, done);
    });

    it('should create a public key', function(done) {
      api.createPublicKey(demoKey, demoUser).then(function(key) {
        assert(key != null);
        assert.equal(key.title, demoKey.title);
      }).then(done, done);
    });

    it('should list a user\'s public keys', function(done) {
      api.listPublicKeys(demoUser).then(function(list) {
        assert(list.length > 0);
      }).then(done, done);
    });

    it('should retrieve a user\'s public key', function(done) {
      api.listPublicKeys(demoUser).then(function(list) {
        return api.getPublicKey(list[0], demoUser)
      }).then(function(key) {
        assert(key != null);
      }).then(done, done);
    });

    it('should delete a user\'s public key', function(done) {
      api.listPublicKeys(demoUser).then(function(list) {
        return api.deletePublicKey(list[0], demoUser)
      }).then(function() {
        // ensure key was deleted
        return api.listPublicKeys(demoUser);
      }).then(function(list) {
        assert(list.length === 0);
		    done();
      }).catch(done);
    });

    it('should not allow user to delete self', function() {
      return api.deleteUser(demoUser, demoUser).then(assert.fail, function () {
        return 'passed!';
      });
    });

    it('should delete a user', function(done) {
      api.deleteUser(demoUser, adminUser).then(function() {
        assert(true);
      }).then(done, done);
    });

    it('should error when deleting unknown user', function(done) {
      api.deleteUser(fakeUser, adminUser).then(function() {
        assert(false);
      }).then(done, function(result) {
        assert.equal(result.status, 404);
        done();
      });
    });

    // it('v2. should create user with restricted token', function(done) {
    //   api.createUser(demoUser, restrictedAdminUser, false).then(function(user) {
    //     assert.equal(user.username, demoUser.username);
    //     // The two assertions below are v2 api specific
    //     assert.equal(user.full_name, demoUser.full_name);
    //     assert(user.full_name !== '');
    //   }).then(done, done);
    // });

    // it('v2. should not allow deleting user with restricted token', function(done) {
    //   api.deleteUser(demoUser, restrictedAdminUser).then(function() {
    //     assert(false);
    //   }).then(done, function(result) {
    //     assert.equal(result.status, 401);
    //     done();
    //   });
    // });

    // it('should delete a user.. cleanup', function(done) {
    //   api.deleteUser(demoUser, adminUser).then(function() {
    //     assert(true);
    //   }).then(done, done);
    // });

  });
})();

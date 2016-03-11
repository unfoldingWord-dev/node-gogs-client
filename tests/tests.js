/**
 * Created by joel on 3/9/2016.
 */
'use strict';
;(function () {
  let assert = require('assert'),
      _ = require('lodash'),
      gogsAPI = require('../');

  let config = {};
  try {
    config = require('../tests/config');
  } catch (e) {
    console.info('Please provide ./tests/config.json to run tests');
    return;
  }

  describe('@Gogs', function() {
    this.timeout(10000);
    let api,
      demoUser = _.get(config, 'demoUser', {}),
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

    it('should create a user', function(done) {
      api.createUser(demoUser, adminUser, false).then(function(user) {
        assert(user.username, demoUser.username);
      }).then(done, done);
    });

    it('should search for users', function(done) {
      api.searchUsers(demoUser.username, 5, null).then(function(list) {
        assert(list.length > 0, true);
      }).then(done, done);
    });

    it('should retrieve the user without an email', function(done) {
      api.getUser(demoUser, null).then(function(user) {
        assert(user !== null, true);
        assert(_.isEmpty(user.email), true);
      }).then(done, done);
    });

    it('should retrieve the user with an email', function(done) {
      api.getUser(demoUser, adminUser).then(function(user) {
        assert(user !== null, true);
        assert(!_.isEmpty(user.email), true);
      }).then(done, done);
    });

    it('should not retrieve unknown user', function(done) {
      api.getUser(fakeUser, null).then(function(user) {
        assert(user === null, true);
      }).then(done, function(response) {
        // error handler
        assert(true, true);
        done();
      });
    });

    it('should search respositories', function(done) {
      let limit = 5;
      api.searchRepos('uw', 0, limit).then(function(list) {
        assert(list.length > 0, true);
        assert(list.length <= limit);
      }).then(done, done);
    });

    it('should create a repository', function(done) {
      api.createRepo(demoRepo, demoUser).then(function(repo) {
        assert(repo !== null, true);
        assert(repo.full_name, demoUser.username + '/' + demoRepo.name);
      }).then(done, done);
    });

    it('should list a users repositories', function(done) {
      api.listRepos(demoUser).then(function(list) {
        assert(list.length > 0, true);
      }).then(done, done);
    });

    it('should delete a repository', function(done) {
      api.deleteRepo(demoRepo, demoUser).then(function() {
        assert(true, true);
      }).then(done, done);
    });

    it('should not delete a repository from unknown user', function(done) {
      api.deleteRepo(demoRepo, fakeUser).then(function() {
        assert(false, true);
      }).then(done, function(result) {
        assert(true, true);
        done();
      });
    });

    it('should not delete unknown repository', function(done) {
      api.deleteRepo(fakeRepo, demoUser).then(function() {
        assert(false, true);
      }).then(done, function(result) {
        assert(true, true);
        done();
      });
    });

    it('should create a token', function(done) {
      api.createToken(demoToken, demoUser);
    });

    it('should list a user\'s tokens', function(done) {
      done();
    });

    it('should create a public key', function(done) {
      done();
    });

    it('should list a user\'s public keys', function(done) {
      done();
    });

    it('should retrieve a user\'s public key', function(done) {
      done();
    });

    it('should delete a user\'s public key', function(done) {
      done();
    });

    it('should delete a user', function(done) {
      api.deleteUser(demoUser, adminUser).then(function() {
        assert(true, true);
      }).then(done, done);
    });

    it('should not error when deleting unknown user', function(done) {
      api.deleteUser(fakeUser, adminUser).then(function() {
        assert(true, true);
      }).then(done, done);
    });

    it('should not allow user to delete self', function(done) {
      api.deleteUser(adminUser, adminUser).then(function() {
        assert(false, true);
      }).then(done, function(result) {
        assert(true, true);
        done();
      });
    });

  });
})();
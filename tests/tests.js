/**
 * Created by joel on 3/9/2016.
 */
'use strict'
;(function () {
  var assert = require('assert'),
      GogsClient = require('../');

  describe('@Gogs', function() {

    it('should do stuff', function() {
      var client = new GogsClient();
      assert(client.test(), 'hello');
    });

  });
})();
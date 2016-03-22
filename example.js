var GogsClient = require('gogs-client');
var api = new GogsClient('https://try.gogs.io/api/v1');
api.searchRepos('gogs', 0, 5).then(function(list) {
    console.log(list);
});
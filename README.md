[![Build Status](https://travis-ci.org/unfoldingWord-dev/node-gogs-client.svg?branch=master)](https://travis-ci.org/unfoldingWord-dev/node-gogs-client)

# node-gogs-client
A client library for interacting with the [Gogs](https://gogs.io) REST api. This library is written to communicate according to the api defined in [gogits/go-gogs-client](https://github.com/gogits/go-gogs-client/wiki).

Everything returns a promise!

##Supported Operations
* create user
* edit user
* search users
* get user
* delete user
* search repositories
* list user repositories
* create repository
* get repository
* delete repository
* create application token
* list application tokens
* create public key
* get public key
* list public keys
* delete public key

## Installation
```
npm install gogs-client
```

## Examples
```
var GogsClient = require('gogs-client');
var api = new GogsClient('https://try.gogs.io/api/v1');
api.searchRepos('gogs', 0, 5).then(function(list) {
    console.log(list);
});
```

## Testing
In order to run the tests you'll need to create a `config.json` file in the test directory.
See the `sample.config.json` to get started.
You probably only need to change where the api points to and the credentials for the admin user.
Once configured you may run the following:
```
gulp test
```

> NOTE: some tests are designed to test custom changes to the api used in git.door43.org. These tests are prefixed with `v2`. Although these tests may fail when ran against a v1 gogs api the library should still function correctly with a v1 api, you just won't have v2 functionality.

##Method Arguments/Results
The format of data passed into/out-of a method closely matches that of the [GOGS API](https://github.com/gogits/go-gogs-client/wiki).

To get you started here are some basic objects and their properites

###User
```
{
  "username": ""
  "password": "",
  "token": ""
}
```

Not every property is required. The token will always take precedence over the username and password when used to authenticate a request.

Some methods require two users, one of which is the auth user. This allows you to control what account is authenticating the request. The user object used to authenticate a request must provide either a token or a username and password.

All methods are documented and indicate which properties are required for each argument.